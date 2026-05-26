'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createPlanCheckout, createPlanQr, syncPlanPaymentFromQrOrder } from '@/app/actions/billing'
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
  const [qrOrderId, setQrOrderId] = useState<string | null>(null)
  const [qrSyncing, setQrSyncing] = useState(false)
  const [qrActivated, setQrActivated] = useState(false)
  const router = useRouter()
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function clearQrPoll() {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }

  async function verifyQrPayment(orderId: string, options?: { silent?: boolean }) {
    if (!options?.silent) {
      setQrSyncing(true)
      setQrError(null)
    }
    try {
      const result = await syncPlanPaymentFromQrOrder(orderId)
      if ('error' in result) {
        if (!options?.silent) setQrError(result.error)
        return false
      }
      if (result.activated) {
        setQrActivated(true)
        clearQrPoll()
        router.refresh()
        return true
      }
      return false
    } catch {
      if (!options?.silent) {
        setQrError('No se pudo verificar el pago. Intentá de nuevo.')
      }
      return false
    } finally {
      if (!options?.silent) setQrSyncing(false)
    }
  }

  useEffect(() => {
    if (!qrOrderId || qrActivated) return

    void verifyQrPayment(qrOrderId, { silent: true })
    pollRef.current = setInterval(() => {
      void verifyQrPayment(qrOrderId, { silent: true })
    }, 5000)

    return () => {
      clearQrPoll()
    }
  }, [qrOrderId, qrActivated, router])

  async function handleGenerateQr() {
    setQrError(null)
    setQrActivated(false)
    setQrOrderId(null)
    clearQrPoll()
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
      setQrOrderId(result.mpOrderId)
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
          {qrActivated ? (
            <p className="text-sm text-emerald-300">¡Listo! Tu plan ya está activo.</p>
          ) : (
            <>
              <p className="text-sm text-zinc-200">Escaneá el QR para pagar el plan.</p>
              <p className="text-xs text-zinc-400">
                {qrSyncing
                  ? 'Verificando pago con Mercado Pago…'
                  : 'Cuando pagues, activamos el plan automáticamente.'}
              </p>
            </>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrDataUrl} alt="QR de pago para el plan" className="rounded-xl border border-zinc-700" />
          {!qrActivated && qrOrderId && (
            <button
              type="button"
              disabled={qrSyncing}
              className="rounded-xl border border-emerald-700/60 px-4 py-2 text-sm text-emerald-200 hover:bg-emerald-950/40 disabled:opacity-60"
              onClick={() => void verifyQrPayment(qrOrderId)}
            >
              {qrSyncing ? 'Verificando…' : 'Ya pagué — verificar'}
            </button>
          )}
          <button
            type="button"
            className="rounded-xl border border-zinc-600 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
            onClick={() => {
              clearQrPoll()
              setQrDataUrl(null)
              setQrOrderId(null)
              setQrActivated(false)
            }}
          >
            Cerrar
          </button>
        </div>
      )}
    </div>
  )
}
