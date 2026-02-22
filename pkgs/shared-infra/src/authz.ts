export type Role = "system" | "operator" | "auditor" | "participant" | "external";

export type Scope =
  | "request:submit"
  | "request:read"
  | "participant:register"
  | "participant:update"
  | "consent:write"
  | "consent:revoke"
  | "audit:read"
  | "audit:export"
  | "ops:metrics:read"
  | "ops:deploy"
  | "ops:invoke";

export type AuthzErrorCode = "ROLE_UNSUPPORTED" | "SCOPE_MISSING";

export interface AuthorizationDecision {
  allowed: boolean;
  reason: AuthzErrorCode;
  missingScopes: Scope[];
}

export interface AuthzContext {
  roleText?: string;
  scopesText?: string;
  fallbackRole?: Role;
}

const ROLE_SCOPE_MAP: Record<Role, Scope[]> = {
  system: [
    "request:submit",
    "request:read",
    "participant:register",
    "participant:update",
    "consent:write",
    "consent:revoke",
    "audit:read",
    "audit:export",
    "ops:metrics:read",
    "ops:deploy",
    "ops:invoke",
  ],
  operator: [
    "request:submit",
    "request:read",
    "participant:register",
    "participant:update",
    "consent:write",
    "consent:revoke",
    "audit:read",
    "ops:metrics:read",
    "ops:deploy",
    "ops:invoke",
  ],
  auditor: ["request:read", "audit:read", "audit:export", "ops:metrics:read"],
  participant: ["request:submit", "request:read", "consent:write", "consent:revoke"],
  external: ["request:submit"],
};

const ALL_SCOPES: Set<Scope> = new Set(
  Object.values(ROLE_SCOPE_MAP).flat(),
);

const normalizeRole = (value: string | undefined): Role | null => {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  switch (normalized) {
    case "system":
    case "operator":
    case "auditor":
    case "participant":
    case "external":
      return normalized;
    default:
      return null;
  }
};

export const parseScopes = (value: string | undefined): Scope[] => {
  if (!value) return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter((s): s is Scope => ALL_SCOPES.has(s as Scope));
};

export const authorizeScopes = (
  context: AuthzContext,
  requiredScopes: Scope[],
): AuthorizationDecision => {
  const fallbackRole: Role = context.fallbackRole ?? "external";
  const role: Role | null = context.roleText
    ? normalizeRole(context.roleText)
    : fallbackRole;
  if (role === null) {
    return { allowed: false, reason: "ROLE_UNSUPPORTED", missingScopes: requiredScopes };
  }
  const baseScopes: Set<Scope> = new Set(ROLE_SCOPE_MAP[role]);
  const extraScopes: Scope[] = parseScopes(context.scopesText);
  for (const scope of extraScopes) {
    baseScopes.add(scope);
  }
  const missingScopes: Scope[] = requiredScopes.filter(
    (requiredScope) => !baseScopes.has(requiredScope),
  );
  if (missingScopes.length > 0) {
    return { allowed: false, reason: "SCOPE_MISSING", missingScopes };
  }
  return { allowed: true, reason: "SCOPE_MISSING", missingScopes: [] };
};

export const assertAuthorized = (
  context: AuthzContext,
  requiredScopes: Scope[],
): void => {
  const decision = authorizeScopes(context, requiredScopes);
  if (!decision.allowed) {
    const missing = decision.missingScopes.join(",");
    throw new Error(`AUTHZ_DENIED:${decision.reason}:${missing}`);
  }
};

export const loadAuthzContextFromEnv = (
  fallbackRole: Role = "system",
): AuthzContext => ({
  roleText: process.env.NEXTMED_ROLE,
  scopesText: process.env.NEXTMED_SCOPES,
  fallbackRole,
});

