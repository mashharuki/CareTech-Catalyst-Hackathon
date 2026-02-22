import type { Context } from "hono";
import { Hono } from "hono";
import { authorizeScopes, type Scope } from "shared-infra/authz";
import { createAppLogger } from "shared-infra/logger";
import { recordAuditEvent } from "./audit.js";
import { type EvaluateConsentBody, evaluateConsentLocal } from "./consents.js";
import { enqueueOutboxForRequest } from "./outbox.js";
import { getParticipantByIdSnapshot, type Participant } from "./participants.js";

type RequestStatus = "received" | "approved" | "rejected";

interface IntegrationRequest {
  trackingId: string;
  requesterId: string;
  consentId: string;
  dataType: string;
  recipient: string;
  purpose: string;
  timestampMs: number;
  status: RequestStatus;
  reason?: string;
  evaluation?: {
    consent: { allowed: boolean; reason?: string; version?: number };
    participant?: { active: boolean; trust: Participant["trustLevel"] | null };
  };
  createdAtMs: number;
  updatedAtMs: number;
  notifyResult?: { delivered: boolean; error?: string; timestampMs: number };
}

interface SubmitBody {
  requesterId: string;
  consentId: string;
  dataType: string;
  recipient: string;
  purpose: string;
  timestampMs?: number;
}

interface ValidationIssue {
  field: string;
  message: string;
}

const requestsById: Map<string, IntegrationRequest> = new Map();

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

function validateSubmit(body: SubmitBody): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!body.requesterId || body.requesterId.trim().length < 3)
    issues.push({ field: "requesterId", message: "必須" });
  if (!body.consentId || body.consentId.trim().length < 3)
    issues.push({ field: "consentId", message: "必須" });
  if (!body.dataType) issues.push({ field: "dataType", message: "必須" });
  if (!body.recipient) issues.push({ field: "recipient", message: "必須" });
  if (!body.purpose) issues.push({ field: "purpose", message: "必須" });
  return issues;
}

function genTrackingId(): string {
  const r = Math.random().toString(36).slice(2, 8);
  return `req-${Date.now()}-${r}`;
}

function evaluateUnified(
  p: Participant | undefined,
  consentEval: { allowed: boolean; reason?: string; version?: number },
): { status: RequestStatus; reason?: string; participantOk: boolean } {
  if (!p) return { status: "rejected", reason: "REQUESTER_NOT_FOUND", participantOk: false };
  if (p.status !== "active") return { status: "rejected", reason: "PARTICIPANT_INACTIVE", participantOk: false };
  const trustOk = p.trustLevel === "high" || p.trustLevel === "medium";
  if (!trustOk) return { status: "rejected", reason: "TRUST_LEVEL_LOW", participantOk: false };
  if (!consentEval.allowed) return { status: "rejected", reason: consentEval.reason || "CONSENT_DENIED", participantOk: true };
  return { status: "approved", participantOk: true };
}

export function buildRequestsRouter(): Hono {
  const router = new Hono();
  const logger = createAppLogger({ name: "requests" });

  router.post("/submit", async (c) => {
    const denied = authzOrResponse(c, ["request:submit"]);
    if (denied) return denied;
    const body: SubmitBody = await c.req.json();
    const issues = validateSubmit(body);
    if (issues.length > 0) return c.json({ error: "VALIDATION_FAILED", issues }, 400);

    const nowMs: number = Date.now();
    const trackingId = genTrackingId();
    const p = getParticipantByIdSnapshot(body.requesterId);
    const consentInput: EvaluateConsentBody = {
      consentId: body.consentId,
      dataType: body.dataType,
      recipient: body.recipient,
      purpose: body.purpose,
      timestampMs: body.timestampMs ?? nowMs,
    };
    const consentEval = evaluateConsentLocal(consentInput);
    const unified = evaluateUnified(p, consentEval);
    const req: IntegrationRequest = {
      trackingId,
      requesterId: body.requesterId.trim(),
      consentId: body.consentId.trim(),
      dataType: body.dataType,
      recipient: body.recipient,
      purpose: body.purpose,
      timestampMs: consentInput.timestampMs!,
      status: unified.status,
      reason: unified.reason,
      evaluation: {
        consent: consentEval,
        participant: p
          ? { active: p.status === "active", trust: p.trustLevel }
          : { active: false, trust: null },
      },
      createdAtMs: nowMs,
      updatedAtMs: nowMs,
    };
    requestsById.set(trackingId, req);
    logger.info({ trackingId, status: req.status }, "Integration request evaluated");
    recordAuditEvent({
      actorRole: ((c.req.header("x-role")?.toLowerCase() as any) ?? "external"),
      action: "request.submit",
      targetType: "request",
      targetId: trackingId,
      result: req.status === "approved" ? "ok" : "error",
      detail: { reason: req.reason },
    });
    if (req.status === "approved") {
      const simAnchor = c.req.header("x-simulate-anchor") as "ok" | "fail" | undefined;
      const simAudit = c.req.header("x-simulate-audit") as "ok" | "fail" | undefined;
      enqueueOutboxForRequest({
        trackingId,
        requesterId: body.requesterId,
        consentId: body.consentId,
        dataType: body.dataType,
        recipient: body.recipient,
        purpose: body.purpose,
      }, { simulateAnchor: simAnchor, simulateAudit: simAudit });
    }
    return c.json({ ok: true, trackingId, status: req.status, reason: req.reason }, 201);
  });

  router.get("/:trackingId", (c) => {
    const denied = authzOrResponse(c, ["request:read"]);
    if (denied) return denied;
    const id = c.req.param("trackingId");
    const r = requestsById.get(id);
    if (!r) return c.json({ error: "NOT_FOUND" }, 404);
    return c.json({ request: r });
  });

  router.post("/:trackingId/notify", async (c) => {
    const denied = authzOrResponse(c, ["ops:invoke"]);
    if (denied) return denied;
    const id = c.req.param("trackingId");
    const r = requestsById.get(id);
    if (!r) return c.json({ error: "NOT_FOUND" }, 404);
    const simulate = c.req.header("x-simulate-notify");
    const success = simulate === "ok";
    const nowMs: number = Date.now();
    r.notifyResult = {
      delivered: !!success,
      error: success ? undefined : "DELIVERY_FAILED",
      timestampMs: nowMs,
    };
    r.updatedAtMs = nowMs;
    recordAuditEvent({
      actorRole: ((c.req.header("x-role")?.toLowerCase() as any) ?? "external"),
      action: "request.notify",
      targetType: "request",
      targetId: id,
      result: success ? "ok" : "error",
      detail: { delivered: success },
    });
    return c.json({ delivered: r.notifyResult.delivered, error: r.notifyResult.error }, success ? 202 : 503);
  });

  return router;
}
