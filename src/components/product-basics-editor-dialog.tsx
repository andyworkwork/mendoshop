'use client'

import { useEffect, useState } from 'react'

type Props = {
  open: boolean
  productName: string
  initialPrice: number
  busy: boolean
  onClose: () => void
  onSave: (name: string, price: number) => void
}

export function ProductBasicsEditorDialog({
  open,
  productName,
  initialPrice,
  busy,
  onClose,
  onSave,
}: Props) {
  const [name, setName] = useState(productName)
  const [price, setPrice] = useState(String(initialPrice))

  useEffect(() => {
    if (open) {
      setName(productName)
      setPrice(String(initialPrice))
    }
  }, [open, productName, initialPrice])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/70" aria-label="Cerrar" onClick={onClose} />
      <div
        className="relative z-10 w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-950 p-5 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-basics-title"
      >
        <h2 id="product-basics-title" className="text-lg font-semibold text-white">
          Nombre y precio
        </h2>
        <div className="mt-4 space-y-3">
          <label className="block space-y-1">
            <span className="text-xs text-zinc-400">Nombre</span>
            <input
              className="input w-full"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={120}
              autoFocus
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs text-zinc-400">Precio</span>
            <input
              className="input w-full"
              inputMode="decimal"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <button type="button" className="rounded-xl border border-zinc-600 px-4 py-2 text-sm" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="button"
            disabled={busy}
            className="btn-primary text-sm"
            onClick={() => {
              const n = Number(price.replace(',', '.').trim())
              if (!name.trim()) return
              if (!Number.isFinite(n) || n < 0) return
              onSave(name.trim(), n)
            }}
          >
            {busy ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}
