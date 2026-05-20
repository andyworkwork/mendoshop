'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'

export function UpdatePasswordForm() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [ready, setReady] = useState(false)
  const [hasSession, setHasSession] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const sb = createClient()
    sb.auth.getUser().then(({ data: { user } }) => {
      setHasSession(Boolean(user))
      setReady(true)
    })
  }, [])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }
    setLoading(true)
    setError(null)
    const sb = createClient()
    const { error: err } = await sb.auth.updateUser({ password })
    setLoading(false)
    if (err) {
      setError(err.message)
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  if (!ready) {
    return <p className="card mx-auto max-w-md p-6 text-center text-sm text-zinc-400">Cargando…</p>
  }

  if (!hasSession) {
    return (
      <div className="card mx-auto max-w-md space-y-4 text-center">
        <h1 className="text-xl font-bold">Enlace requerido</h1>
        <p className="text-sm text-zinc-400">
          Abrí esta página desde el enlace que te enviamos al correo, o pedí uno nuevo si venció.
        </p>
        <Link href="/recuperar-contrasena" className="btn-primary inline-block w-full py-2.5 text-sm">
          Pedir enlace de recuperación
        </Link>
        <Link href="/login" className="block text-sm text-brand-accent hover:underline">
          Volver a entrar
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="card mx-auto max-w-md space-y-4">
      <h1 className="text-xl font-bold">Nueva contraseña</h1>
      <p className="text-sm text-zinc-400">Elegí una contraseña nueva para tu cuenta.</p>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <label className="block text-sm">
        Contraseña nueva
        <input
          className="input mt-1"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      <label className="block text-sm">
        Repetir contraseña
        <input
          className="input mt-1"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </label>
      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? 'Guardando…' : 'Guardar y entrar al panel'}
      </button>
    </form>
  )
}
