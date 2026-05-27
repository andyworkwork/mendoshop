'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { completeShopRegistration } from '@/app/actions/register'
import { assertShopSlugAvailable, useShopSlugAvailability } from '@/hooks/use-shop-slug-availability'
import { createClient } from '@/lib/supabase/browser'
import { slugify } from '@/lib/format'
import { authConfirmUrl } from '@/lib/publicUrl'
import { pendingShopToUserMetadata } from '@/lib/pending-registration'
import Link from 'next/link'
import { RubroField } from '@/components/rubro-field'
import { RegisterPendingEmail } from '@/components/register-pending-email'
import { RegistrationSuccessCard } from '@/components/registration-success-card'
import {
  LockIcon,
  MailIcon,
  PersonIcon,
  RegistrationCard,
  RegistrationFieldHint,
  RegistrationFooterLink,
  RegistrationHeader,
  RegistrationIconInput,
  RegistrationSectionDivider,
  RegistrationStepQuestion,
  RegistrationUrlField,
  StoreIcon,
  WhatsAppIcon,
} from '@/components/registration-friendly-ui'

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
  const [ownerName, setOwnerName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [shopName, setShopName] = useState('')
  const [slug, setSlug] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [rubro, setRubro] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [pendingEmail, setPendingEmail] = useState<string | null>(null)
  const [createdShop, setCreatedShop] = useState<{ shopName: string; shopSlug: string } | null>(null)
  const { cleanSlug, slugTaken, slugChecking, slugTakenMessage } = useShopSlugAvailability(slug)
  const emailInvalid = email.trim().length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())

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
    if (!ownerName.trim()) {
      setError('Contanos tu nombre para seguir.')
      setLoading(false)
      return
    }
    if (wa.length < 10) {
      setError('Ingresá un WhatsApp válido (código de área + número, solo dígitos).')
      setLoading(false)
      return
    }
    if (emailInvalid) {
      setError('Ingresá un correo válido para crear tu cuenta.')
      setLoading(false)
      return
    }

    const slugError = await assertShopSlugAvailable(cleanSlug)
    if (slugError) {
      setError(slugError)
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
        data: {
          ...pendingShopToUserMetadata(pending),
          full_name: ownerName.trim(),
        },
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

    setCreatedShop({ shopName: res.shopName, shopSlug: res.shopSlug })
  }

  if (createdShop) {
    return (
      <RegistrationSuccessCard shopName={createdShop.shopName} shopSlug={createdShop.shopSlug} />
    )
  }

  if (pendingEmail) {
    return <RegisterPendingEmail email={pendingEmail} />
  }

  return (
    <form onSubmit={onSubmit}>
      <RegistrationCard>
        <RegistrationHeader subtitle="Vamos juntos a crear tu cuenta · 7 días gratis, sin tarjeta" />
        <div className="registration-card-body">
          {referralSlug?.trim() && (
            <p className="rounded-xl border border-brand/30 bg-brand/10 px-3 py-2 text-sm text-brand-accent">
              Te invitó una tienda de Mendoshop — ¡bienvenido!
            </p>
          )}
          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="space-y-2">
            <RegistrationStepQuestion>Primero… ¿cómo te llamás?</RegistrationStepQuestion>
            <RegistrationIconInput icon={<PersonIcon />} label="Nombre y apellido">
              <input
                className="input"
                required
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="Mi nombre"
                autoComplete="name"
              />
            </RegistrationIconInput>
          </div>

          <div className="space-y-2">
            <RegistrationStepQuestion>Y ahora… ¿cómo se llama tu tienda?</RegistrationStepQuestion>
            <RegistrationIconInput icon={<StoreIcon />} label="Nombre de tu tienda">
              <input
                className="input"
                required
                value={shopName}
                onChange={(e) => onShopNameChange(e.target.value)}
                placeholder="Mi tienda"
                autoComplete="organization"
              />
            </RegistrationIconInput>
          </div>

          <RegistrationUrlField
            slug={slug}
            slugTaken={slugTaken}
            slugChecking={slugChecking}
            cleanSlug={cleanSlug}
            slugTakenMessage={slugTakenMessage}
            disabled={loading}
            onSlugChange={(value) => {
              setSlug(slugify(value))
              if (error === slugTakenMessage) setError(null)
            }}
          />

          <div className="space-y-2">
            <RegistrationStepQuestion>¿Dónde te escriben tus clientes?</RegistrationStepQuestion>
            <RegistrationIconInput
              icon={<WhatsAppIcon />}
              label="WhatsApp (con código de país)"
              hint="Ejemplo: 5492615000000. Solo números, sin espacios."
            >
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
            <RegistrationFieldHint>Rubro (opcional, para el directorio de tiendas)</RegistrationFieldHint>
            <RubroField value={rubro} onChange={setRubro} fieldId="register-rubro" />
          </label>

          <RegistrationSectionDivider>Último paso: tu acceso al panel</RegistrationSectionDivider>

          <RegistrationIconInput icon={<MailIcon />} label="Tu email">
            <input
              className="input"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              autoComplete="email"
            />
          </RegistrationIconInput>
          {emailInvalid && <p className="text-xs text-amber-300">Este no parece un correo válido.</p>}

          <RegistrationIconInput icon={<LockIcon />} label="Contraseña" hint="Mínimo 6 caracteres.">
            <input
              className="input"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </RegistrationIconInput>

          <button
            type="submit"
            disabled={loading || slugChecking || slugTaken || cleanSlug.length < 3}
            className="btn-primary w-full py-3 text-base"
          >
            {loading ? 'Creando tu tienda…' : 'Continuar'}
          </button>
        </div>
        <RegistrationFooterLink text="¿Ya tenés tu cuenta?" linkText="Ingresar acá" href="/login" />
      </RegistrationCard>
    </form>
  )
}
