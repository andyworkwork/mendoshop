'use client'

import { useMemo, useState } from 'react'
import {
  clearTemplateShowcaseImageAdmin,
  saveTemplateShowcaseAdmin,
  type TemplateShowcaseInput,
} from '@/app/actions/admin-template-showcase'
import { TemplateShowcasePreview } from '@/components/template-showcase-preview'
import { compressImageForUpload } from '@/lib/image-compress'
import {
  resolveTemplateShowcase,
  type ResolvedTemplateShowcase,
  type TemplateShowcaseRow,
} from '@/lib/template-showcase-data'
import { getPublicUrlFromPath } from '@/lib/publicUrl'
import { getProductImageUrl } from '@/lib/product-images'
import { templateBannerSrc } from '@/lib/store-templates'
import {
  templateShowcaseBannerPath,
  templateShowcaseProductPath,
} from '@/lib/template-showcase-storage'
import { SHOP_IMAGES_CACHE_CONTROL } from '@/lib/storage-cache'
import { STORE_TEMPLATES } from '@/lib/store-templates'
import { createClient } from '@/lib/supabase/browser'

type SlotForm = {
  shop_name: string
  tagline: string
  product_1_name: string
  product_1_price: string
  product_2_name: string
  product_2_price: string
  banner_path: string | null
  product_1_image_path: string | null
  product_2_image_path: string | null
}

function formToPreview(template: (typeof STORE_TEMPLATES)[0], form: SlotForm): ResolvedTemplateShowcase {
  const bannerDefault = templateBannerSrc(template.id) ?? template.bannerSrc
  const p1 = Number(form.product_1_price.replace(',', '.'))
  const p2 = Number(form.product_2_price.replace(',', '.'))
  return {
    templateId: template.id,
    shopName: form.shop_name,
    tagline: form.tagline,
    bannerUrl: form.banner_path
      ? (getPublicUrlFromPath(form.banner_path) ?? bannerDefault)
      : bannerDefault,
    products: [
      {
        name: form.product_1_name,
        price: Number.isFinite(p1) ? p1 : 0,
        imageUrl: form.product_1_image_path
          ? (getProductImageUrl(form.product_1_image_path, 'thumb') ??
            getPublicUrlFromPath(form.product_1_image_path))
          : null,
      },
      {
        name: form.product_2_name,
        price: Number.isFinite(p2) ? p2 : 0,
        imageUrl: form.product_2_image_path
          ? (getProductImageUrl(form.product_2_image_path, 'thumb') ??
            getPublicUrlFromPath(form.product_2_image_path))
          : null,
      },
    ],
  }
}

function rowToForm(templateId: string, row?: TemplateShowcaseInput): SlotForm {
  const tpl = STORE_TEMPLATES.find((t) => t.id === templateId)!
  const mock = resolveTemplateShowcase(
    tpl,
    row ? ({ template_id: templateId, ...row } as TemplateShowcaseRow) : null,
  )
  return {
    shop_name: row?.shop_name ?? mock.shopName,
    tagline: row?.tagline ?? mock.tagline,
    product_1_name: row?.product_1_name ?? mock.products[0]?.name ?? '',
    product_1_price: String(row?.product_1_price ?? mock.products[0]?.price ?? ''),
    product_2_name: row?.product_2_name ?? mock.products[1]?.name ?? '',
    product_2_price: String(row?.product_2_price ?? mock.products[1]?.price ?? ''),
    banner_path: row?.banner_path ?? null,
    product_1_image_path: row?.product_1_image_path ?? null,
    product_2_image_path: row?.product_2_image_path ?? null,
  }
}

function formToInput(form: SlotForm): TemplateShowcaseInput {
  const p1 = Number(form.product_1_price.replace(',', '.'))
  const p2 = Number(form.product_2_price.replace(',', '.'))
  return {
    shop_name: form.shop_name.trim() || null,
    tagline: form.tagline.trim() || null,
    banner_path: form.banner_path,
    product_1_name: form.product_1_name.trim() || null,
    product_1_price: Number.isFinite(p1) ? p1 : null,
    product_1_image_path: form.product_1_image_path,
    product_2_name: form.product_2_name.trim() || null,
    product_2_price: Number.isFinite(p2) ? p2 : null,
    product_2_image_path: form.product_2_image_path,
  }
}

export function AdminTemplateShowcaseEditor({
  initialRows,
}: {
  initialRows: Record<string, TemplateShowcaseInput>
}) {
  const [forms, setForms] = useState<Record<string, SlotForm>>(() => {
    const out: Record<string, SlotForm> = {}
    for (const tpl of STORE_TEMPLATES) {
      out[tpl.id] = rowToForm(tpl.id, initialRows[tpl.id])
    }
    return out
  })
  const [openId, setOpenId] = useState<string | null>(STORE_TEMPLATES[0]?.id ?? null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  const sb = useMemo(() => createClient(), [])

  async function uploadImage(templateId: string, kind: 'banner' | 1 | 2, file: File) {
    setBusyId(templateId)
    setMsg(null)
    try {
      const path =
        kind === 'banner'
          ? templateShowcaseBannerPath(templateId)
          : templateShowcaseProductPath(templateId, kind)
      const variant = kind === 'banner' ? 'banner' : 'thumb'
      const webp = await compressImageForUpload(file, variant)
      const { error: upErr } = await sb.storage.from('shop-images').upload(path, webp, {
        upsert: true,
        contentType: 'image/webp',
        cacheControl: SHOP_IMAGES_CACHE_CONTROL,
      })
      if (upErr) throw upErr

      const field =
        kind === 'banner'
          ? 'banner_path'
          : kind === 1
            ? 'product_1_image_path'
            : 'product_2_image_path'

      const nextForm = { ...forms[templateId]!, [field]: path }
      setForms((f) => ({ ...f, [templateId]: nextForm }))

      const res = await saveTemplateShowcaseAdmin(templateId, formToInput(nextForm))
      if ('error' in res) throw new Error(res.error)
      setMsg(`Imagen guardada (${STORE_TEMPLATES.find((t) => t.id === templateId)?.name}).`)
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Error al subir imagen')
    }
    setBusyId(null)
  }

  async function saveText(templateId: string) {
    setBusyId(templateId)
    setMsg(null)
    const res = await saveTemplateShowcaseAdmin(templateId, formToInput(forms[templateId]!))
    setBusyId(null)
    if ('error' in res) {
      setMsg(res.error)
      return
    }
    setMsg('Textos guardados. La home se actualizó.')
  }

  async function clearImage(
    templateId: string,
    field: 'banner_path' | 'product_1_image_path' | 'product_2_image_path',
  ) {
    setBusyId(templateId)
    const path = forms[templateId]?.[field]
    if (path) await sb.storage.from('shop-images').remove([path])
    const res = await clearTemplateShowcaseImageAdmin(templateId, field)
    if ('error' in res) {
      setMsg(res.error)
      setBusyId(null)
      return
    }
    setForms((f) => ({
      ...f,
      [templateId]: { ...f[templateId]!, [field]: null },
    }))
    setMsg('Imagen quitada; se usa la predeterminada.')
    setBusyId(null)
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-400">
        Personalizá cada vitrina del carrusel de la página principal. Subí fotos reales de banner y
        productos; si no hay imagen custom, se usan las de la plantilla o los textos de ejemplo.
      </p>
      {msg && (
        <p
          className={`text-sm ${msg.toLowerCase().includes('error') ? 'text-red-400' : 'text-brand'}`}
          role="status"
        >
          {msg}
        </p>
      )}

      <div className="space-y-2">
        {STORE_TEMPLATES.map((tpl) => {
          const form = forms[tpl.id]!
          const isOpen = openId === tpl.id
          const busy = busyId === tpl.id
          const preview = formToPreview(tpl, form)

          return (
            <section key={tpl.id} className="rounded-xl border border-zinc-800 bg-zinc-900/50">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
                onClick={() => setOpenId(isOpen ? null : tpl.id)}
              >
                <span className="font-semibold text-white">{tpl.name}</span>
                <span className="text-xs text-zinc-500">{isOpen ? '▲' : '▼'}</span>
              </button>

              {isOpen && (
                <div className="space-y-4 border-t border-zinc-800 px-4 py-4">
                  <div className="flex justify-center">
                    <TemplateShowcasePreview template={tpl} showcase={preview} />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="space-y-1 text-sm">
                      <span className="text-zinc-400">Nombre de tienda</span>
                      <input
                        className="input w-full"
                        value={form.shop_name}
                        disabled={busy}
                        onChange={(e) =>
                          setForms((f) => ({
                            ...f,
                            [tpl.id]: { ...f[tpl.id]!, shop_name: e.target.value },
                          }))
                        }
                      />
                    </label>
                    <label className="space-y-1 text-sm">
                      <span className="text-zinc-400">Tagline</span>
                      <input
                        className="input w-full"
                        value={form.tagline}
                        disabled={busy}
                        onChange={(e) =>
                          setForms((f) => ({
                            ...f,
                            [tpl.id]: { ...f[tpl.id]!, tagline: e.target.value },
                          }))
                        }
                      />
                    </label>
                  </div>

                  <ImageSlot
                    label="Banner"
                    path={form.banner_path}
                    busy={busy}
                    onUpload={(f) => void uploadImage(tpl.id, 'banner', f)}
                    onClear={() => void clearImage(tpl.id, 'banner_path')}
                  />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <ProductSlot
                      title="Producto 1"
                      name={form.product_1_name}
                      price={form.product_1_price}
                      imagePath={form.product_1_image_path}
                      busy={busy}
                      onName={(v) =>
                        setForms((f) => ({ ...f, [tpl.id]: { ...f[tpl.id]!, product_1_name: v } }))
                      }
                      onPrice={(v) =>
                        setForms((f) => ({ ...f, [tpl.id]: { ...f[tpl.id]!, product_1_price: v } }))
                      }
                      onUpload={(f) => void uploadImage(tpl.id, 1, f)}
                      onClear={() => void clearImage(tpl.id, 'product_1_image_path')}
                    />
                    <ProductSlot
                      title="Producto 2"
                      name={form.product_2_name}
                      price={form.product_2_price}
                      imagePath={form.product_2_image_path}
                      busy={busy}
                      onName={(v) =>
                        setForms((f) => ({ ...f, [tpl.id]: { ...f[tpl.id]!, product_2_name: v } }))
                      }
                      onPrice={(v) =>
                        setForms((f) => ({ ...f, [tpl.id]: { ...f[tpl.id]!, product_2_price: v } }))
                      }
                      onUpload={(f) => void uploadImage(tpl.id, 2, f)}
                      onClear={() => void clearImage(tpl.id, 'product_2_image_path')}
                    />
                  </div>

                  <button
                    type="button"
                    disabled={Boolean(busyId)}
                    className="btn-primary w-full sm:w-auto"
                    onClick={() => void saveText(tpl.id)}
                  >
                    {busy ? 'Guardando…' : 'Guardar textos'}
                  </button>
                </div>
              )}
            </section>
          )
        })}
      </div>
    </div>
  )
}

function ImageSlot({
  label,
  path,
  busy,
  onUpload,
  onClear,
}: {
  label: string
  path: string | null
  busy: boolean
  onUpload: (file: File) => void
  onClear: () => void
}) {
  const url = path ? getPublicUrlFromPath(path) : null
  return (
    <div className="space-y-2 rounded-lg border border-zinc-800 p-3">
      <p className="text-sm font-medium text-zinc-200">{label}</p>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="h-24 w-full rounded-lg object-cover" />
      ) : (
        <div className="flex h-24 items-center justify-center rounded-lg bg-zinc-800 text-xs text-zinc-500">
          Sin imagen custom
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <label className="btn-primary cursor-pointer text-xs">
          Subir imagen
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={busy}
            onChange={(e) => {
              const f = e.target.files?.[0]
              e.target.value = ''
              if (f) onUpload(f)
            }}
          />
        </label>
        {path && (
          <button
            type="button"
            disabled={busy}
            className="rounded-lg border border-zinc-600 px-3 py-1.5 text-xs"
            onClick={onClear}
          >
            Quitar
          </button>
        )}
      </div>
    </div>
  )
}

function ProductSlot({
  title,
  name,
  price,
  imagePath,
  busy,
  onName,
  onPrice,
  onUpload,
  onClear,
}: {
  title: string
  name: string
  price: string
  imagePath: string | null
  busy: boolean
  onName: (v: string) => void
  onPrice: (v: string) => void
  onUpload: (file: File) => void
  onClear: () => void
}) {
  return (
    <div className="space-y-2 rounded-lg border border-zinc-800 p-3">
      <p className="text-sm font-medium text-zinc-200">{title}</p>
      <input className="input w-full text-sm" value={name} disabled={busy} onChange={(e) => onName(e.target.value)} />
      <input
        className="input w-full text-sm"
        inputMode="decimal"
        value={price}
        disabled={busy}
        onChange={(e) => onPrice(e.target.value)}
      />
      <ImageSlot label="Foto" path={imagePath} busy={busy} onUpload={onUpload} onClear={onClear} />
    </div>
  )
}
