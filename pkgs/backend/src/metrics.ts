import type { Context, MiddlewareHandler } from "hono";
import { Hono } from "hono";
import { authorizeScopes, type Scope } from "shared-infra/authz";
import { getOutboxStats } from "./outbox.js";
import { getAuditStats, getRecentAuditEvents } from "./audit.js";
import { getProviderConfigFromEnv } from "shared-infra/network";

type Stat = {
  path: string;
  count: number;
  success: number;
  error: number;
  totalMs: number;
  minMs: number;
  maxMs: number;
};

const stats: Map<string, Stat> = new Map();

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

export function metricsMiddleware(): MiddlewareHandler {
  return async (c, next) => {
    const start = Date.now();
    await next();
    const end = Date.now();
    const path = c.req.path;
    const dur = end - start;
    let s = stats.get(path);
    if (!s) {
      s = { path, count: 0, success: 0, error: 0, totalMs: 0, minMs: Infinity, maxMs: 0 };
      stats.set(path, s);
    }
    s.count += 1;
    s.totalMs += dur;
    if (dur < s.minMs) s.minMs = dur;
    if (dur > s.maxMs) s.maxMs = dur;
    if (c.res.status >= 200 && c.res.status < 400) s.success += 1;
    else s.error += 1;
  };
}

export function buildOpsRouter(): Hono {
  const router = new Hono();
  router.get("/metrics", (c) => {
    const denied = authzOrResponse(c, ["ops:metrics:read"]);
    if (denied) return denied;
    const items = Array.from(stats.values()).map((s) => ({
      path: s.path,
      count: s.count,
      success: s.success,
      error: s.error,
      avgMs: s.count > 0 ? Math.round(s.totalMs / s.count) : 0,
      minMs: s.minMs === Infinity ? 0 : s.minMs,
      maxMs: s.maxMs,
      successRate: s.count > 0 ? Number(((s.success / s.count) * 100).toFixed(2)) : 0,
    }));
    const outbox = getOutboxStats();
    const audit = getAuditStats();
    const recentAudit = getRecentAuditEvents(5);
    return c.json({ endpoints: items, outbox, audit, recentAudit });
  });
  router.get("/chain", async (c) => {
    const denied = authzOrResponse(c, ["ops:metrics:read"]);
    if (denied) return denied;
    const cfg = getProviderConfigFromEnv();
    const began = Date.now();
    let indexerOk = false;
    let indexerStatus = 0;
    try {
      const r = await fetch(cfg.indexer, { method: "GET" });
      indexerStatus = r.status;
      indexerOk = indexerStatus < 500;
    } catch {
      indexerOk = false;
    }
    const indexerLatencyMs = Date.now() - began;
    // contract package availability check
    let contractOk = false;
    try {
      const mod: any = await import("contract");
      // instantiate contract class if available
      if (mod && mod.Counter && mod.Counter.Contract && mod.witnesses) {
        // eslint-disable-next-line no-new
        new mod.Counter.Contract(mod.witnesses);
        contractOk = true;
      }
    } catch {
      contractOk = false;
    }
    return c.json({
      provider: { indexer: cfg.indexer, node: cfg.node, proofServer: cfg.proofServer },
      indexer: { ok: indexerOk, status: indexerStatus, latencyMs: indexerLatencyMs },
      contract: { ok: contractOk },
    });
  });
  return router;
}
