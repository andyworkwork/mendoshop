'use client'

import { useState } from 'react'
import { createShopForUser } from '@/app/actions/admin'
import { slugify } from '@/lib/format'
import type { ShopPlan } from '@/types/shop'
import { ShopLinkPrefix } from '@/components/shop-link-prefix'

export function AdminCreateShopForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [shopName, setShopName] = useState('')
  const [slug, setSlug] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [rubro, setRubro] = useState('')
  const [plan, setPlan] = useState<ShopPlan>('free_trial')
  const [trialDays, setTrialDays] = useState(14)
  const [msg, setMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function onShopNameChange(v: string) {
    setShopName(v)
    if (!slug || slug === slugify(shopName)) setSlug(slugify(v))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMsg(null)
    const res = await createShopForUser({
      email,
      password,
      shopName,
      slug,
      whatsapp,
      rubro,
      plan,
      trialDays,
    })
    setLoading(false)
    if ('error' in res) {
      setMsg(res.error)
      return
    }
    setMsg('Tienda y usuario creados. La persona puede entrar con ese email y contraseña.')
    setEmail('')
    setPassword('')
    setShopName('')
    setSlug('')
    setWhatsapp('')
    setRubro('')
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-white">Crear cuenta + tienda</h2>
        <p className="mt-1 text-sm text-zinc-400">
          El email queda confirmado automáticamente. Compartí la contraseña con el comercio.
        </p>
      </div>
      {msg && (
        <p
          className={`text-sm ${msg.includes('creados') ? 'text-green-400' : 'text-red-400'}`}
          role="status"
        >
          {msg}
        </p>
      )}

      <label className="block text-sm">
        Nombre del negocio
        <input
          className="input mt-1"
          required
          value={shopName}
          onChange={(e) => onShopNameChange(e.target.value)}
        />
      </label>
      <label className="block text-sm">
        Link de la tienda
        <div className="mt-1 flex items-center gap-1 text-sm text-zinc-500">
          <ShopLinkPrefix />
          <input
            className="input flex-1"
            required
            value={slug}
            onChange={(e) => setSlug(slugify(e.target.value))}
          />
        </div>
      </label>
      <label className="block text-sm">
        WhatsApp (solo dígitos)
        <input
          className="input mt-1"
          required
          placeholder="5492615000000"
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, ''))}
        />
      </label>
      <label className="block text-sm">
        Rubro (opcional)
        <input className="input mt-1" value={rubro} onChange={(e) => setRubro(e.target.value)} />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          Plan
          <select className="input mt-1" value={plan} onChange={(e) => setPlan(e.target.value as ShopPlan)}>
            <option value="free_trial">Prueba gratis</option>
            <option value="basic">Basic</option>
            <option value="pro">Pro</option>
          </select>
        </label>
        {plan === 'free_trial' && (
          <label className="block text-sm">
            Días de prueba
            <input
              type="number"
              min={1}
              max={90}
              className="input mt-1"
              value={trialDays}
              onChange={(e) => setTrialDays(Number(e.target.value))}
            />
          </label>
        )}
      </div>

      <hr className="border-zinc-700" />

      <label className="block text-sm">
        Email del comercio
        <input
          className="input mt-1"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>
      <label className="block text-sm">
        Contraseña inicial
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
        {loading ? 'Creando…' : 'Crear usuario y tienda'}
      </button>
    </form>
  )
}
