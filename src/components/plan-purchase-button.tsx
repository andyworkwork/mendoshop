'use client'

import { useState } from 'react'
import { createPlanCheckout } from '@/app/actions/billing'
import type { PaidShopPlan } from '@/lib/plan-payments'

type Props = {
  plan: PaidShopPlan
  label: string
  mercadoPagoEnabled: boolean
  whatsAppHref?: string
  className?: string
}

export function PlanPurchaseButton({
  plan,
  label,
  mercadoPagoEnabled,
  whatsAppHref,
  className = 'btn-primary block w-full py-2.5 text-sm text-center',
}: Props) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!mercadoPagoEnabled && whatsAppHref) {
    return (
      <div className="mt-4 border-t border-zinc-800 pt-4">
        <a href={whatsAppHref} target="_blank" rel="noopener noreferrer" className={className}>
          {label}
        </a>
      </div>
    )
  }

  if (!mercadoPagoEnabled) {
    return null
  }

  async function handleClick() {
    setError(null)
    setPending(true)
    try {
      const result = await createPlanCheckout(plan)
      if ('checkoutUrl' in result) {
        window.location.href = result.checkoutUrl
        return
      }
      setError('error' in result ? result.error : 'No se pudo iniciar el pago.')
    } catch {
      setError('No se pudo iniciar el pago. Intentá de nuevo.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="mt-4 border-t border-zinc-800 pt-4">
      <button type="button" disabled={pending} onClick={handleClick} className={className}>
        {pending ? 'Redirigiendo a Mercado Pago…' : label}
      </button>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  )
}
