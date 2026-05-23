'use client'

import { useState } from 'react'
import Image from 'next/image'
import { revalidateStorefront, updateShopSettings } from '@/app/actions/shop'
import { compressImageForUpload } from '@/lib/image-compress'
import { getPublicUrlFromPath } from '@/lib/publicUrl'
import { resolveShopBannerUrl } from '@/lib/shops'
import { newShopBannerRevision, shopBannerStoragePath } from '@/lib/shop-banner'
import { SHOP_IMAGES_CACHE_CONTROL } from '@/lib/storage-cache'
import { createClient } from '@/lib/supabase/browser'
import type { ShopRow } from '@/types/shop'

export function ShopBannerUpload({
  shop,
  onShopChange,
  onUploaded,
}: {
  shop: ShopRow
  onShopChange?: (next: ShopRow) => void
  onUploaded?: () => void
}) {
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const previewUrl = resolveShopBannerUrl(shop)
  const hasCustom = Boolean(shop.banner_path)

  async function upload(file: File | null) {
    if (!file) return
    setBusy(true)
    setMsg(null)
    const sb = createClient()
    const previousPath = shop.banner_path
    const path = shopBannerStoragePath(shop.id, newShopBannerRevision())
    try {
      const webp = await compressImageForUpload(file, 'banner')
      const uploadOpts = {
        upsert: false,
        contentType: 'image/webp',
        cacheControl: SHOP_IMAGES_CACHE_CONTROL,
      } as const
      const { error: upErr } = await sb.storage.from('shop-images').upload(path, webp, uploadOpts)
      if (upErr) throw upErr

      const res = await updateShopSettings(shop.id, {
        banner_path: path,
        banner_focus_x: 50,
        banner_focus_y: 50,
      })
      if ('error' in res && res.error) throw new Error(res.error)

      if (previousPath && previousPath !== path) {
        await sb.storage.from('shop-images').remove([previousPath])
      }

      const updatedAt = new Date().toISOString()
      onShopChange?.({
        ...shop,
        banner_path: path,
        banner_focus_x: 50,
        banner_focus_y: 50,
        updated_at: updatedAt,
      })
      onUploaded?.()
      setMsg('Banner actualizado (WebP optimizado).')
      await revalidateStorefront(shop.slug)
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Error al subir el banner')
    }
    setBusy(false)
  }

  async function clearCustom() {
    if (!hasCustom) return
    setBusy(true)
    setMsg(null)
    const sb = createClient()
    try {
      if (shop.banner_path) {
        await sb.storage.from('shop-images').remove([shop.banner_path])
      }
      const res = await updateShopSettings(shop.id, {
        banner_path: null,
        banner_focus_x: 50,
        banner_focus_y: 50,
      })
      if ('error' in res && res.error) throw new Error(res.error)

      onShopChange?.({
        ...shop,
        banner_path: null,
        banner_focus_x: 50,
        banner_focus_y: 50,
        updated_at: new Date().toISOString(),
      })
      onUploaded?.()
      setMsg('Volviste a la imagen de la plantilla.')
      await revalidateStorefront(shop.slug)
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Error al quitar el banner')
    }
    setBusy(false)
  }

  return (
    <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
      <div>
        <p className="text-sm font-medium text-zinc-200">Imagen de portada (banner)</p>
        <p className="mt-1 text-xs text-zinc-500">
          Subí tu foto: se optimiza y convierte a WebP como las del catálogo. Si no subís nada, se usa la
          imagen de la plantilla del rubro.
        </p>
      </div>

      {previewUrl ? (
        <div className="relative aspect-[21/9] w-full overflow-hidden rounded-xl border border-zinc-700 bg-zinc-800">
          {previewUrl.startsWith('/') ? (
            <Image src={previewUrl} alt="" fill className="object-cover" sizes="(max-width: 768px) 100vw, 640px" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
          )}
        </div>
      ) : (
        <div className="flex aspect-[21/9] items-center justify-center rounded-xl border border-dashed border-zinc-700 bg-zinc-800/50 text-xs text-zinc-500">
          Sin imagen de portada
        </div>
      )}

      <p className="text-xs text-zinc-500">
        {hasCustom ? (
          <>
            Usás tu imagen:{' '}
            <span className="text-zinc-400">
              {getPublicUrlFromPath(shop.banner_path) ?? shop.banner_path}
            </span>
          </>
        ) : (
          'Mostrando imagen sugerida de la plantilla.'
        )}
      </p>

      <div className="flex flex-wrap gap-2">
        <label className="btn-primary cursor-pointer text-sm">
          {busy ? 'Procesando…' : hasCustom ? 'Cambiar imagen' : 'Subir mi imagen'}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={busy}
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null
              e.target.value = ''
              void upload(f)
            }}
          />
        </label>
        {hasCustom && (
          <button
            type="button"
            disabled={busy}
            onClick={() => void clearCustom()}
            className="rounded-xl border border-zinc-600 px-4 py-2 text-sm hover:bg-zinc-800"
          >
            Usar plantilla
          </button>
        )}
      </div>

      {msg && (
        <p className={`text-xs ${msg.includes('Error') || msg.toLowerCase().includes('error') ? 'text-red-400' : 'text-brand'}`}>
          {msg}
        </p>
      )}
    </div>
  )
}
