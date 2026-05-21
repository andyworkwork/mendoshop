'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { revalidateStorefront, updateShopSettings } from '@/app/actions/shop'
import { compressImageForUpload } from '@/lib/image-compress'
import { getPublicUrlFromPath } from '@/lib/publicUrl'
import { resolveShopBannerUrl } from '@/lib/shops'
import { shopBannerStoragePath } from '@/lib/shop-banner'
import { createClient } from '@/lib/supabase/browser'
import type { ShopRow } from '@/types/shop'

export function ShopBannerUpload({
  shop,
  onShopChange,
}: {
  shop: ShopRow
  onShopChange?: (next: ShopRow) => void
}) {
  const [bannerPath, setBannerPath] = useState(shop.banner_path)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const previewShop = useMemo(
    () => ({ ...shop, banner_path: bannerPath }),
    [shop, bannerPath],
  )
  const previewUrl = resolveShopBannerUrl(previewShop)
  const hasCustom = Boolean(bannerPath)

  async function upload(file: File | null) {
    if (!file) return
    setBusy(true)
    setMsg(null)
    const sb = createClient()
    const path = shopBannerStoragePath(shop.id)
    try {
      const webp = await compressImageForUpload(file, 'banner')
      const uploadOpts = {
        upsert: true,
        contentType: 'image/webp',
        cacheControl: '86400',
      } as const
      const { error: upErr } = await sb.storage.from('shop-images').upload(path, webp, uploadOpts)
      if (upErr) throw upErr

      const res = await updateShopSettings(shop.id, { banner_path: path })
      if ('error' in res && res.error) throw new Error(res.error)

      setBannerPath(path)
      onShopChange?.({ ...shop, banner_path: path })
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
    const path = shopBannerStoragePath(shop.id)
    try {
      await sb.storage.from('shop-images').remove([path])
      const res = await updateShopSettings(shop.id, { banner_path: null })
      if ('error' in res && res.error) throw new Error(res.error)
      setBannerPath(null)
      onShopChange?.({ ...shop, banner_path: null })
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
            <span className="text-zinc-400">{getPublicUrlFromPath(bannerPath) ?? bannerPath}</span>
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
