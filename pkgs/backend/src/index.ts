import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { getProviderConfigFromEnv } from 'shared-infra/network'
import { createAppLogger } from 'shared-infra/logger'

const app = new Hono()

app.get('/', (c) => {
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
