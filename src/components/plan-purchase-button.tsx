'use client'

import { useState } from 'react'
import { createPlanCheckout, createPlanQr } from '@/app/actions/billing'
import type { PlanCheckoutProduct } from '@/lib/plan-checkout'
import QRCode from 'qrcode'

type Props = {
  plan: PlanCheckoutProduct
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
  const [qrPending, setQrPending] = useState(false)
  const [qrError, setQrError] = useState<string | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)

  async function handleGenerateQr() {
    setQrError(null)
    setQrPending(true)
    try {
      const result = await createPlanQr(plan)
      if ('error' in result) {
        setQrError(result.error)
        return
      }
      const url = await QRCode.toDataURL(result.qrData, {
        width: 240,
        margin: 2,
        errorCorrectionLevel: 'M',
      })
      setQrDataUrl(url)
    } catch {
      setQrError('No se pudo generar el QR. Intentá de nuevo.')
    } finally {
      setQrPending(false)
    }
  }

  const primaryRowButtonClassName =
    className.includes('block w-full') && className.includes('min-w-')
      ? className
      : className.replace('block w-full', 'flex-1 min-w-[220px]')

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
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={handleClick}
          className={primaryRowButtonClassName}
        >
          {pending ? 'Redirigiendo a Mercado Pago…' : label}
        </button>
        <button
          type="button"
          disabled={qrPending}
          onClick={() => void handleGenerateQr()}
          className="btn-secondary-outline flex-1 min-w-[220px] py-2.5 text-sm text-center"
        >
          {qrPending ? 'Generando QR…' : 'Generar QR para pagar'}
        </button>
      </div>

      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
      {qrError && <p className="mt-2 text-xs text-red-400">{qrError}</p>}

      {qrDataUrl && (
        <div className="mt-4 flex flex-col items-center gap-3 rounded-xl border border-zinc-700 bg-zinc-900/30 p-4">
          <p className="text-sm text-zinc-200">Escaneá el QR para pagar el plan.</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrDataUrl} alt="QR de pago para el plan" className="rounded-xl border border-zinc-700" />
          <button
            type="button"
            className="rounded-xl border border-zinc-600 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
            onClick={() => setQrDataUrl(null)}
          >
            Cerrar
          </button>
        </div>
      )}
    </div>
  )
}
