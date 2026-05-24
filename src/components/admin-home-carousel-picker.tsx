'use client'

import { useMemo, useState } from 'react'
import {
  listHomeCarouselAdmin,
  saveHomeCarouselAdmin,
  type HomeCarouselShopOption,
} from '@/app/actions/admin-home-carousel'
import { HOME_CAROUSEL_MAX_SLIDES } from '@/lib/home-carousel'
import { planLabel } from '@/lib/plans'
import type { ShopPlan } from '@/types/shop'

type Props = {
  initialSelectedIds: string[]
  initialShops: HomeCarouselShopOption[]
}

export function AdminHomeCarouselPicker({ initialSelectedIds, initialShops }: Props) {
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds])
  const atMax = selectedIds.length >= HOME_CAROUSEL_MAX_SLIDES

  function toggleShop(id: string, eligible: boolean) {
    if (!eligible) return
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (prev.length >= HOME_CAROUSEL_MAX_SLIDES) return prev
      return [...prev, id]
    })
    setMessage(null)
    setError(null)
  }

  function moveShop(id: string, dir: -1 | 1) {
    setSelectedIds((prev) => {
      const i = prev.indexOf(id)
      if (i < 0) return prev
      const j = i + dir
      if (j < 0 || j >= prev.length) return prev
      const next = [...prev]
      ;[next[i], next[j]] = [next[j]!, next[i]!]
      return next
    })
  }

  async function save() {
    setBusy(true)
    setMessage(null)
    setError(null)
    const res = await saveHomeCarouselAdmin(selectedIds)
    setBusy(false)
    if ('error' in res) {
      setError(res.error)
      return
    }
    setMessage('Carrusel de la home actualizado.')
  }

  async function useProDefaults() {
    setBusy(true)
    setError(null)
    const res = await saveHomeCarouselAdmin([])
    setBusy(false)
    if ('error' in res) {
      setError(res.error)
      return
    }
    const listed = await listHomeCarouselAdmin()
    if ('error' in listed) {
      setError(listed.error)
      return
    }
    setSelectedIds([])
    setMessage('Sin selección manual: en la home se muestran tiendas Pro activas y el resto son plantillas.')
  }

  const shopById = useMemo(() => new Map(initialShops.map((s) => [s.id, s])), [initialShops])

  return (
    <section className="card space-y-4">
      <div>
        <h2 className="text-base font-semibold text-white sm:text-lg">Tiendas en el carrusel</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Elegí hasta {HOME_CAROUSEL_MAX_SLIDES} tiendas para la home. Si no elegís ninguna, se usan las{' '}
          <span className="text-zinc-200">Pro</span> activas y el resto del carrusel se completa con
          plantillas de ejemplo.
        </p>
      </div>

      {selectedIds.length > 0 && (
        <ol className="space-y-2 rounded-xl border border-brand/30 bg-brand/5 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-brand">Orden en el carrusel</p>
          {selectedIds.map((id, index) => {
            const shop = shopById.get(id)
            if (!shop) return null
            return (
              <li
                key={id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-700/80 bg-zinc-900/50 px-3 py-2"
              >
                <span className="text-sm font-medium text-white">
                  {index + 1}. {shop.name}{' '}
                  <span className="text-xs font-normal text-zinc-500">
                    ({planLabel(shop.plan as ShopPlan)})
                  </span>
                </span>
                <span className="flex gap-1">
                  <button
                    type="button"
                    className="rounded border border-zinc-600 px-2 py-0.5 text-xs text-zinc-300 disabled:opacity-40"
                    disabled={busy || index === 0}
                    onClick={() => moveShop(id, -1)}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="rounded border border-zinc-600 px-2 py-0.5 text-xs text-zinc-300 disabled:opacity-40"
                    disabled={busy || index === selectedIds.length - 1}
                    onClick={() => moveShop(id, 1)}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="rounded border border-zinc-600 px-2 py-0.5 text-xs text-red-300"
                    disabled={busy}
                    onClick={() => toggleShop(id, true)}
                  >
                    Quitar
                  </button>
                </span>
              </li>
            )
          })}
        </ol>
      )}

      <ul className="max-h-72 space-y-2 overflow-y-auto rounded-xl border border-zinc-800 p-2">
        {initialShops.map((shop) => {
          const checked = selectedSet.has(shop.id)
          const disabled = busy || (!checked && atMax) || !shop.eligible
          return (
            <li key={shop.id}>
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${
                  checked
                    ? 'border-brand/50 bg-brand/10'
                    : shop.eligible
                      ? 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-600'
                      : 'cursor-not-allowed border-zinc-800/80 bg-zinc-950/40 opacity-60'
                }`}
              >
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={checked}
                  disabled={disabled}
                  onChange={() => toggleShop(shop.id, shop.eligible)}
                />
                <span className="min-w-0 flex-1">
                  <span className="font-medium text-white">{shop.name}</span>
                  <span className="mt-0.5 block text-xs text-zinc-500">
                    /{shop.slug} · {planLabel(shop.plan as ShopPlan)}
                    {!shop.eligible && ' · No visible (inactiva o plan vencido)'}
                    {shop.plan === 'pro' && shop.eligible && ' · Pro (entra por defecto si no elegís otras)'}
                  </span>
                </span>
              </label>
            </li>
          )
        })}
      </ul>

      <p className="text-xs text-zinc-500">
        {selectedIds.length}/{HOME_CAROUSEL_MAX_SLIDES} tiendas elegidas ·{' '}
        {Math.max(0, HOME_CAROUSEL_MAX_SLIDES - selectedIds.length)} plantillas de relleno en la home
      </p>

      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-primary" disabled={busy} onClick={() => void save()}>
          {busy ? 'Guardando…' : 'Guardar carrusel'}
        </button>
        <button
          type="button"
          className="btn-secondary-outline px-4 py-2 text-sm"
          disabled={busy}
          onClick={() => void useProDefaults()}
        >
          Usar solo Pro (automático)
        </button>
      </div>

      {message && (
        <p className="text-sm text-emerald-400" role="status">
          {message}
        </p>
      )}
      {error && (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
    </section>
  )
}
