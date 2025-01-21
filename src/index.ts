#!/usr/bin/env node
import { init } from './init'
import { config, log } from './utils/helpers'
import { main } from './main'
import { getAuthTokens, isAccessTokenExpired, LocalState, refreshToken } from './utils/wrangler'

// Handle process events
process.on('uncaughtException', (error) => {
  log('Uncaught exception:', error)
})

process.on('unhandledRejection', (error) => {
  log('Unhandled rejection:', error)
})

const [cmd, ...args] = process.argv.slice(2)
if (cmd === 'init') {
  const [accountId, ...rest] = args
  if (rest.length > 0) {
    throw new Error(`Uso: npx @cloudflare/mcp-server-cloudflare init [account_id]`)
  }

  init(accountId)
} else if (cmd === 'run') {
  const [accountId, ...rest] = args
  if (!accountId && !config.accountId) {
    throw new Error(`Falta el account ID. Usage: npx @cloudflare/mcp-server-cloudflare run [account_id]`)
  }
  if (rest.length > 0) {
    throw new Error(`Muchos Argumentos. Usa así en la consola: npx @cloudflare/mcp-server-cloudflare run [account_id]`)
  }
  config.accountId = accountId

  if (!config.accountId || !config.apiToken) {
    getAuthTokens()

    if (isAccessTokenExpired()) {
      if (await refreshToken()) {
        console.log('Satisfactoriamente Accedió! con el Token')
      } else {
        console.log('Fallo con el Token')
      }
    }
    config.apiToken = LocalState.accessToken?.value
  }

  log(
    'Config loaded:',
    JSON.stringify({
      accountId: config.accountId ? '✓' : '✗',
      apiToken: config.apiToken ? '✓' : '✗',
    }),
  )

  // Comienza el Servidor
  main()
} else {
  throw new Error(`Unknown command: ${cmd}. Expected 'init' or 'run'.`)
}
