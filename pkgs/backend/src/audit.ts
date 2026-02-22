import type { Context } from "hono";
import { Hono } from "hono";
import { authorizeScopes, type Role, type Scope } from "shared-infra/authz";
import { createAppLogger } from "shared-infra/logger";
import { createHash } from "node:crypto";

export type AuditTargetType = "participant" | "consent" | "request" | "audit";
export type AuditResult = "ok" | "error";

export interface AuditEvent {
  seq: number;
  timestampMs: number;
  actorRole: Role;
  action: string;
  targetType: AuditTargetType;
  targetId: string;
  result: AuditResult;
  detail?: Record<string, unknown>;
  prevHash: string;
  hash: string;
}

export interface AuditFilter {
  fromMs?: number;
  toMs?: number;
  actorRole?: Role;
  targetType?: AuditTargetType;
  targetId?: string;
  action?: string;
  result?: AuditResult;
}

export interface ExportJob {
  jobId: string;
  requesterRole: Role;
  fromMs: number;
  toMs: number;
  createdAtMs: number;
  status: "completed" | "failed";
  eventCount: number;
  headSeq: number | null;
  tailSeq: number | null;
  headHash: string | null;
  tailHash: string | null;
  error?: string;
}

const MAX_EXPORT_RANGE_MS = 31 * 24 * 60 * 60 * 1000;

const logger = createAppLogger({ name: "audit" });

const events: AuditEvent[] = [];
const exportJobs: Map<string, ExportJob> = new Map();

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

function computeHash(payload: string): string {
  return createHash("sha256").update(payload).digest("hex");
}

export function recordAuditEvent(input: {
  timestampMs?: number;
  actorRole: Role;
  action: string;
  targetType: AuditTargetType;
  targetId: string;
  result: AuditResult;
  detail?: Record<string, unknown>;
}): AuditEvent {
  const seq = events.length + 1;
  const ts = input.timestampMs ?? Date.now();
  const prevHash = events.length === 0 ? "GENESIS" : events[events.length - 1].hash;
  const base = {
    seq,
    timestampMs: ts,
    actorRole: input.actorRole,
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId,
    result: input.result,
    detail: input.detail,
    prevHash,
  };
  const payload = JSON.stringify(base);
  const hash = computeHash(payload);
  const event: AuditEvent = { ...base, hash };
  events.push(event);
  return event;
}

function search(filter: AuditFilter): AuditEvent[] {
  return events.filter((e) => {
    if (typeof filter.fromMs === "number" && e.timestampMs < filter.fromMs) return false;
    if (typeof filter.toMs === "number" && e.timestampMs > filter.toMs) return false;
    if (filter.actorRole && e.actorRole !== filter.actorRole) return false;
    if (filter.targetType && e.targetType !== filter.targetType) return false;
    if (filter.targetId && e.targetId !== filter.targetId) return false;
    if (filter.action && e.action !== filter.action) return false;
    if (filter.result && e.result !== filter.result) return false;
    return true;
  });
}

function verifyChain(): { ok: boolean; issues: Array<{ seq: number; reason: string }> } {
  const issues: Array<{ seq: number; reason: string }> = [];
  let expectedPrevHash = "GENESIS";
  let expectedSeq = 1;
  for (const e of events) {
    if (e.seq !== expectedSeq) {
      issues.push({ seq: e.seq, reason: "SEQ_MISMATCH" });
    }
    if (e.prevHash !== expectedPrevHash) {
      issues.push({ seq: e.seq, reason: "PREV_HASH_MISMATCH" });
    }
    const { hash, ...rest } = e;
    const recomputed = computeHash(JSON.stringify({ ...rest }));
    if (recomputed !== hash) {
      issues.push({ seq: e.seq, reason: "HASH_MISMATCH" });
    }
    expectedPrevHash = e.hash;
    expectedSeq += 1;
  }
  return { ok: issues.length === 0, issues };
}

function genExportJobId(): string {
  return `audit-exp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildAuditRouter(): Hono {
  const router = new Hono();

  router.get("/events", (c) => {
    const denied = authzOrResponse(c, ["audit:read"]);
    if (denied) return denied;
    const fromMs = c.req.query("fromMs") ? Number(c.req.query("fromMs")) : undefined;
    const toMs = c.req.query("toMs") ? Number(c.req.query("toMs")) : undefined;
    const actorRole = c.req.query("actorRole") as Role | undefined;
    const targetType = c.req.query("targetType") as AuditTargetType | undefined;
    const targetId = c.req.query("targetId") || undefined;
    const action = c.req.query("action") || undefined;
    const result = c.req.query("result") as AuditResult | undefined;
    const items = search({ fromMs, toMs, actorRole, targetType, targetId, action, result });
    return c.json({ items, total: items.length });
  });

  router.post("/verify", async (c) => {
    const denied = authzOrResponse(c, ["audit:read"]);
    if (denied) return denied;
    const res = verifyChain();
    if (!res.ok) {
      recordAuditEvent({
        actorRole: ((c.req.header("x-role")?.toLowerCase() as Role) ?? "external"),
        action: "audit.integrity-alert",
        targetType: "audit",
        targetId: "chain",
        result: "error",
        detail: { issues: res.issues },
      });
      logger.warn({ issues: res.issues }, "Audit chain verification failed");
    }
    return c.json(res, res.ok ? 200 : 409);
  });

  router.post("/export", async (c) => {
    const denied = authzOrResponse(c, ["audit:export"]);
    if (denied) return denied;
    const body = await c.req.json<{ fromMs: number; toMs: number }>();
    const now = Date.now();
    const fromMs = typeof body.fromMs === "number" ? body.fromMs : now - MAX_EXPORT_RANGE_MS;
    const toMs = typeof body.toMs === "number" ? body.toMs : now;
    if (toMs - fromMs > MAX_EXPORT_RANGE_MS) {
      return c.json({ error: "RANGE_TOO_LARGE", maxMs: MAX_EXPORT_RANGE_MS }, 400);
    }
    const items = search({ fromMs, toMs });
    const jobId = genExportJobId();
    const job: ExportJob = {
      jobId,
      requesterRole: ((c.req.header("x-role")?.toLowerCase() as Role) ?? "external"),
      fromMs,
      toMs,
      createdAtMs: now,
      status: "completed",
      eventCount: items.length,
      headSeq: items.length > 0 ? items[0].seq : null,
      tailSeq: items.length > 0 ? items[items.length - 1].seq : null,
      headHash: items.length > 0 ? items[0].hash : null,
      tailHash: items.length > 0 ? items[items.length - 1].hash : null,
    };
    exportJobs.set(jobId, job);
    recordAuditEvent({
      actorRole: job.requesterRole,
      action: "audit.export",
      targetType: "audit",
      targetId: jobId,
      result: "ok",
      detail: { fromMs, toMs, count: items.length },
    });
    return c.json({ job, items });
  });

  router.get("/exports/:jobId", (c) => {
    const denied = authzOrResponse(c, ["audit:read"]);
    if (denied) return denied;
    const jobId = c.req.param("jobId");
    const job = exportJobs.get(jobId);
    if (!job) return c.json({ error: "NOT_FOUND" }, 404);
    return c.json({ job });
  });

  return router;
}

