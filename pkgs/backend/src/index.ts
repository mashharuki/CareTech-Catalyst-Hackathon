import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { getProviderConfigFromEnv } from 'shared-infra/network'
import { createAppLogger } from 'shared-infra/logger'
import { authorizeScopes } from 'shared-infra/authz'

const app = new Hono()

app.get('/', (c) => {
  const decision = authorizeScopes(
    {
      roleText: c.req.header('x-role'),
      scopesText: c.req.header('x-scopes'),
      fallbackRole: 'external'
    },
    ['ops:metrics:read']
  )
  if (!decision.allowed) {
    return c.json(
      {
        error: 'AUTHZ_DENIED',
        reason: decision.reason,
        missingScopes: decision.missingScopes
      },
      403
    )
  }
  return c.text('Hello Hono!')
})

// 共通プロバイダ設定とロガーの初期化
const providerCfg = getProviderConfigFromEnv()
const logger = createAppLogger({ name: 'trustbridge-backend' })
logger.info({ providerCfg }, 'Provider configuration loaded')

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  logger.info({ port: info.port }, `Server is running`)
})
