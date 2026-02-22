import type { Context } from "hono";
import { Hono } from "hono";
import { authorizeScopes, type Role, type Scope } from "shared-infra/authz";
import { createAppLogger } from "shared-infra/logger";

// 参加者の状態
export type ParticipantStatus = "active" | "suspended";
// 信頼レベル
export type TrustLevel = "low" | "medium" | "high";

// 状態遷移イベント
export interface TransitionEvent {
  // いつ、だれが、なぜ、何をしたか
  timestampMs: number;
  actorRole: Role;
  action: "register" | "activate" | "suspend" | "resume" | "trust-update";
  fromStatus?: ParticipantStatus;
  toStatus?: ParticipantStatus;
  fromTrust?: TrustLevel;
  toTrust?: TrustLevel;
  reason?: string;
}

// 参加者エンティティ
export interface Participant {
  id: string;
  name: string;
  organization: string;
  email: string;
  status: ParticipantStatus;
  trustLevel: TrustLevel;
  createdAtMs: number;
  updatedAtMs: number;
  history: TransitionEvent[];
}

// リクエストボディ: 登録
export interface RegisterRequestBody {
  id: string;
  name: string;
  organization: string;
  email: string;
  trustLevel?: TrustLevel;
}

// リクエストボディ: 状態/信頼レベル更新
export interface UpdateStateBody {
  action: "activate" | "suspend" | "resume";
  reason?: string;
  trustLevel?: TrustLevel;
}

// 単純なインメモリストア
const participantsById: Map<string, Participant> = new Map();
const emailIndex: Map<string, string> = new Map();

// バリデーション結果
interface ValidationIssue {
  field: string;
  message: string;
}

/**
 * 必須属性のバリデーション
 *
 * @param body 検証対象
 * @returns 問題リスト（空配列ならOK）
 */
function validateRegister(body: RegisterRequestBody): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!body.id || body.id.trim().length < 3) {
    issues.push({ field: "id", message: "idは3文字以上で必須です" });
  }
  if (!body.name || body.name.trim().length === 0) {
    issues.push({ field: "name", message: "nameは必須です" });
  }
  if (!body.organization || body.organization.trim().length === 0) {
    issues.push({ field: "organization", message: "organizationは必須です" });
  }
  if (!body.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(body.email)) {
    issues.push({ field: "email", message: "email形式が不正です" });
  }
  if (body.trustLevel && !["low", "medium", "high"].includes(body.trustLevel)) {
    issues.push({
      field: "trustLevel",
      message: "trustLevelはlow|medium|highのいずれか",
    });
  }
  return issues;
}

/**
 * ヘッダから認可判定を行う
 *
 * @param c Hono Context
 * @param required 必要スコープ
 */
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

/**
 * 参加者管理ルーターを構築する
 *
 * @returns Honoインスタンス
 */
export function buildParticipantsRouter(): Hono {
  const router = new Hono();
  const logger = createAppLogger({ name: "participants" });

  // 登録
  router.post("/register", async (c) => {
    const denied = authzOrResponse(c, ["participant:register"]);
    if (denied) return denied;
    const body: RegisterRequestBody = await c.req.json();
    const issues = validateRegister(body);
    if (issues.length > 0) {
      return c.json({ error: "VALIDATION_FAILED", issues }, 400);
    }
    if (participantsById.has(body.id)) {
      return c.json(
        {
          error: "DUPLICATE",
          issues: [{ field: "id", message: "既に登録されています" }],
        },
        409,
      );
    }
    const existingId = emailIndex.get(body.email.toLowerCase());
    if (existingId) {
      return c.json(
        {
          error: "DUPLICATE",
          issues: [{ field: "email", message: "メールは既に使用されています" }],
        },
        409,
      );
    }
    const nowMs: number = Date.now();
    const trust: TrustLevel = body.trustLevel ?? "medium";
    const participant: Participant = {
      id: body.id.trim(),
      name: body.name.trim(),
      organization: body.organization.trim(),
      email: body.email.trim(),
      status: "active",
      trustLevel: trust,
      createdAtMs: nowMs,
      updatedAtMs: nowMs,
      history: [
        {
          timestampMs: nowMs,
          actorRole:
            (c.req.header("x-role")?.toLowerCase() as Role) ?? "external",
          action: "register",
          toStatus: "active",
          toTrust: trust,
          reason: "initialization",
        },
      ],
    };
    participantsById.set(participant.id, participant);
    emailIndex.set(participant.email.toLowerCase(), participant.id);
    logger.info({ id: participant.id }, "Participant registered");
    return c.json({ ok: true, participant }, 201);
  });

  // 取得
  router.get("/:id", (c) => {
    const denied = authzOrResponse(c, ["request:read"]);
    if (denied) return denied;
    const id = c.req.param("id");
    const p = participantsById.get(id);
    if (!p) return c.json({ error: "NOT_FOUND" }, 404);
    return c.json({ participant: p });
  });

  // 一覧
  router.get("/", (c) => {
    const denied = authzOrResponse(c, ["request:read"]);
    if (denied) return denied;
    const items = Array.from(participantsById.values());
    return c.json({ participants: items });
  });

  // 状態/信頼レベル更新（統合フロー）
  router.post("/:id/state", async (c) => {
    const denied = authzOrResponse(c, ["participant:update"]);
    if (denied) return denied;
    const id = c.req.param("id");
    const p = participantsById.get(id);
    if (!p) return c.json({ error: "NOT_FOUND" }, 404);

    const body: UpdateStateBody = await c.req.json();
    const actor: Role =
      (c.req.header("x-role")?.toLowerCase() as Role) ?? "external";
    const nowMs: number = Date.now();
    let changed = false;

    // 状態遷移
    if (body.action) {
      const prev: ParticipantStatus = p.status;
      if (body.action === "suspend") {
        if (p.status !== "suspended") {
          p.status = "suspended";
          p.history.push({
            timestampMs: nowMs,
            actorRole: actor,
            action: "suspend",
            fromStatus: prev,
            toStatus: p.status,
            reason: body.reason,
          });
          changed = true;
        }
      } else if (body.action === "resume" || body.action === "activate") {
        if (p.status !== "active") {
          p.status = "active";
          p.history.push({
            timestampMs: nowMs,
            actorRole: actor,
            action: body.action,
            fromStatus: prev,
            toStatus: p.status,
            reason: body.reason,
          });
          changed = true;
        }
      } else {
        return c.json(
          {
            error: "VALIDATION_FAILED",
            issues: [
              { field: "action", message: "actionはactivate|suspend|resume" },
            ],
          },
          400,
        );
      }
    }

    // 信頼レベル更新
    if (body.trustLevel) {
      if (!["low", "medium", "high"].includes(body.trustLevel)) {
        return c.json(
          {
            error: "VALIDATION_FAILED",
            issues: [
              { field: "trustLevel", message: "trustLevelはlow|medium|high" },
            ],
          },
          400,
        );
      }
      const prevTrust: TrustLevel = p.trustLevel;
      if (prevTrust !== body.trustLevel) {
        p.trustLevel = body.trustLevel;
        p.history.push({
          timestampMs: nowMs,
          actorRole: actor,
          action: "trust-update",
          fromTrust: prevTrust,
          toTrust: p.trustLevel,
          reason: body.reason,
        });
        changed = true;
      }
    }

    if (changed) {
      p.updatedAtMs = nowMs;
    }
    return c.json({ ok: true, participant: p });
  });

  // 監査ログ取得
  router.get("/:id/audit", (c) => {
    const denied = authzOrResponse(c, ["audit:read"]);
    if (denied) return denied;
    const id = c.req.param("id");
    const p = participantsById.get(id);
    if (!p) return c.json({ error: "NOT_FOUND" }, 404);
    return c.json({ history: p.history });
  });

  return router;
}
