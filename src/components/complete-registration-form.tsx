'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { completeShopRegistration } from '@/app/actions/register'
import type { PendingShopRegistration } from '@/lib/pending-registration'
import { slugify } from '@/lib/format'
import { RubroField } from '@/components/rubro-field'
import { ShopLinkPrefix } from '@/components/shop-link-prefix'

type Props = {
  referralSlug?: string | null
  initial?: Partial<PendingShopRegistration>
  emailConfirmed?: boolean
}

export function CompleteRegistrationForm({
  referralSlug,
  initial,
  emailConfirmed,
}: Props) {
  const router = useRouter()
  const [shopName, setShopName] = useState(initial?.shopName ?? '')
  const [slug, setSlug] = useState(initial?.slug ?? '')
  const [whatsapp, setWhatsapp] = useState(initial?.whatsapp ?? '')
  const [rubro, setRubro] = useState(initial?.rubro ?? '')
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

    const res = await completeShopRegistration({
      shopName,
      slug,
      whatsapp,
      rubro,
      referralSlug: referralSlug?.trim() ? slugify(referralSlug.trim()) : null,
    })

    setLoading(false)
    if ('error' in res) {
      setError(res.error)
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <form onSubmit={onSubmit} className="card mx-auto max-w-lg space-y-4">
      <h1 className="text-xl font-bold">Terminá de crear tu tienda</h1>
      {emailConfirmed ? (
        <p className="text-sm text-emerald-400">
          Email confirmado. Completá estos datos para publicar tu vitrina (7 días de prueba gratis).
        </p>
      ) : (
        <p className="text-sm text-zinc-400">
          Ya tenés cuenta. Falta crear tu tienda: completá el formulario y guardá.
        </p>
      )}
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
        Rubro (opcional)
        <RubroField value={rubro} onChange={setRubro} fieldId="complete-register-rubro" />
      </label>

      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? 'Creando tienda…' : 'Crear mi tienda'}
      </button>
      <p className="text-center text-sm text-zinc-500">
        <Link href="/login" className="text-brand-accent">
          Volver a entrar
        </Link>
      </p>
    </form>
  )
}
