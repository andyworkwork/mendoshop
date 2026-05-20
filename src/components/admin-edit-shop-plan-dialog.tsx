'use client'

import { useState, useTransition } from 'react'
import { setShopPlanAdmin } from '@/app/actions/admin'
import { planLabel } from '@/lib/plans'
import type { ShopPlan } from '@/types/shop'

const PLANS: ShopPlan[] = ['free_trial', 'basic', 'pro']

type Props = {
  shopId: string
  shopName: string
  currentPlan: ShopPlan
  open: boolean
  onClose: () => void
}

export function AdminEditShopPlanDialog({ shopId, shopName, currentPlan, open, onClose }: Props) {
  const [plan, setPlan] = useState<ShopPlan>(currentPlan)
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  if (!open) return null

  function handleClose() {
    if (pending) return
    setError(null)
    setPlan(currentPlan)
    onClose()
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const res = await setShopPlanAdmin({
        shopId,
        plan,
        reason: reason.trim() || undefined,
      })
      if ('error' in res) {
        setError(res.error)
        return
      }
      setReason('')
      onClose()
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
    >
      <button type="button" className="absolute inset-0 bg-black/70" aria-label="Cerrar" onClick={handleClose} />
      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-md space-y-4 rounded-2xl border border-zinc-700 bg-zinc-900 p-5 shadow-xl"
      >
        <div>
          <h3 className="text-lg font-semibold text-white">Cambiar plan</h3>
          <p className="mt-1 text-sm text-zinc-400">{shopName}</p>
          <p className="mt-1 text-xs text-zinc-500">
            Actual: <span className="text-zinc-300">{planLabel(currentPlan)}</span>
          </p>
        </div>
        {error && (
          <p className="text-sm text-red-400" role="alert">
            {error}
          </p>
        )}
        <label className="block text-sm">
          Nuevo plan
          <select className="input mt-1" value={plan} onChange={(e) => setPlan(e.target.value as ShopPlan)}>
            {PLANS.map((p) => (
              <option key={p} value={p}>
                {planLabel(p)}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          Nota (opcional, aparece en historial)
          <textarea
            rows={2}
            className="input mt-1 resize-y"
            placeholder="Ej.: Pago por transferencia, cortesía…"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </label>
        <div className="flex flex-wrap gap-2 pt-1">
          <button type="submit" disabled={pending} className="btn-primary flex-1 sm:flex-none">
            {pending ? 'Guardando…' : 'Guardar plan'}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={handleClose}
            className="rounded-lg border border-zinc-600 px-4 py-2 text-sm hover:bg-zinc-800"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
