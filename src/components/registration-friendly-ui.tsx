'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { ShopLinkPrefix } from '@/components/shop-link-prefix'

export function getRegistrationGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return '¡Buenos días!'
  if (hour < 19) return '¡Buenas tardes!'
  return '¡Buenas noches!'
}

export function RegistrationCard({ children }: { children: ReactNode }) {
  return <div className="registration-card mx-auto max-w-lg">{children}</div>
}

export function RegistrationHeader({
  title,
  subtitle,
}: {
  title?: string
  subtitle?: string
}) {
  return (
    <header className="registration-card-header">
      <h1 className="text-2xl font-bold text-brand">{title ?? getRegistrationGreeting()}</h1>
      <p className="mt-1 text-sm text-zinc-400">{subtitle ?? 'Vamos juntos a crear tu cuenta'}</p>
    </header>
  )
}

export function RegistrationStepQuestion({ children }: { children: ReactNode }) {
  return <p className="text-base font-semibold text-zinc-100">{children}</p>
}

export function RegistrationFieldHint({ children }: { children: ReactNode }) {
  return <span className="text-xs text-zinc-500">{children}</span>
}

export function RegistrationIconInput({
  icon,
  label,
  hint,
  children,
}: {
  icon: ReactNode
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <label className="block space-y-1.5">
      <RegistrationFieldHint>{label}</RegistrationFieldHint>
      <div className="registration-input-wrap">
        <span className="registration-input-icon" aria-hidden>
          {icon}
        </span>
        {children}
      </div>
      {hint ? <p className="text-xs text-zinc-500">{hint}</p> : null}
    </label>
  )
}

export function RegistrationUrlField({
  slug,
  slugTaken,
  slugChecking,
  cleanSlug,
  slugTakenMessage,
  disabled,
  onSlugChange,
  errorId = 'register-slug-error',
}: {
  slug: string
  slugTaken: boolean
  slugChecking: boolean
  cleanSlug: string
  slugTakenMessage: string
  disabled?: boolean
  onSlugChange: (value: string) => void
  errorId?: string
}) {
  return (
    <div className="space-y-1.5">
      <RegistrationStepQuestion>¿Cómo querés que sea el link de tu tienda?</RegistrationStepQuestion>
      <RegistrationFieldHint>La URL de tu tienda será:</RegistrationFieldHint>
      <div className="registration-url-group">
        <span className="registration-url-prefix">
          <ShopLinkPrefix />
        </span>
        <input
          className="registration-url-input"
          required
          disabled={disabled}
          value={slug}
          onChange={(e) => onSlugChange(e.target.value)}
          placeholder="mitienda"
          pattern={'[a-z0-9]([a-z0-9-]{1,48}[a-z0-9])?'}
          aria-invalid={slugTaken}
          aria-describedby={slugTaken ? errorId : undefined}
        />
      </div>
      <p className="text-xs text-zinc-500">
        Podés cambiarlo más adelante desde tu panel. Solo letras, números y guiones.
      </p>
      {slugTaken && (
        <p id={errorId} className="text-sm text-red-400">
          {slugTakenMessage}
        </p>
      )}
      {slugChecking && cleanSlug.length >= 3 && !slugTaken && (
        <p className="text-xs text-zinc-500">Verificando link…</p>
      )}
    </div>
  )
}

export function RegistrationSectionDivider({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-1 border-t border-zinc-800 pt-5">
      <p className="text-sm font-medium text-zinc-300">{children}</p>
    </div>
  )
}

export function RegistrationFooterLink({
  text,
  linkText,
  href,
}: {
  text: string
  linkText: string
  href: string
}) {
  return (
    <p className="registration-card-footer text-center text-sm text-zinc-500">
      {text}{' '}
      <Link href={href} className="font-semibold text-brand-accent hover:underline">
        {linkText}
      </Link>
    </p>
  )
}

export function PersonIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  )
}

export function StoreIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 9l1-4h16l1 4M4 9h16v11H4V9zm4 11V9m8 11V9M8 9V6h8v3"
      />
    </svg>
  )
}

export function WhatsAppIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 10h.01M12 10h.01M16 10h.01M9 16h6m2 5a9 9 0 11-4.5-16.86"
      />
    </svg>
  )
}

export function MailIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  )
}

export function LockIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
      />
    </svg>
  )
}
