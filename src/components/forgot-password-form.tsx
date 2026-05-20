'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/browser'
import { authConfirmUrl } from '@/lib/publicUrl'

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const sb = createClient()
    const redirectTo =
      typeof window !== 'undefined'
        ? `${window.location.origin}/auth/confirmar?next=${encodeURIComponent('/actualizar-contrasena')}`
        : authConfirmUrl()

    const { error: err } = await sb.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo,
    })
    setLoading(false)
    if (err) {
      setError(err.message)
      return
    }
    setSent(true)
  }

  if (sent) {
    return (
      <div className="card mx-auto max-w-md space-y-4 text-center">
        <h1 className="text-xl font-bold">Revisá tu correo</h1>
        <p className="text-sm text-zinc-400">
          Si existe una cuenta con <span className="text-zinc-200">{email}</span>, Supabase te enviará un
          mensaje para restablecer la contraseña. Abrí el enlace del mail y elegí una contraseña nueva.
        </p>
        <p className="text-xs text-zinc-500">Revisá también la carpeta de spam.</p>
        <Link href="/login" className="btn-primary inline-block w-full py-2.5 text-center text-sm">
          Volver a entrar
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="card mx-auto max-w-md space-y-4">
      <h1 className="text-xl font-bold">Recuperar contraseña</h1>
      <p className="text-sm text-zinc-400">
        Escribí el email de tu cuenta. Te llegará un correo de Supabase con un enlace para elegir una
        contraseña nueva.
      </p>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <label className="block text-sm">
        Email
        <input
          className="input mt-1"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>
      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? 'Enviando…' : 'Enviar enlace al correo'}
      </button>
      <p className="text-center text-sm text-zinc-500">
        <Link href="/login" className="text-brand-accent hover:underline">
          Volver a entrar
        </Link>
      </p>
    </form>
  )
}
