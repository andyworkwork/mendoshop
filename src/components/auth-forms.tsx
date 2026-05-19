'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'
import { slugify } from '@/lib/format'
import Link from 'next/link'

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
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
    router.push('/dashboard')
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
      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? 'Entrando…' : 'Entrar'}
      </button>
      <p className="text-center text-sm text-zinc-500">
        ¿No tenés cuenta?{' '}
        <Link href="/registro" className="text-teal-400">
          Crear tienda
        </Link>
      </p>
    </form>
  )
}

export function RegisterForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [shopName, setShopName] = useState('')
  const [slug, setSlug] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [rubro, setRubro] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

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

    const { data: authData, error: signErr } = await sb.auth.signUp({ email, password })
    if (signErr) {
      setError(signErr.message)
      setLoading(false)
      return
    }

    const userId = authData.user?.id
    if (!userId) {
      setError('Revisá tu email para confirmar la cuenta y volvé a entrar.')
      setLoading(false)
      return
    }

    const trialEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()

    const { data: shop, error: shopErr } = await sb
      .from('shops')
      .insert({
        slug: cleanSlug,
        name: shopName.trim(),
        description: null,
        whatsapp_e164: wa,
        category_label: rubro.trim() || null,
        plan: 'free_trial',
        plan_until: trialEnd,
        active: true,
      })
      .select('id')
      .single()

    if (shopErr) {
      setError(shopErr.message.includes('unique') ? 'Ese link ya está en uso. Elegí otro.' : shopErr.message)
      setLoading(false)
      return
    }

    const { error: memberErr } = await sb.from('shop_members').insert({
      shop_id: shop.id,
      user_id: userId,
      role: 'owner',
    })

    if (memberErr) {
      setError(memberErr.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <form onSubmit={onSubmit} className="card mx-auto max-w-lg space-y-4">
      <h1 className="text-xl font-bold">Crear tu tienda en Mendoshop</h1>
      <p className="text-sm text-zinc-400">14 días de prueba gratis. Sin tarjeta.</p>
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
        <div className="mt-1 flex items-center gap-1 text-sm text-zinc-500">
          <span>mendoshop.com/tienda/</span>
          <input
            className="input flex-1"
            required
            value={slug}
            onChange={(e) => setSlug(slugify(e.target.value))}
            pattern="[a-z0-9]([a-z0-9-]{1,48}[a-z0-9])?"
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
        <input className="input mt-1" value={rubro} onChange={(e) => setRubro(e.target.value)} />
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
        <Link href="/login" className="text-teal-400">
          Entrar
        </Link>
      </p>
    </form>
  )
}
