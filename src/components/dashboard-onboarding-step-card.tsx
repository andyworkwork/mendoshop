import Link from 'next/link'
import type { ReactNode } from 'react'

export function onboardingStepLabelClassName() {
  return 'rounded-full border border-amber-300/90 bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-950 shadow-md'
}

export function DashboardOnboardingStepCard({
  stepLabel,
  href,
  buttonLabel,
  footer,
}: {
  stepLabel: string
  href: string
  buttonLabel: string
  footer?: ReactNode
}) {
  return (
    <div className="mb-2">
      <div className="inline-flex max-w-full flex-col items-start gap-2 rounded-xl border border-amber-500/35 bg-amber-500/10 p-4">
        <span className={onboardingStepLabelClassName()}>{stepLabel}</span>
        <Link href={href} className="btn-primary text-sm">
          {buttonLabel}
        </Link>
        {footer}
      </div>
    </div>
  )
}
