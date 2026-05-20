'use client'

import { useState, useTransition } from 'react'
import { grantPlanDaysToShop } from '@/app/actions/admin'

type Props = {
  shopId: string
  shopName: string
  open: boolean
  onClose: () => void
}

export function AdminAddPlanDaysDialog({ shopId, shopName, open, onClose }: Props) {
  const [days, setDays] = useState(7)
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  if (!open) return null

  function handleClose() {
    if (pending) return
    setError(null)
    onClose()
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const res = await grantPlanDaysToShop({ shopId, days, reason })
      if ('error' in res) {
        setError(res.error)
        return
      }
      setReason('')
      setDays(7)
      onClose()
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-days-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/70"
        aria-label="Cerrar"
        onClick={handleClose}
      />
      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-md space-y-4 rounded-2xl border border-zinc-700 bg-zinc-900 p-5 shadow-xl"
      >
        <div>
          <h3 id="add-days-title" className="text-lg font-semibold text-white">
            Agregar días de plan
          </h3>
          <p className="mt-1 text-sm text-zinc-400">{shopName}</p>
        </div>
        {error && (
          <p className="text-sm text-red-400" role="alert">
            {error}
          </p>
        )}
        <label className="block text-sm">
          Días a sumar
          <input
            type="number"
            min={1}
            max={365}
            required
            className="input mt-1"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
          />
        </label>
        <label className="block text-sm">
          Motivo (lo verá el comercio en Cuenta)
          <textarea
            required
            minLength={3}
            rows={3}
            className="input mt-1 resize-y"
            placeholder="Ej.: Pago recibido por transferencia, promoción de bienvenida…"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </label>
        <div className="flex flex-wrap gap-2 pt-1">
          <button type="submit" disabled={pending} className="btn-primary flex-1 sm:flex-none">
            {pending ? 'Guardando…' : 'Confirmar'}
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
