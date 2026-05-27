'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { completeShopRegistration } from '@/app/actions/register'
import { RegistrationSuccessCard } from '@/components/registration-success-card'
import { assertShopSlugAvailable, useShopSlugAvailability } from '@/hooks/use-shop-slug-availability'
import type { PendingShopRegistration } from '@/lib/pending-registration'
import { isPendingShopComplete } from '@/lib/pending-registration'
import { SHOP_SLUG_TAKEN_MESSAGE } from '@/lib/shop-slug'
import { slugify } from '@/lib/format'
import { RubroField } from '@/components/rubro-field'
import {
  RegistrationCard,
  RegistrationFieldHint,
  RegistrationFooterLink,
  RegistrationHeader,
  RegistrationIconInput,
  RegistrationStepQuestion,
  RegistrationUrlField,
  StoreIcon,
  WhatsAppIcon,
} from '@/components/registration-friendly-ui'

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
  const { cleanSlug, slugTaken, slugChecking, slugTakenMessage } = useShopSlugAvailability(slug)

  const refSlug = resolveReferralSlug(referralSlug, initial?.referralSlug)

  function buildPayload(): PendingShopRegistration | null {
    if (!isPendingShopComplete({ shopName, slug, whatsapp, rubro, referralSlug: refSlug })) {
      return null
    }
    return {
      shopName: shopName.trim(),
      slug: slugify(slug),
      whatsapp: whatsapp.replace(/\D/g, ''),
      rubro: rubro.trim(),
      referralSlug: refSlug,
    }
  }

  async function runCreate(payload: PendingShopRegistration) {
    const slugError = await assertShopSlugAvailable(payload.slug)
    if (slugError) {
      setPhase('form')
      setError(slugError)
      return false
    }

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
      <RegistrationCard>
        <RegistrationHeader
          title="Confirmando tu cuenta…"
          subtitle="Estamos creando tu tienda con los datos que ya cargaste"
        />
        <div className="registration-card-body text-center">
          <p className="text-sm text-zinc-500">Un momento, por favor.</p>
        </div>
      </RegistrationCard>
    )
  }

  if (phase === 'success' && success) {
    return <RegistrationSuccessCard shopName={success.shopName} shopSlug={success.shopSlug} />
  }

  const slugOnlyRetry =
    error === SHOP_SLUG_TAKEN_MESSAGE &&
    Boolean(shopName.trim() && whatsapp.replace(/\D/g, '').length >= 10)

  return (
    <form onSubmit={onSubmit}>
      <RegistrationCard>
        <RegistrationHeader
          title={slugOnlyRetry ? 'Elegí otro link para tu tienda' : undefined}
          subtitle={
            slugOnlyRetry
              ? `El resto de los datos de ${shopName} ya están guardados.`
              : 'Faltan algunos datos para terminar tu vitrina (7 días gratis).'
          }
        />
        <div className="registration-card-body">
          {error && <p className="text-sm text-red-400">{error}</p>}

          {!slugOnlyRetry && (
            <>
              <div className="space-y-2">
                <RegistrationStepQuestion>¿Cómo se llama tu tienda?</RegistrationStepQuestion>
                <RegistrationIconInput icon={<StoreIcon />} label="Nombre de tu tienda">
                  <input
                    className="input"
                    required
                    value={shopName}
                    onChange={(e) => onShopNameChange(e.target.value)}
                    placeholder="Mi tienda"
                  />
                </RegistrationIconInput>
              </div>

              <div className="space-y-2">
                <RegistrationStepQuestion>¿Dónde te escriben tus clientes?</RegistrationStepQuestion>
                <RegistrationIconInput icon={<WhatsAppIcon />} label="WhatsApp (con código de país)">
                  <input
                    className="input"
                    required
                    inputMode="numeric"
                    placeholder="5492615000000"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, ''))}
                  />
                </RegistrationIconInput>
              </div>

              <label className="block space-y-1.5">
                <RegistrationFieldHint>Rubro (opcional)</RegistrationFieldHint>
                <RubroField value={rubro} onChange={setRubro} fieldId="complete-register-rubro" />
              </label>
            </>
          )}

          <RegistrationUrlField
            slug={slug}
            slugTaken={slugTaken}
            slugChecking={slugChecking}
            cleanSlug={cleanSlug}
            slugTakenMessage={slugTakenMessage}
            disabled={loading}
            errorId="complete-register-slug-error"
            onSlugChange={(value) => {
              setSlug(slugify(value))
              if (error === slugTakenMessage) setError(null)
            }}
          />

          <button
            type="submit"
            disabled={loading || slugChecking || slugTaken || cleanSlug.length < 3}
            className="btn-primary w-full py-3 text-base"
          >
            {loading ? 'Creando tu tienda…' : 'Continuar'}
          </button>
        </div>
        <RegistrationFooterLink text="¿Problemas para entrar?" linkText="Volver a ingresar" href="/login" />
      </RegistrationCard>
    </form>
  )
}

function resolveReferralSlug(
  fromUrl?: string | null,
  fromMetadata?: string | null,
): string | null {
  const raw = fromUrl?.trim() || fromMetadata?.trim() || ''
  if (!raw) return null
  const slug = slugify(raw)
  return slug.length >= 3 ? slug : null
}
