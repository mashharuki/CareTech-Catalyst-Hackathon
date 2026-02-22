import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { authorizeScopes } from "shared-infra/authz";
import { createAppLogger } from "shared-infra/logger";
import { getProviderConfigFromEnv } from "shared-infra/network";
import { buildConsentsRouter } from "./consents.js";
import { buildAuditRouter } from "./audit.js";
import { buildRequestsRouter } from "./requests.js";
import { buildParticipantsRouter } from "./participants.js";

const app = new Hono();

app.get("/", (c) => {
  const decision = authorizeScopes(
    {
      roleText: c.req.header("x-role"),
      scopesText: c.req.header("x-scopes"),
      fallbackRole: "external",
    },
    ["ops:metrics:read"],
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
  return c.text("Hello Hono!");
});

// 参加者管理APIをマウント
app.route("/api/participants", buildParticipantsRouter());
// 同意管理APIをマウント
app.route("/api/consents", buildConsentsRouter());
// 監査APIをマウント
app.route("/api/audit", buildAuditRouter());
// 連携要求判定APIをマウント
app.route("/api/requests", buildRequestsRouter());

// 共通プロバイダ設定とロガーの初期化
const providerCfg = getProviderConfigFromEnv();
const logger = createAppLogger({ name: "trustbridge-backend" });
logger.info({ providerCfg }, "Provider configuration loaded");

serve(
  {
    fetch: app.fetch,
    port: 3001,
  },
  (info) => {
    logger.info({ port: info.port }, `Server is running`);
  },
);
