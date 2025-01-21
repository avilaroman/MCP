import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js'
import { log } from './utils/helpers'
import { R2_HANDLERS, R2_TOOLS } from './tools/r2'
import { D1_HANDLERS, D1_TOOLS } from './tools/d1'
import { KV_HANDLERS, KV_TOOLS } from './tools/kv'
import { ANALYTICS_HANDLERS, ANALYTICS_TOOLS } from './tools/analytics'
import { WORKER_TOOLS, WORKERS_HANDLERS } from './tools/workers'

// Tipos de Respuestas en Cloudflare

// Combina todas las herramientas directamente,si lo quieres quieres o configura solo el servicio que vas a usar.

const ALL_TOOLS = [...KV_TOOLS, ...WORKER_TOOLS, ...ANALYTICS_TOOLS, ...R2_TOOLS, ...D1_TOOLS]

// Creando el server
const server = new Server(
  { name: 'cloudflare', version: '1.0.0' }, // Se cambió de cloudflare-kv a cloudflare
  { capabilities: { tools: {} } },
)

// Handle el list tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  log('Received list tools request')
  return { tools: ALL_TOOLS }
})

// Handle tool Llamada:
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const toolName = request.params.name
  log('Received tool call:', toolName)

  try {
    if (toolName in ANALYTICS_HANDLERS) {
      return await ANALYTICS_HANDLERS[toolName](request)
    }
    if (toolName in D1_HANDLERS) {
      return await D1_HANDLERS[toolName](request)
    }
    if (toolName in KV_HANDLERS) {
      return await KV_HANDLERS[toolName](request)
    }
    if (toolName in WORKERS_HANDLERS) {
      return await WORKERS_HANDLERS[toolName](request)
    }
    if (toolName in R2_HANDLERS) {
      return await R2_HANDLERS[toolName](request)
    }

    throw new Error(`Unknown tool: ${toolName}`)
  } catch (error) {
    log('Error handling tool call:', error)
    return {
      toolResult: {
        content: [
          {
            type: 'text',
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      },
    }
  }
})

// Comienza el server
export async function main() {
  log('Comenzando el server...')
  try {
    const transport = new StdioServerTransport()
    log('Created transport')
    await server.connect(transport)
    log('Server connectado y Corriendo perfectamente')
  } catch (error) {
    log('Fatal error:', error)
    process.exit(1)
  }
}
