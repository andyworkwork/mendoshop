/**
 * Activa protección de contraseñas filtradas (HaveIBeenPwned) vía Management API.
 *
 * Uso:
 *   node --env-file=.env.local scripts/configure-supabase-auth-security.mjs
 *
 * Requiere SUPABASE_ACCESS_TOKEN (PAT con permiso de proyecto).
 * Nota: en plan Free puede fallar si el proyecto no tiene entitlement password_hibp.
 */
const REF =
  process.env.SUPABASE_PROJECT_REF ??
  process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]

async function main() {
  const token = process.env.SUPABASE_ACCESS_TOKEN?.trim()
  if (!token) {
    console.error('Falta SUPABASE_ACCESS_TOKEN en .env.local')
    process.exit(1)
  }
  if (!REF) {
    console.error('No se detectó project ref.')
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
  console.log('Estado actual password_hibp_enabled:', current.password_hibp_enabled)

  const patchRes = await fetch(`https://api.supabase.com/v1/projects/${REF}/config/auth`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      password_hibp_enabled: true,
    }),
  })

  const bodyText = await patchRes.text()
  if (!patchRes.ok) {
    console.error('PATCH auth config:', patchRes.status, bodyText)
    console.error(
      '\nSi el plan no incluye leaked password protection, activalo manualmente en:',
      `https://supabase.com/dashboard/project/${REF}/auth/providers`,
    )
    process.exit(1)
  }

  const updated = JSON.parse(bodyText)
  console.log('Listo. password_hibp_enabled:', updated.password_hibp_enabled)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
