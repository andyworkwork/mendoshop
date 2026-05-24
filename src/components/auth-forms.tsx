'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { completeShopRegistration } from '@/app/actions/register'
import { createClient } from '@/lib/supabase/browser'
import { slugify } from '@/lib/format'
import { authConfirmUrl } from '@/lib/publicUrl'
import { pendingShopToUserMetadata } from '@/lib/pending-registration'
import Link from 'next/link'
import { RubroField } from '@/components/rubro-field'
import { RegisterPendingEmail } from '@/components/register-pending-email'
import { ShopLinkPrefix } from '@/components/shop-link-prefix'

export function LoginForm({
  redirectTo = '/dashboard',
  initialError,
}: {
  redirectTo?: string
  initialError?: string
}) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(initialError ?? null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const sb = createClient()
    const { error: err } = await sb.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (err) {
      setError(err.message)
      return
    }
    router.push(redirectTo)
    router.refresh()
  }

  return (
    <form onSubmit={onSubmit} className="card mx-auto max-w-md space-y-4">
      <h1 className="text-xl font-bold">Entrar a Mendoshop</h1>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <label className="block text-sm">
        Email
        <input
          className="input mt-1"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>
      <label className="block text-sm">
        Contraseña
        <input
          className="input mt-1"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      <p className="text-right text-sm">
        <Link href="/recuperar-contrasena" className="text-brand-accent hover:underline">
          ¿Olvidaste tu contraseña?
        </Link>
      </p>
      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? 'Entrando…' : 'Entrar'}
      </button>
      <p className="text-center text-sm text-zinc-500">
        ¿No tenés cuenta?{' '}
        <Link href="/registro" className="text-brand-accent">
          Crear tienda
        </Link>
      </p>
    </form>
  )
}

export function RegisterForm({ referralSlug }: { referralSlug?: string | null }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [shopName, setShopName] = useState('')
  const [slug, setSlug] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [rubro, setRubro] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [pendingEmail, setPendingEmail] = useState<string | null>(null)

  function onShopNameChange(v: string) {
    setShopName(v)
    if (!slug || slug === slugify(shopName)) setSlug(slugify(v))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const sb = createClient()
    const cleanSlug = slugify(slug)
    const wa = whatsapp.replace(/\D/g, '')

    if (cleanSlug.length < 3) {
      setError('El link de tu tienda debe tener al menos 3 caracteres (solo letras, números y guiones).')
      setLoading(false)
      return
    }
    if (wa.length < 10) {
      setError('Ingresá un WhatsApp válido (código de área + número, solo dígitos).')
      setLoading(false)
      return
    }

    const ref = referralSlug?.trim() ? slugify(referralSlug.trim()) : null
    const pending = {
      shopName: shopName.trim(),
      slug: cleanSlug,
      whatsapp: wa,
      rubro: rubro.trim(),
      referralSlug: ref && ref.length >= 3 ? ref : null,
    }

    const { data: authData, error: signErr } = await sb.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        emailRedirectTo: authConfirmUrl('/registro/completar'),
        data: pendingShopToUserMetadata(pending),
      },
    })

    if (signErr) {
      const msg = signErr.message.toLowerCase().includes('already')
        ? 'Ese email ya tiene cuenta. Entrá o recuperá tu contraseña.'
        : signErr.message
      setError(msg)
      setLoading(false)
      return
    }

    if (!authData.session) {
      setPendingEmail(email.trim().toLowerCase())
      setLoading(false)
      return
    }

    const res = await completeShopRegistration(pending)
    setLoading(false)
    if ('error' in res) {
      setError(res.error)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  if (pendingEmail) {
    return <RegisterPendingEmail email={pendingEmail} />
  }

  return (
    <form onSubmit={onSubmit} className="card mx-auto max-w-lg space-y-4">
      <h1 className="text-xl font-bold">Crear tu tienda en Mendoshop</h1>
      <p className="text-sm text-zinc-400">7 días de prueba gratis. Sin tarjeta.</p>
      {referralSlug?.trim() && (
        <p className="text-xs text-brand-accent">Te invitó una tienda de Mendoshop — ¡bienvenido!</p>
      )}
      {error && <p className="text-sm text-red-400">{error}</p>}

      <label className="block text-sm">
        Nombre de tu negocio
        <input
          className="input mt-1"
          required
          value={shopName}
          onChange={(e) => onShopNameChange(e.target.value)}
        />
      </label>
      <label className="block text-sm">
        Link de tu tienda
        <div className="mt-1 flex items-center gap-1 text-sm">
          <ShopLinkPrefix />
          <input
            className="input flex-1"
            required
            value={slug}
            onChange={(e) => setSlug(slugify(e.target.value))}
            pattern={'[a-z0-9]([a-z0-9-]{1,48}[a-z0-9])?'}
          />
        </div>
      </label>
      <label className="block text-sm">
        WhatsApp (solo números, con código 54…)
        <input
          className="input mt-1"
          required
          placeholder="5492615000000"
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, ''))}
        />
      </label>
      <label className="block text-sm">
        Rubro (opcional, aparece en el directorio)
        <RubroField value={rubro} onChange={setRubro} fieldId="register-rubro" />
      </label>
      <hr className="border-zinc-800" />
      <label className="block text-sm">
        Tu email (para entrar al panel)
        <input
          className="input mt-1"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>
      <label className="block text-sm">
        Contraseña
        <input
          className="input mt-1"
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? 'Creando…' : 'Crear mi tienda'}
      </button>
      <p className="text-center text-sm text-zinc-500">
        ¿Ya tenés cuenta?{' '}
        <Link href="/login" className="text-brand-accent">
          Entrar
        </Link>
      </p>
    </form>
  )
}
