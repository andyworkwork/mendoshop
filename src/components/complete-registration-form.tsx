'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { completeShopRegistration } from '@/app/actions/register'
import { RegistrationSuccessCard } from '@/components/registration-success-card'
import type { PendingShopRegistration } from '@/lib/pending-registration'
import { isPendingShopComplete } from '@/lib/pending-registration'
import { slugify } from '@/lib/format'
import { RubroField } from '@/components/rubro-field'
import { ShopLinkPrefix } from '@/components/shop-link-prefix'

type Props = {
  referralSlug?: string | null
  initial?: Partial<PendingShopRegistration>
  /** Tras confirmar email: crear tienda sola con los datos del primer formulario. */
  autoCreateFromSignup?: boolean
}

type Phase = 'creating' | 'success' | 'form'

export function CompleteRegistrationForm({
  referralSlug,
  initial,
  autoCreateFromSignup,
}: Props) {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>(() =>
    autoCreateFromSignup && isPendingShopComplete(initial ?? {}) ? 'creating' : 'form',
  )
  const [success, setSuccess] = useState<{ shopName: string; shopSlug: string } | null>(null)
  const [shopName, setShopName] = useState(initial?.shopName ?? '')
  const [slug, setSlug] = useState(initial?.slug ?? '')
  const [whatsapp, setWhatsapp] = useState(initial?.whatsapp ?? '')
  const [rubro, setRubro] = useState(initial?.rubro ?? '')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const autoRan = useRef(false)

  const refSlug = referralSlug?.trim() ? slugify(referralSlug.trim()) : null

  function buildPayload(): PendingShopRegistration | null {
    if (!isPendingShopComplete({ shopName, slug, whatsapp, rubro, referralSlug: refSlug })) {
      return null
    }
    return {
      shopName: shopName.trim(),
      slug: slugify(slug),
      whatsapp: whatsapp.replace(/\D/g, ''),
      rubro: rubro.trim(),
      referralSlug: refSlug && refSlug.length >= 3 ? refSlug : null,
    }
  }

  async function runCreate(payload: PendingShopRegistration) {
    setLoading(true)
    setError(null)
    const res = await completeShopRegistration(payload)
    setLoading(false)
    if ('error' in res) {
      setPhase('form')
      setError(res.error)
      return false
    }
    setSuccess({ shopName: res.shopName, shopSlug: res.shopSlug })
    setPhase('success')
    router.refresh()
    return true
  }

  useEffect(() => {
    if (!autoCreateFromSignup || autoRan.current) return
    const payload = buildPayload()
    if (!payload) {
      setPhase('form')
      return
    }
    autoRan.current = true
    setPhase('creating')
    void runCreate(payload)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al montar con datos del signup
  }, [])

  function onShopNameChange(v: string) {
    setShopName(v)
    if (!slug || slug === slugify(shopName)) setSlug(slugify(v))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload = buildPayload()
    if (!payload) {
      setError('Completá nombre, link y WhatsApp.')
      return
    }
    await runCreate(payload)
  }

  if (phase === 'creating') {
    return (
      <div className="card mx-auto max-w-lg space-y-4 text-center">
        <h1 className="text-xl font-bold">Confirmando tu cuenta…</h1>
        <p className="text-sm text-zinc-400">Estamos creando tu tienda con los datos que ya cargaste.</p>
        <p className="text-sm text-zinc-500">Un momento.</p>
      </div>
    )
  }

  if (phase === 'success' && success) {
    return <RegistrationSuccessCard shopName={success.shopName} shopSlug={success.shopSlug} />
  }

  const slugOnlyRetry =
    Boolean(error?.includes('link') || error?.includes('uso')) &&
    Boolean(shopName.trim() && whatsapp.replace(/\D/g, '').length >= 10)

  return (
    <form onSubmit={onSubmit} className="card mx-auto max-w-lg space-y-4">
      <h1 className="text-xl font-bold">
        {slugOnlyRetry ? 'Elegí otro link para tu tienda' : 'Completá tu tienda'}
      </h1>
      <p className="text-sm text-zinc-400">
        {slugOnlyRetry
          ? `El resto de los datos de ${shopName} ya están guardados.`
          : 'Faltan algunos datos para crear tu vitrina (7 días de prueba gratis).'}
      </p>
      {error && <p className="text-sm text-red-400">{error}</p>}

      {!slugOnlyRetry && (
        <>
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
        </>
      )}

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
