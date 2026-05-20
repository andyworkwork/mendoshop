'use client'

import { useEffect, useState } from 'react'
import { fetchShopPlanActivity, type ShopPlanActivity } from '@/app/actions/admin'
import { formatMoneyArs } from '@/lib/format'
import { checkoutProductLabel, isPlanCheckoutProduct } from '@/lib/plan-checkout'
import { planLabel } from '@/lib/plans'

type Props = {
  shopId: string
  shopName: string
  open: boolean
  onClose: () => void
}

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function paymentProductLabel(plan: string) {
  if (isPlanCheckoutProduct(plan)) return checkoutProductLabel(plan)
  return planLabel(plan as 'free_trial' | 'basic' | 'pro')
}

function paymentStatusLabel(status: string) {
  switch (status) {
    case 'approved':
      return 'Aprobado'
    case 'pending':
      return 'Pendiente'
    case 'rejected':
      return 'Rechazado'
    case 'cancelled':
      return 'Cancelado'
    default:
      return status
  }
}

export function AdminShopPlanHistoryDialog({ shopId, shopName, open, onClose }: Props) {
  const [data, setData] = useState<ShopPlanActivity | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || !shopId) return
    setLoading(true)
    setError(null)
    fetchShopPlanActivity(shopId).then((res) => {
      if ('error' in res) {
        setError(res.error)
        setData(null)
      } else {
        setData(res)
      }
      setLoading(false)
    })
  }, [open, shopId])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
    >
      <button type="button" className="absolute inset-0 bg-black/70" aria-label="Cerrar" onClick={onClose} />
      <div className="relative z-10 flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-900 shadow-xl">
        <div className="border-b border-zinc-800 p-5">
          <h3 className="text-lg font-semibold text-white">Historial de plan</h3>
          <p className="mt-1 text-sm text-zinc-400">{shopName}</p>
        </div>
        <div className="overflow-y-auto p-5 space-y-6">
          {loading && <p className="text-sm text-zinc-400">Cargando…</p>}
          {error && (
            <p className="text-sm text-red-400" role="alert">
              {error}
            </p>
          )}
          {data && !loading && (
            <>
              <section>
                <h4 className="text-sm font-semibold text-zinc-200">Días agregados (manual o pago)</h4>
                {data.grants.length === 0 ? (
                  <p className="mt-2 text-sm text-zinc-500">Sin registros todavía.</p>
                ) : (
                  <ul className="mt-2 space-y-2">
                    {data.grants.map((g) => (
                      <li
                        key={g.id}
                        className="rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2 text-sm"
                      >
                        <p className="font-medium text-zinc-200">
                          {g.days_added > 0 ? (
                            <>
                              +{g.days_added} día{g.days_added === 1 ? '' : 's'}
                            </>
                          ) : (
                            <span className="text-zinc-400">Cambio de plan (sin días)</span>
                          )}
                        </p>
                        <p className="mt-0.5 text-zinc-400">{g.reason}</p>
                        <p className="mt-1 text-xs text-zinc-500">{formatWhen(g.created_at)}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
              <section>
                <h4 className="text-sm font-semibold text-zinc-200">Pagos Mercado Pago</h4>
                {data.payments.length === 0 ? (
                  <p className="mt-2 text-sm text-zinc-500">Sin pagos registrados.</p>
                ) : (
                  <ul className="mt-2 space-y-2">
                    {data.payments.map((p) => (
                      <li
                        key={p.id}
                        className="rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2 text-sm"
                      >
                        <p className="font-medium text-zinc-200">
                          {paymentProductLabel(p.plan)} ·{' '}
                          {formatMoneyArs(p.amount_ars, p.amount_ars < 1 ? 2 : undefined)}
                        </p>
                        <p className="mt-0.5 text-zinc-400">
                          +{p.days_added} día{p.days_added === 1 ? '' : 's'} ·{' '}
                          <span
                            className={
                              p.status === 'approved'
                                ? 'text-emerald-400'
                                : p.status === 'pending'
                                  ? 'text-amber-300'
                                  : 'text-zinc-500'
                            }
                          >
                            {paymentStatusLabel(p.status)}
                          </span>
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">{formatWhen(p.created_at)}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          )}
        </div>
        <div className="border-t border-zinc-800 p-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-lg border border-zinc-600 py-2 text-sm hover:bg-zinc-800"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
