// Shell out to `npx wrangler@latest whoami`
import { exec } from 'child_process'
import { promisify } from 'util'
import {
  AccountInfo,
  fetchInternal,
  FetchResult,
  getAuthTokens,
  isAccessTokenExpired,
  isDirectory,
  refreshToken,
} from './utils/wrangler'
import chalk from 'chalk'
import os from 'node:os'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'url'
import { createDialog, endSection, logRaw, startSection, updateStatus } from './utils/c3'
import { mcpCloudflareVersion } from './utils/helpers'
import which from 'which'

const __filename = fileURLToPath(import.meta.url)

const execAsync = promisify(exec)

export async function init(accountTag: string | undefined) {
  logRaw(
    createDialog([
      `👋 Bievenidos al ${chalk.yellow('mcp-server-cloudflare')} v${mcpCloudflareVersion}!`,
      `💁‍♀️ Este ${chalk.green("'init'")} proyecto ejemplo base para lanzar cualquiera en produccion usando todas las caracteristicas de Cloudflare API Cloudflare MCP Server Usando Claude Desktop (${chalk.blue.underline('https://claude.ai/download')})`,
      `ℹ️ Para mas información, visita ${chalk.blue.underline('https://github.com/cloudflare/mcp-server-cloudflare')}`,
      `🧡 1, 2, 3 Comenzemos! `,
    ]),
  )

  startSection(`Checkenando si esta configurado el Wrangler auth info`, `Paso 1 de 3`)
  updateStatus(chalk.gray(`Si cualquier cosa sale mal, preba con: 'npx wrangler@latest login' y prueba nuevamente pero Manual.`))

  try {
    getAuthTokens()
  } catch (e: any) {
    updateStatus(`${chalk.underline.red('Warning:')} ${chalk.gray(e.message)}`, false)
    updateStatus(`Corriendo '${chalk.yellow('npx wrangler login')}' y re-intentando...`, false)

    const { stderr, stdout } = await execAsync('npx wrangler@latest login')
    if (stderr) updateStatus(chalk.gray(stderr))

    getAuthTokens()
  }

  updateStatus(`Wrangler auth info loaded!`)

  if (isAccessTokenExpired()) {
    updateStatus(`Access token expired, refreshing...`, false)
    if (await refreshToken()) {
      updateStatus('Successfully refreshed access token')
    } else {
      throw new Error('Failed to refresh access token')
    }
  }

  endSection('Done')
  startSection(`Fetching account info`, `Step 2 of 3`)

  const { result: accounts } = await fetchInternal<FetchResult<AccountInfo[]>>('/accounts')

  let account: string
  switch (accounts.length) {
    case 0:
      throw new Error(`No accounts found. Run 'wrangler whoami' for more info.`)
    case 1:
      if (accountTag && accountTag !== accounts[0].id) {
        throw new Error(`You don't have access to account ${accountTag}. Leave blank to use ${accounts[0].id}.`)
      }
      account = accounts[0].id
      break
    default:
      if (!accountTag) {
        throw new Error(
          `${chalk.red('Multiple accounts found.')}\nUse ${chalk.yellow('npx @cloudflare/mcp-server-cloudflare init [account_id]')} to specify which account to use.\nYou have access to:\n${accounts.map((a) => `  • ${a.name} — ${a.id}`).join('\n')}`,
        )
      }
      account = accountTag
      break
  }

  updateStatus(`Using account: ${chalk.yellow(account)}`)
  endSection('Done')

  startSection(`Configuring Claude Desktop`, `Step 3 of 3`)

  const claudeConfigPath = path.join(
    os.homedir(),
    'Library',
    'Application Support',
    'Claude',
    'claude_desktop_config.json',
  )
  const cloudflareConfig = {
    command: (await which('node')).trim(),
    args: [__filename, 'run', account],
  }

  updateStatus(`Looking for existing config in: ${chalk.yellow(path.dirname(claudeConfigPath))}`)
  const configDirExists = isDirectory(path.dirname(claudeConfigPath))
  if (configDirExists) {
    const existingConfig = fs.existsSync(claudeConfigPath)
      ? JSON.parse(fs.readFileSync(claudeConfigPath, 'utf8'))
      : { mcpServers: {} }
    if ('cloudflare' in (existingConfig?.mcpServers || {})) {
      updateStatus(
        `${chalk.green('Note:')} Replacing existing Cloudflare MCP config:\n${chalk.gray(JSON.stringify(existingConfig.mcpServers.cloudflare))}`,
      )
    }
    const newConfig = {
      ...existingConfig,
      mcpServers: {
        ...existingConfig.mcpServers,
        cloudflare: cloudflareConfig,
      },
    }
    fs.writeFileSync(claudeConfigPath, JSON.stringify(newConfig, null, 2))

    updateStatus(`${chalk.yellow('mcp-server-cloudflare')} configured & added to Claude Desktop!`, false)
    updateStatus(`Wrote config to ${chalk.yellow(claudeConfigPath)}:`, false)
    updateStatus(chalk.gray(JSON.stringify(newConfig, null, 2)))
    updateStatus(chalk.blue(`Try asking Claude to "tell me which Workers I have on my account" to get started!`))
  } else {
    const fullConfig = { mcpServers: { cloudflare: cloudflareConfig } }
    updateStatus(
      `Couldn't detect Claude Desktop config at ${claudeConfigPath}.\nTo add the Cloudflare MCP server manually, add the following config to your ${chalk.yellow('claude_desktop_configs.json')} file:\n\n${JSON.stringify(fullConfig, null, 2)}`,
    )
  }

  endSection('Done')
}
