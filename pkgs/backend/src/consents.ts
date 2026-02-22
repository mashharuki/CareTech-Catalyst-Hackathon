import type { Context } from 'hono'
import { Hono } from 'hono'
import { authorizeScopes, type Scope, type Role } from 'shared-infra/authz'
import { createAppLogger } from 'shared-infra/logger'

export interface ConsentVersion {
  version: number
  dataTypes: string[]
  recipients: string[]
  purposes: string[]
  validFromMs: number
  validToMs: number
  timestampMs: number
  actorRole: Role
  kind: 'register' | 'update' | 'partial-revoke'
  reason?: string
}

export interface Consent {
  id: string
  ownerId?: string
  createdAtMs: number
  updatedAtMs: number
  currentVersion: number
  versions: ConsentVersion[]
}

export interface RegisterConsentBody {
  id: string
  ownerId?: string
  dataTypes: string[]
  recipients: string[]
  purposes: string[]
  validFromMs: number
  validToMs: number
}

export interface UpdateConsentBody {
  dataTypes: string[]
  recipients: string[]
  purposes: string[]
  validFromMs: number
  validToMs: number
  reason?: string
}

export interface PartialRevokeBody {
  dataTypes?: string[]
  recipients?: string[]
  purposes?: string[]
  reason?: string
}

export interface EvaluateConsentBody {
  consentId: string
  dataType: string
  recipient: string
  purpose: string
  timestampMs?: number
}

const consentsById: Map<string, Consent> = new Map()

interface ValidationIssue {
  field: string
  message: string
}

function notEmptyStringArray(arr: unknown): arr is string[] {
  return Array.isArray(arr) && arr.length > 0 && arr.every((x) => typeof x === 'string' && x.trim().length > 0)
}

function validateRegister(body: RegisterConsentBody): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  if (!body.id || body.id.trim().length < 3) issues.push({ field: 'id', message: 'idは3文字以上で必須です' })
  if (!notEmptyStringArray(body.dataTypes)) issues.push({ field: 'dataTypes', message: 'dataTypesは非空の文字列配列' })
  if (!notEmptyStringArray(body.recipients)) issues.push({ field: 'recipients', message: 'recipientsは非空の文字列配列' })
  if (!notEmptyStringArray(body.purposes)) issues.push({ field: 'purposes', message: 'purposesは非空の文字列配列' })
  if (typeof body.validFromMs !== 'number' || typeof body.validToMs !== 'number')
    issues.push({ field: 'validFromMs/validToMs', message: '有効期間は数値ミリ秒' })
  else if (body.validFromMs > body.validToMs) issues.push({ field: 'validity', message: 'validFromMs <= validToMs が必要' })
  return issues
}

function validateUpdate(body: UpdateConsentBody): ValidationIssue[] {
  return validateRegister({ id: 'dummy', ...body })
}

function authzOrResponse(c: Context, required: Scope[]) {
  const decision = authorizeScopes(
    {
      roleText: c.req.header('x-role'),
      scopesText: c.req.header('x-scopes'),
      fallbackRole: 'external',
    },
    required,
  )
  if (!decision.allowed) {
    return c.json({ error: 'AUTHZ_DENIED', reason: decision.reason, missingScopes: decision.missingScopes }, 403)
  }
  return null
}

export function buildConsentsRouter(): Hono {
  const router = new Hono()
  const logger = createAppLogger({ name: 'consents' })

  router.post('/register', async (c) => {
    const denied = authzOrResponse(c, ['consent:write'])
    if (denied) return denied
    const body: RegisterConsentBody = await c.req.json()
    const issues = validateRegister(body)
    if (issues.length > 0) return c.json({ error: 'VALIDATION_FAILED', issues }, 400)
    if (consentsById.has(body.id)) return c.json({ error: 'DUPLICATE', issues: [{ field: 'id', message: '既に存在します' }] }, 409)
    const nowMs: number = Date.now()
    const actor: Role = (c.req.header('x-role')?.toLowerCase() as Role) ?? 'external'
    const v1: ConsentVersion = {
      version: 1,
      dataTypes: [...new Set(body.dataTypes.map((s) => s.trim()))],
      recipients: [...new Set(body.recipients.map((s) => s.trim()))],
      purposes: [...new Set(body.purposes.map((s) => s.trim()))],
      validFromMs: body.validFromMs,
      validToMs: body.validToMs,
      timestampMs: nowMs,
      actorRole: actor,
      kind: 'register',
    }
    const cst: Consent = {
      id: body.id.trim(),
      ownerId: body.ownerId?.trim(),
      createdAtMs: nowMs,
      updatedAtMs: nowMs,
      currentVersion: 1,
      versions: [v1],
    }
    consentsById.set(cst.id, cst)
    logger.info({ id: cst.id }, 'Consent registered')
    return c.json({ ok: true, consent: cst }, 201)
  })

  router.get('/:id', (c) => {
    const denied = authzOrResponse(c, ['request:read'])
    if (denied) return denied
    const id = c.req.param('id')
    const cst = consentsById.get(id)
    if (!cst) return c.json({ error: 'NOT_FOUND' }, 404)
    return c.json({ consent: cst })
  })

  router.get('/:id/history', (c) => {
    const denied = authzOrResponse(c, ['request:read'])
    if (denied) return denied
    const id = c.req.param('id')
    const cst = consentsById.get(id)
    if (!cst) return c.json({ error: 'NOT_FOUND' }, 404)
    return c.json({ versions: cst.versions })
  })

  router.post('/:id/update', async (c) => {
    const denied = authzOrResponse(c, ['consent:write'])
    if (denied) return denied
    const id = c.req.param('id')
    const cst = consentsById.get(id)
    if (!cst) return c.json({ error: 'NOT_FOUND' }, 404)
    const body: UpdateConsentBody = await c.req.json()
    const issues = validateUpdate(body)
    if (issues.length > 0) return c.json({ error: 'VALIDATION_FAILED', issues }, 400)
    const nowMs: number = Date.now()
    const actor: Role = (c.req.header('x-role')?.toLowerCase() as Role) ?? 'external'
    const v: ConsentVersion = {
      version: cst.currentVersion + 1,
      dataTypes: [...new Set(body.dataTypes.map((s) => s.trim()))],
      recipients: [...new Set(body.recipients.map((s) => s.trim()))],
      purposes: [...new Set(body.purposes.map((s) => s.trim()))],
      validFromMs: body.validFromMs,
      validToMs: body.validToMs,
      timestampMs: nowMs,
      actorRole: actor,
      kind: 'update',
      reason: body.reason,
    }
    cst.versions.push(v)
    cst.currentVersion = v.version
    cst.updatedAtMs = nowMs
    return c.json({ ok: true, consent: cst })
  })

  router.post('/:id/partial-revoke', async (c) => {
    const denied = authzOrResponse(c, ['consent:revoke'])
    if (denied) return denied
    const id = c.req.param('id')
    const cst = consentsById.get(id)
    if (!cst) return c.json({ error: 'NOT_FOUND' }, 404)
    const body: PartialRevokeBody = await c.req.json()
    const prev = cst.versions[cst.versions.length - 1]
    let newDataTypes = prev.dataTypes
    let newRecipients = prev.recipients
    let newPurposes = prev.purposes
    if (Array.isArray(body.dataTypes) && body.dataTypes.length > 0) {
      const set = new Set(body.dataTypes)
      newDataTypes = prev.dataTypes.filter((x) => !set.has(x))
    }
    if (Array.isArray(body.recipients) && body.recipients.length > 0) {
      const set = new Set(body.recipients)
      newRecipients = prev.recipients.filter((x) => !set.has(x))
    }
    if (Array.isArray(body.purposes) && body.purposes.length > 0) {
      const set = new Set(body.purposes)
      newPurposes = prev.purposes.filter((x) => !set.has(x))
    }
    const nowMs: number = Date.now()
    const actor: Role = (c.req.header('x-role')?.toLowerCase() as Role) ?? 'external'
    const v: ConsentVersion = {
      version: cst.currentVersion + 1,
      dataTypes: newDataTypes,
      recipients: newRecipients,
      purposes: newPurposes,
      validFromMs: prev.validFromMs,
      validToMs: prev.validToMs,
      timestampMs: nowMs,
      actorRole: actor,
      kind: 'partial-revoke',
      reason: body.reason,
    }
    cst.versions.push(v)
    cst.currentVersion = v.version
    cst.updatedAtMs = nowMs
    return c.json({ ok: true, consent: cst })
  })

  router.post('/evaluate', async (c) => {
    const denied = authzOrResponse(c, ['request:submit'])
    if (denied) return denied
    const body: EvaluateConsentBody = await c.req.json()
    const cst = consentsById.get(body.consentId)
    if (!cst) return c.json({ allowed: false, reason: 'CONSENT_NOT_FOUND' }, 404)
    const ver = cst.versions[cst.versions.length - 1]
    const now = typeof body.timestampMs === 'number' ? body.timestampMs : Date.now()
    if (now < ver.validFromMs || now > ver.validToMs) return c.json({ allowed: false, reason: 'OUT_OF_VALIDITY' })
    if (!ver.dataTypes.includes(body.dataType)) return c.json({ allowed: false, reason: 'DATA_TYPE_NOT_ALLOWED' })
    if (!ver.recipients.includes(body.recipient)) return c.json({ allowed: false, reason: 'RECIPIENT_NOT_ALLOWED' })
    if (!ver.purposes.includes(body.purpose)) return c.json({ allowed: false, reason: 'PURPOSE_NOT_ALLOWED' })
    return c.json({ allowed: true, version: ver.version })
  })

  return router
}
