'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'
import { authConfirmUrl } from '@/lib/publicUrl'

type Props = {
  email: string
  emailJustConfirmed?: boolean
}

export function ShopAccountAuthPanel({ email, emailJustConfirmed }: Props) {
  const router = useRouter()

  const [newEmail, setNewEmail] = useState('')
  const [emailMsg, setEmailMsg] = useState<string | null>(null)
  const [emailLoading, setEmailLoading] = useState(false)

  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null)
  const [passwordLoading, setPasswordLoading] = useState(false)

  async function onChangeEmail(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = newEmail.trim().toLowerCase()
    if (!trimmed) {
      setEmailMsg('Ingresá un correo nuevo.')
      return
    }
    if (trimmed === email.toLowerCase()) {
      setEmailMsg('Es el mismo correo que ya usás.')
      return
    }

    setEmailLoading(true)
    setEmailMsg(null)
    const sb = createClient()
    const { error } = await sb.auth.updateUser(
      { email: trimmed },
      {
        emailRedirectTo: authConfirmUrl(
          '/dashboard/account/configuracion?updated=email',
        ),
      },
    )
    setEmailLoading(false)
    if (error) {
      setEmailMsg(error.message)
      return
    }
    setNewEmail('')
    setEmailMsg(
      'Te enviamos un correo de confirmación al nuevo email y otro al correo actual. Abrí el enlace del mail nuevo para completar el cambio.',
    )
  }

  async function onChangePassword(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 6) {
      setPasswordMsg('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    if (password !== passwordConfirm) {
      setPasswordMsg('Las contraseñas no coinciden.')
      return
    }

    setPasswordLoading(true)
    setPasswordMsg(null)
    const sb = createClient()
    const { error } = await sb.auth.updateUser({ password })
    setPasswordLoading(false)
    if (error) {
      setPasswordMsg(error.message)
      return
    }
    setPassword('')
    setPasswordConfirm('')
    setPasswordMsg('Contraseña actualizada correctamente.')
    router.refresh()
  }

  return (
    <div className="max-w-2xl space-y-6">
      {emailJustConfirmed && (
        <p className="rounded-xl border border-brand/40 bg-brand/10 px-4 py-3 text-sm text-brand">
          Tu nuevo correo quedó confirmado. Usalo la próxima vez que entres al panel.
        </p>
      )}

      <section className="card space-y-4">
        <h2 className="font-semibold">Correo de acceso</h2>
        <p className="text-sm text-zinc-400">
          Es el email con el que entrás a Mendoshop. Para cambiarlo, tenés que confirmar desde el correo
          nuevo; también te avisamos al correo anterior.
        </p>
        <p className="text-sm">
          Correo actual: <span className="font-medium text-zinc-100">{email || '—'}</span>
        </p>
        <form onSubmit={onChangeEmail} className="space-y-3">
          <label className="block text-sm">
            Nuevo correo
            <input
              className="input mt-1"
              type="email"
              autoComplete="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="nuevo@ejemplo.com"
            />
          </label>
          {emailMsg && (
            <p
              className={`text-sm ${
                emailMsg.includes('enviamos') || emailMsg.includes('confirmación')
                  ? 'text-brand'
                  : 'text-red-400'
              }`}
            >
              {emailMsg}
            </p>
          )}
          <button type="submit" disabled={emailLoading} className="btn-primary">
            {emailLoading ? 'Enviando…' : 'Solicitar cambio de correo'}
          </button>
        </form>
      </section>

      <section className="card space-y-4">
        <h2 className="font-semibold">Contraseña</h2>
        <p className="text-sm text-zinc-400">
          Si ya estás logueado, podés elegir una contraseña nueva acá sin usar el correo. Si olvidaste la
          contraseña o preferís un enlace por mail, usá recuperación.
        </p>
        <form onSubmit={onChangePassword} className="space-y-3">
          <label className="block text-sm">
            Contraseña nueva
            <input
              className="input mt-1"
              type="password"
              autoComplete="new-password"
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            Repetir contraseña nueva
            <input
              className="input mt-1"
              type="password"
              autoComplete="new-password"
              minLength={6}
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
            />
          </label>
          {passwordMsg && (
            <p
              className={`text-sm ${
                passwordMsg.includes('actualizada') ? 'text-brand' : 'text-red-400'
              }`}
            >
              {passwordMsg}
            </p>
          )}
          <button type="submit" disabled={passwordLoading} className="btn-primary">
            {passwordLoading ? 'Guardando…' : 'Guardar contraseña nueva'}
          </button>
        </form>
        <p className="text-sm text-zinc-500">
          <Link href="/recuperar-contrasena" className="text-brand-accent hover:underline">
            Recuperar contraseña por correo
          </Link>
          {' '}
          (te llega un enlace si no recordás la actual).
        </p>
      </section>
    </div>
  )
}
