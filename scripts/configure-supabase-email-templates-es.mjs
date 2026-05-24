/**
 * Todas las plantillas de correo de Auth en español (Management API).
 *
 * Uso:
 *   npm run configure:auth-emails-es
 *
 * Requiere SUPABASE_ACCESS_TOKEN con auth_config_write.
 */
const REF =
  process.env.SUPABASE_PROJECT_REF ??
  process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]

const BRAND = 'Mendoshop'
const FOOTER = `<p style="color:#888;font-size:12px;">Si no reconocés esta acción, ignorá este correo.</p>`

const TEMPLATES = {
  mailer_subjects_confirmation: `Confirmá tu cuenta en ${BRAND}`,
  mailer_templates_confirmation_content: `<h2>Confirmá tu cuenta en ${BRAND}</h2>
<p>Hacé clic en el enlace para verificar tu correo y terminar de crear tu tienda online:</p>
<p><a href="{{ .ConfirmationURL }}">Confirmar mi correo</a></p>
<p>Si no creaste una cuenta en ${BRAND}, podés ignorar este mensaje.</p>`,

  mailer_subjects_recovery: `Restablecer contraseña — ${BRAND}`,
  mailer_templates_recovery_content: `<h2>Restablecer contraseña</h2>
<p>Recibimos un pedido para cambiar la contraseña de tu cuenta en ${BRAND}. Usá este enlace:</p>
<p><a href="{{ .ConfirmationURL }}">Elegir nueva contraseña</a></p>
<p>Si no lo pediste, ignorá este correo.</p>`,

  mailer_subjects_magic_link: `Tu enlace para entrar — ${BRAND}`,
  mailer_templates_magic_link_content: `<h2>Entrá a ${BRAND}</h2>
<p>Usá este enlace para iniciar sesión sin contraseña:</p>
<p><a href="{{ .ConfirmationURL }}">Entrar a mi cuenta</a></p>
${FOOTER}`,

  mailer_subjects_invite: `Te invitaron a ${BRAND}`,
  mailer_templates_invite_content: `<h2>Invitación a ${BRAND}</h2>
<p>Te invitaron a crear una cuenta en ${BRAND}. Aceptá la invitación con este enlace:</p>
<p><a href="{{ .ConfirmationURL }}">Aceptar invitación</a></p>
${FOOTER}`,

  mailer_subjects_email_change: `Confirmá tu nuevo correo — ${BRAND}`,
  mailer_templates_email_change_content: `<h2>Confirmar cambio de correo</h2>
<p>Confirmá que querés usar esta dirección de email en tu cuenta de ${BRAND}:</p>
<p><a href="{{ .ConfirmationURL }}">Confirmar nuevo correo</a></p>
${FOOTER}`,

  mailer_subjects_reauthentication: `Código de verificación — ${BRAND}`,
  mailer_templates_reauthentication_content: `<h2>Verificación de seguridad</h2>
<p>Para continuar en ${BRAND}, ingresá este código:</p>
<p style="font-size:24px;font-weight:bold;letter-spacing:4px;">{{ .Token }}</p>
<p>El código vence en pocos minutos.</p>
${FOOTER}`,

  mailer_subjects_password_changed_notification: `Tu contraseña fue cambiada — ${BRAND}`,
  mailer_templates_password_changed_notification_content: `<h2>Contraseña actualizada</h2>
<p>La contraseña de tu cuenta <strong>{{ .Email }}</strong> en ${BRAND} fue cambiada.</p>
<p>Si no fuiste vos, contactanos de inmediato.</p>`,

  mailer_subjects_email_changed_notification: `Tu correo fue cambiado — ${BRAND}`,
  mailer_templates_email_changed_notification_content: `<h2>Correo actualizado</h2>
<p>El email de tu cuenta en ${BRAND} cambió de <strong>{{ .OldEmail }}</strong> a <strong>{{ .Email }}</strong>.</p>
<p>Si no fuiste vos, contactanos de inmediato.</p>`,

  mailer_subjects_phone_changed_notification: `Tu teléfono fue cambiado — ${BRAND}`,
  mailer_templates_phone_changed_notification_content: `<h2>Teléfono actualizado</h2>
<p>El teléfono de la cuenta <strong>{{ .Email }}</strong> cambió de {{ .OldPhone }} a {{ .Phone }}.</p>
<p>Si no fuiste vos, contactanos de inmediato.</p>`,

  mailer_subjects_mfa_factor_enrolled_notification: `Nuevo factor de seguridad — ${BRAND}`,
  mailer_templates_mfa_factor_enrolled_notification_content: `<h2>Factor de seguridad agregado</h2>
<p>Se agregó un factor {{ .FactorType }} a la cuenta <strong>{{ .Email }}</strong>.</p>
<p>Si no fuiste vos, contactanos de inmediato.</p>`,

  mailer_subjects_mfa_factor_unenrolled_notification: `Factor de seguridad quitado — ${BRAND}`,
  mailer_templates_mfa_factor_unenrolled_notification_content: `<h2>Factor de seguridad eliminado</h2>
<p>Se quitó un factor {{ .FactorType }} de la cuenta <strong>{{ .Email }}</strong>.</p>
<p>Si no fuiste vos, contactanos de inmediato.</p>`,

  mailer_subjects_identity_linked_notification: `Cuenta vinculada — ${BRAND}`,
  mailer_templates_identity_linked_notification_content: `<h2>Identidad vinculada</h2>
<p>Se vinculó {{ .Provider }} a la cuenta <strong>{{ .Email }}</strong> en ${BRAND}.</p>
<p>Si no fuiste vos, contactanos de inmediato.</p>`,

  mailer_subjects_identity_unlinked_notification: `Cuenta desvinculada — ${BRAND}`,
  mailer_templates_identity_unlinked_notification_content: `<h2>Identidad desvinculada</h2>
<p>Se desvinculó {{ .Provider }} de la cuenta <strong>{{ .Email }}</strong> en ${BRAND}.</p>
<p>Si no fuiste vos, contactanos de inmediato.</p>`,
}

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
    body: JSON.stringify(TEMPLATES),
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

  console.log(`Plantillas de Auth actualizadas a español (${Object.keys(TEMPLATES).length / 2} tipos):\n`)
  for (const key of Object.keys(TEMPLATES).sort()) {
    if (key.startsWith('mailer_subjects_')) {
      console.log(`  • ${key.replace('mailer_subjects_', '')}: ${TEMPLATES[key]}`)
    }
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
