import type { Context } from "hono";
import { Hono } from "hono";
import { authorizeScopes, type Scope } from "shared-infra/authz";
import { createAppLogger } from "shared-infra/logger";
import { recordAuditEvent } from "./audit.js";
import { type EvaluateConsentBody, evaluateConsentLocal } from "./consents.js";
import { getParticipantByIdSnapshot } from "./participants.js";

type OutboxJobStatus =
  | "pending"
  | "retrying"
  | "processing"
  | "succeeded"
  | "failed"
  | "compensating"
  | "compensated"
  | "on_hold";

type OutboxStep = "anchor" | "auditConfirm";

interface OutboxJobPayload {
  trackingId: string;
  requesterId: string;
  consentId: string;
  dataType: string;
  recipient: string;
  purpose: string;
}

interface OutboxJob {
  id: string;
  payload: OutboxJobPayload;
  status: OutboxJobStatus;
  stepIndex: number;
  steps: OutboxStep[];
  attempts: number;
  maxAttempts: number;
  nextAttemptAtMs: number;
  backoffBaseMs: number;
  simulateAnchor?: "ok" | "fail";
  simulateAudit?: "ok" | "fail";
  anchorReceipt?: string;
  errors: Array<{ step: OutboxStep; message: string; timestampMs: number }>;
  createdAtMs: number;
  updatedAtMs: number;
}

const logger = createAppLogger({ name: "outbox" });
const jobs: Map<string, OutboxJob> = new Map();
let workerTimer: NodeJS.Timeout | null = null;

function authzOrResponse(c: Context, required: Scope[]) {
  const decision = authorizeScopes(
    {
      roleText: c.req.header("x-role"),
      scopesText: c.req.header("x-scopes"),
      fallbackRole: "external",
    },
    required,
  );
  if (!decision.allowed) {
    return c.json(
      {
        error: "AUTHZ_DENIED",
        reason: decision.reason,
        missingScopes: decision.missingScopes,
      },
      403,
    );
  }
  return null;
}

function genId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function enqueueOutboxForRequest(
  payload: OutboxJobPayload,
  opts?: { simulateAnchor?: "ok" | "fail"; simulateAudit?: "ok" | "fail" },
): OutboxJob {
  const now = Date.now();
  const job: OutboxJob = {
    id: genId("outbox"),
    payload,
    status: "pending",
    stepIndex: 0,
    steps: ["anchor", "auditConfirm"],
    attempts: 0,
    maxAttempts: 5,
    nextAttemptAtMs: now,
    backoffBaseMs: 2000,
    simulateAnchor: opts?.simulateAnchor,
    simulateAudit: opts?.simulateAudit,
    anchorReceipt: undefined,
    errors: [],
    createdAtMs: now,
    updatedAtMs: now,
  };
  jobs.set(job.id, job);
  logger.info(
    { id: job.id, trackingId: payload.trackingId },
    "Outbox job enqueued",
  );
  return job;
}

function backoffDelay(base: number, attempts: number): number {
  const jitter = Math.floor(Math.random() * 500);
  return base * Math.pow(2, attempts) + jitter;
}

async function runAnchor(
  job: OutboxJob,
): Promise<{ ok: boolean; receipt?: string; error?: string }> {
  if (job.simulateAnchor === "fail") {
    return { ok: false, error: "ANCHOR_SIMULATED_FAILURE" };
  }
  const receipt = `anchr-${job.payload.trackingId}-${Date.now()}`;
  return { ok: true, receipt };
}

async function runAuditConfirm(
  job: OutboxJob,
): Promise<{ ok: boolean; error?: string }> {
  if (job.simulateAudit === "fail") {
    return { ok: false, error: "AUDIT_SIMULATED_FAILURE" };
  }
  recordAuditEvent({
    actorRole: "system",
    action: "anchor.confirm",
    targetType: "request",
    targetId: job.payload.trackingId,
    result: "ok",
    detail: { receipt: job.anchorReceipt },
  });
  return { ok: true };
}

async function compensateAnchor(
  job: OutboxJob,
): Promise<{ ok: boolean; error?: string }> {
  recordAuditEvent({
    actorRole: "system",
    action: "anchor.rollback",
    targetType: "request",
    targetId: job.payload.trackingId,
    result: "ok",
    detail: { receipt: job.anchorReceipt },
  });
  job.anchorReceipt = undefined;
  return { ok: true };
}

function shouldReevaluate(job: OutboxJob): boolean {
  return job.status === "retrying" || job.status === "on_hold";
}

function reEvaluate(job: OutboxJob): boolean {
  const p = getParticipantByIdSnapshot(job.payload.requesterId);
  if (!p || p.status !== "active") return false;
  if (!(p.trustLevel === "medium" || p.trustLevel === "high")) return false;
  const evalBody: EvaluateConsentBody = {
    consentId: job.payload.consentId,
    dataType: job.payload.dataType,
    recipient: job.payload.recipient,
    purpose: job.payload.purpose,
    timestampMs: Date.now(),
  };
  const res = evaluateConsentLocal(evalBody);
  return !!res.allowed;
}

async function processJob(job: OutboxJob): Promise<void> {
  job.status = "processing";
  job.updatedAtMs = Date.now();
  while (job.stepIndex < job.steps.length) {
    const current = job.steps[job.stepIndex];
    if (current === "anchor") {
      const r = await runAnchor(job);
      if (!r.ok) {
        job.attempts += 1;
        job.errors.push({
          step: "anchor",
          message: r.error || "ANCHOR_FAILED",
          timestampMs: Date.now(),
        });
        if (job.attempts >= job.maxAttempts) {
          job.status = "on_hold";
        } else {
          job.status = "retrying";
          job.nextAttemptAtMs =
            Date.now() + backoffDelay(job.backoffBaseMs, job.attempts);
        }
        job.updatedAtMs = Date.now();
        return;
      }
      job.anchorReceipt = r.receipt;
      job.stepIndex += 1;
      job.updatedAtMs = Date.now();
      continue;
    }
    if (current === "auditConfirm") {
      const r = await runAuditConfirm(job);
      if (!r.ok) {
        job.errors.push({
          step: "auditConfirm",
          message: r.error || "AUDIT_FAILED",
          timestampMs: Date.now(),
        });
        job.status = "compensating";
        job.updatedAtMs = Date.now();
        const comp = await compensateAnchor(job);
        if (comp.ok) {
          job.status = "compensated";
        } else {
          job.status = "failed";
        }
        job.updatedAtMs = Date.now();
        return;
      }
      job.stepIndex += 1;
      job.updatedAtMs = Date.now();
      continue;
    }
    break;
  }
  if (job.stepIndex >= job.steps.length) {
    job.status = "succeeded";
    job.updatedAtMs = Date.now();
  }
}

async function tick(): Promise<void> {
  const now = Date.now();
  for (const job of jobs.values()) {
    if (job.status === "pending" || job.status === "retrying") {
      if (job.nextAttemptAtMs <= now) {
        if (shouldReevaluate(job)) {
          if (!reEvaluate(job)) {
            job.status = "on_hold";
            job.updatedAtMs = Date.now();
            continue;
          }
        }
        await processJob(job);
      }
    }
  }
}

export function startOutboxWorker(): void {
  if (workerTimer) return;
  workerTimer = setInterval(() => {
    tick().catch((e) => logger.error({ err: String(e) }, "outbox tick error"));
  }, 1000);
  logger.info("Outbox worker started");
}

export function buildOutboxRouter(): Hono {
  const router = new Hono();

  router.get("/jobs", (c) => {
    const denied = authzOrResponse(c, ["ops:metrics:read"]);
    if (denied) return denied;
    const list = Array.from(jobs.values());
    return c.json({ items: list, total: list.length });
  });

  router.get("/jobs/:id", (c) => {
    const denied = authzOrResponse(c, ["ops:metrics:read"]);
    if (denied) return denied;
    const job = jobs.get(c.req.param("id"));
    if (!job) return c.json({ error: "NOT_FOUND" }, 404);
    return c.json({ job });
  });

  router.post("/jobs/:id/retry", async (c) => {
    const denied = authzOrResponse(c, ["ops:invoke"]);
    if (denied) return denied;
    const job = jobs.get(c.req.param("id"));
    if (!job) return c.json({ error: "NOT_FOUND" }, 404);
    job.status = "retrying";
    job.nextAttemptAtMs = Date.now();
    job.updatedAtMs = Date.now();
    await tick();
    return c.json({ ok: true, job });
  });

  router.post("/jobs/:id/requeue", async (c) => {
    const denied = authzOrResponse(c, ["ops:invoke"]);
    if (denied) return denied;
    const job = jobs.get(c.req.param("id"));
    if (!job) return c.json({ error: "NOT_FOUND" }, 404);
    if (!reEvaluate(job)) {
      job.status = "on_hold";
      job.updatedAtMs = Date.now();
      return c.json({ ok: false, reason: "RE_EVALUATION_FAILED", job }, 409);
    }
    job.status = "retrying";
    job.nextAttemptAtMs = Date.now();
    job.updatedAtMs = Date.now();
    await tick();
    return c.json({ ok: true, job });
  });

  router.post("/tick", async (c) => {
    const denied = authzOrResponse(c, ["ops:invoke"]);
    if (denied) return denied;
    await tick();
    return c.json({ ok: true });
  });

  return router;
}

export function getOutboxStats(): {
  total: number;
  byStatus: Record<string, number>;
} {
  const byStatus: Record<string, number> = {};
  for (const j of jobs.values()) {
    byStatus[j.status] = (byStatus[j.status] ?? 0) + 1;
  }
  return { total: jobs.size, byStatus };
}
