import { Hono } from "hono";
import { buildParticipantsRouter } from "../src/participants.js";
import { buildConsentsRouter } from "../src/consents.js";
import { buildRequestsRouter } from "../src/requests.js";
import { buildAuditRouter } from "../src/audit.js";
import { buildOutboxRouter } from "../src/outbox.js";
import { buildOpsRouter, metricsMiddleware } from "../src/metrics.js";

export function buildTestApp(): Hono {
  const app = new Hono();
  app.use("*", metricsMiddleware());
  app.route("/api/participants", buildParticipantsRouter());
  app.route("/api/consents", buildConsentsRouter());
  app.route("/api/requests", buildRequestsRouter());
  app.route("/api/audit", buildAuditRouter());
  app.route("/api/outbox", buildOutboxRouter());
  app.route("/api/ops", buildOpsRouter());
  return app;
}
