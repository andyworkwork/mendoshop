/**
 * Launcher para Mercado Pago MCP en Cursor (stdio vía mcp-remote).
 * Lee MERCADOPAGO_ACCESS_TOKEN desde .env.local del proyecto.
 */
import { spawn } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const envPath = join(root, '.env.local')

function loadAccessToken() {
  if (!existsSync(envPath)) {
    console.error('[mercadopago-mcp] No se encontró .env.local en la raíz del proyecto.')
    process.exit(1)
  }
  const content = readFileSync(envPath, 'utf8')
  const match = content.match(/^MERCADOPAGO_ACCESS_TOKEN=(.+)$/m)
  const token = match?.[1]?.trim()
  if (!token) {
    console.error('[mercadopago-mcp] Falta MERCADOPAGO_ACCESS_TOKEN en .env.local')
    process.exit(1)
  }
  return token
}

const token = loadAccessToken()
const isWin = process.platform === 'win32'

const child = spawn(
  'npx',
  ['-y', 'mcp-remote', 'https://mcp.mercadopago.com/mcp', '--header', `Authorization: Bearer ${token}`],
  {
    stdio: 'inherit',
    shell: isWin,
    cwd: root,
    env: process.env,
  },
)

child.on('error', (err) => {
  console.error('[mercadopago-mcp]', err.message)
  process.exit(1)
})

child.on('exit', (code, signal) => {
  if (signal) process.exit(1)
  process.exit(code ?? 1)
})
