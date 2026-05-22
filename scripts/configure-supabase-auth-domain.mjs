/**
 * Actualiza Site URL y Redirect URLs en Supabase Auth (Management API).
 *
 * Uso:
 *   node --env-file=.env.local scripts/configure-supabase-auth-domain.mjs
 *
 * Requiere SUPABASE_ACCESS_TOKEN (PAT):
 *   https://supabase.com/dashboard/account/tokens
 */
const REF =
  process.env.SUPABASE_PROJECT_REF ??
  process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]

const SITE_URL = (process.env.AUTH_SITE_URL ?? 'https://mendoshop.online').replace(/\/$/, '')

const REDIRECT_URLS = [
  `${SITE_URL}/**`,
  'https://www.mendoshop.online/**',
  'http://localhost:3000/**',
  'http://127.0.0.1:3000/**',
  'https://mendoshop.vercel.app/**',
]

function parseAllowList(raw) {
  if (!raw || typeof raw !== 'string') return []
  return raw
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean)
}

async function main() {
  const token = process.env.SUPABASE_ACCESS_TOKEN?.trim()
  if (!token) {
    console.error('Falta SUPABASE_ACCESS_TOKEN en .env.local')
    console.error('Creá un PAT en https://supabase.com/dashboard/account/tokens')
    process.exit(1)
  }
  if (!REF) {
    console.error('No se pudo detectar el project ref (NEXT_PUBLIC_SUPABASE_URL).')
    process.exit(1)
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }

  const getRes = await fetch(`https://api.supabase.com/v1/projects/${REF}/config/auth`, { headers })
  if (!getRes.ok) {
    console.error('GET auth config:', getRes.status, await getRes.text())
    process.exit(1)
  }

  const current = await getRes.json()
  const merged = [...new Set([...parseAllowList(current.uri_allow_list), ...REDIRECT_URLS])]

  const patchRes = await fetch(`https://api.supabase.com/v1/projects/${REF}/config/auth`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      site_url: SITE_URL,
      uri_allow_list: merged.join(','),
    }),
  })

  if (!patchRes.ok) {
    console.error('PATCH auth config:', patchRes.status, await patchRes.text())
    process.exit(1)
  }

  const updated = await patchRes.json()
  console.log('Supabase Auth actualizado.')
  console.log('  Site URL:', updated.site_url ?? SITE_URL)
  console.log('  Redirect URLs:')
  for (const u of parseAllowList(updated.uri_allow_list ?? merged.join(','))) {
    console.log('   -', u)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
