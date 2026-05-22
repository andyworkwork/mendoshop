'use client'

import { useEffect, useState } from 'react'

type Props = {
  open: boolean
  productName: string
  initialDetails: string
  busy: boolean
  onClose: () => void
  onSave: (details: string) => void
}

export function ProductDetailsEditorDialog({
  open,
  productName,
  initialDetails,
  busy,
  onClose,
  onSave,
}: Props) {
  const [text, setText] = useState(initialDetails)

  useEffect(() => {
    if (open) setText(initialDetails)
  }, [open, initialDetails])

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
      <button
        type="button"
        className="absolute inset-0 bg-black/70"
        aria-label="Cerrar"
        onClick={onClose}
      />
      <div
        className="relative z-10 w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-950 p-5 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-details-title"
      >
        <h2 id="product-details-title" className="text-lg font-semibold text-white">
          Detalles del producto
        </h2>
        <p className="mt-1 text-sm text-zinc-400 truncate">{productName}</p>
        <p className="mt-2 text-xs text-zinc-500">
          Talle, material, envíos, cuidados… El cliente lo ve al tocar la foto en la tienda.
        </p>
        <textarea
          className="input mt-4 min-h-[140px] w-full resize-y"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ej: Remera de algodón. Talles 5 al 6. Consultar stock por WhatsApp."
          maxLength={2000}
          autoFocus
        />
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <button type="button" className="rounded-xl border border-zinc-600 px-4 py-2 text-sm" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="button"
            disabled={busy}
            className="btn-primary text-sm"
            onClick={() => onSave(text)}
          >
            {busy ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}
