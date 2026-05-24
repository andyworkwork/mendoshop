/**
 * Plantillas de correo de Auth en español (Management API).
 *
 * Uso:
 *   node --env-file=.env.local scripts/configure-supabase-email-templates-es.mjs
 *
 * Requiere SUPABASE_ACCESS_TOKEN con auth_config_write.
 */
const REF =
  process.env.SUPABASE_PROJECT_REF ??
  process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]

const CONFIRM_SUBJECT = 'Confirmá tu cuenta en Mendoshop'
const CONFIRM_BODY = `<h2>Confirmá tu cuenta en Mendoshop</h2>
<p>Hacé clic en el enlace para verificar tu correo y terminar de crear tu tienda online:</p>
<p><a href="{{ .ConfirmationURL }}">Confirmar mi correo</a></p>
<p>Si no creaste una cuenta en Mendoshop, podés ignorar este mensaje.</p>`

const RECOVERY_SUBJECT = 'Restablecer contraseña — Mendoshop'
const RECOVERY_BODY = `<h2>Restablecer contraseña</h2>
<p>Recibimos un pedido para cambiar la contraseña de tu cuenta. Usá este enlace:</p>
<p><a href="{{ .ConfirmationURL }}">Elegir nueva contraseña</a></p>
<p>Si no lo pediste, ignorá este correo.</p>`

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

  const patchRes = await fetch(`https://api.supabase.com/v1/projects/${REF}/config/auth`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      mailer_subjects_confirmation: CONFIRM_SUBJECT,
      mailer_templates_confirmation_content: CONFIRM_BODY,
      mailer_subjects_recovery: RECOVERY_SUBJECT,
      mailer_templates_recovery_content: RECOVERY_BODY,
    }),
  })

  const text = await patchRes.text()
  if (!patchRes.ok) {
    console.error('PATCH auth templates:', patchRes.status, text)
    console.error(
      '\nTambién podés pegar las plantillas a mano en:',
      `https://supabase.com/dashboard/project/${REF}/auth/templates`,
    )
    process.exit(1)
  }

  console.log('Plantillas de email actualizadas a español.')
  console.log('  Confirmación:', CONFIRM_SUBJECT)
  console.log('  Recuperar contraseña:', RECOVERY_SUBJECT)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
