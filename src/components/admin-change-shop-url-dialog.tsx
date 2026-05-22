'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateShopSlugAdmin } from '@/app/actions/admin'
import { slugify } from '@/lib/format'
import { shopPublicUrl } from '@/lib/publicUrl'

type Props = {
  shopId: string
  shopName: string
  currentSlug: string
  open: boolean
  onClose: () => void
}

export function AdminChangeShopUrlDialog({
  shopId,
  shopName,
  currentSlug,
  open,
  onClose,
}: Props) {
  const router = useRouter()
  const [slugInput, setSlugInput] = useState(currentSlug)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const cleanSlug = slugify(slugInput)
  const slugValid = cleanSlug.length >= 3
  const slugChanged = slugValid && cleanSlug !== currentSlug

  useEffect(() => {
    if (!open) return
    setSlugInput(currentSlug)
    setShowConfirm(false)
    setError(null)
  }, [open, currentSlug])

  if (!open) return null

  function handleClose() {
    if (pending) return
    setError(null)
    setShowConfirm(false)
    setSlugInput(currentSlug)
    onClose()
  }

  function handleReview(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!slugValid) {
      setError('El link debe tener al menos 3 caracteres.')
      return
    }
    if (!slugChanged) {
      setError('Ingresá un link distinto al actual.')
      return
    }
    setShowConfirm(true)
  }

  function handleConfirm() {
    setError(null)
    startTransition(async () => {
      const res = await updateShopSlugAdmin({ shopId, slug: cleanSlug })
      if ('error' in res) {
        setError(res.error)
        return
      }
      router.refresh()
      handleClose()
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="change-url-title"
    >
      <button type="button" className="absolute inset-0 bg-black/70" aria-label="Cerrar" onClick={handleClose} />
      <div className="relative z-10 w-full max-w-md space-y-4 rounded-2xl border border-zinc-700 bg-zinc-900 p-5 shadow-xl">
        <div>
          <h3 id="change-url-title" className="text-lg font-semibold text-white">
            Cambiar URL de la tienda
          </h3>
          <p className="mt-1 text-sm text-zinc-400">{shopName}</p>
        </div>

        {error && (
          <p className="text-sm text-red-400" role="alert">
            {error}
          </p>
        )}

        {!showConfirm ? (
          <form onSubmit={handleReview} className="space-y-4">
            <label className="block text-sm">
              Nuevo link (slug)
              <input
                className="input mt-1 font-mono text-sm"
                value={slugInput}
                onChange={(e) => setSlugInput(slugify(e.target.value))}
                placeholder="mi-tienda"
                autoComplete="off"
                disabled={pending}
              />
            </label>
            <p className="text-xs text-zinc-500">
              Vista previa:{' '}
              <span className="text-brand-accent break-all">
                {slugValid ? shopPublicUrl(cleanSlug) : '—'}
              </span>
            </p>
            <p className="text-xs text-zinc-500">
              Actual: <span className="text-zinc-300">{shopPublicUrl(currentSlug)}</span>
            </p>
            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={pending}
                className="rounded-xl border border-zinc-600 px-4 py-2 text-sm hover:bg-zinc-800"
              >
                Cancelar
              </button>
              <button type="submit" disabled={pending || !slugChanged} className="btn-primary text-sm">
                Continuar
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl border-2 border-amber-500/60 bg-amber-950/40 p-4">
              <p className="text-sm font-semibold text-amber-100">Confirmar cambio de URL</p>
              <p className="mt-2 text-sm text-zinc-300">
                Los enlaces antiguos dejarán de funcionar. Quien tenga guardado el link anterior no podrá
                abrir la tienda hasta usar el nuevo.
              </p>
              <dl className="mt-3 space-y-2 text-sm">
                <div>
                  <dt className="text-xs text-zinc-500">URL actual</dt>
                  <dd className="break-all font-mono text-zinc-400">{shopPublicUrl(currentSlug)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-zinc-500">URL nueva</dt>
                  <dd className="break-all font-mono text-brand">{shopPublicUrl(cleanSlug)}</dd>
                </div>
              </dl>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  setShowConfirm(false)
                  setError(null)
                }}
                className="rounded-xl border border-zinc-600 px-4 py-2 text-sm hover:bg-zinc-800"
              >
                Volver
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={handleConfirm}
                className="rounded-xl border border-amber-500/70 bg-amber-600/25 px-4 py-2 text-sm font-semibold text-amber-100 hover:bg-amber-600/35"
              >
                {pending ? 'Guardando…' : 'Confirmar cambio'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
