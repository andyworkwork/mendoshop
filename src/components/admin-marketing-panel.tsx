'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import {
  createMarketingAssetAdmin,
  saveMarketingImageAdmin,
  deleteMarketingAssetAdmin,
  deleteMarketingPostAdmin,
  deleteMarketingTemplateAdmin,
  duplicateMarketingTemplateAdmin,
  previewMarketingCaptionAdmin,
  publishMarketingPostToMetaAdmin,
  saveMarketingCampaignAdmin,
  saveMarketingPostAdmin,
  saveMarketingTemplateAdmin,
  type MarketingAssetInput,
  type MarketingPostInput,
} from '@/app/actions/admin-marketing'
import { AdminMarketingMetaSection } from '@/components/admin-marketing-meta-section'
import { MarketingCarouselSlidePicker } from '@/components/marketing-carousel-slide-picker'
import { SettingsCollapsible } from '@/components/settings-collapsible'
import { compressImageForUpload } from '@/lib/image-compress'
import {
  applyMarketingTemplate,
  buildMarketingUrl,
  buildRegistroUrlFromMarketing,
  composeMarketingCaption,
  defaultMarketingVariables,
  MARKETING_PLATFORMS,
  MARKETING_POST_STATUSES,
  MARKETING_POST_TYPES,
  MARKETING_TEMPLATE_VARIABLES,
  marketingPlatformLabel,
  marketingPostStatusLabel,
  marketingPostTypeLabel,
  type MarketingAsset,
  type MarketingCampaign,
  type MarketingPost,
  type MarketingPostTemplate,
} from '@/lib/marketing'
import type { MarketingCarouselSlidePayload } from '@/lib/marketing-carousel-slides'
import { getPublicUrlFromPath } from '@/lib/publicUrl'
import type { MetaConnectionPublic } from '@/lib/meta-graph'

type ShopOption = {
  id: string
  name: string
  slug: string
  category_label: string | null
}

type Tab = 'assets' | 'templates' | 'posts' | 'campaigns' | 'calendar' | 'manual' | 'social'

const TABS: { id: Tab; label: string }[] = [
  { id: 'assets', label: 'Biblioteca' },
  { id: 'templates', label: 'Plantillas' },
  { id: 'posts', label: 'Publicaciones' },
  { id: 'social', label: 'Redes sociales' },
  { id: 'campaigns', label: 'Enlaces UTM' },
  { id: 'calendar', label: 'Calendario' },
  { id: 'manual', label: 'Manual' },
]

function assetPreviewUrl(asset: MarketingAsset): string | null {
  if (asset.storage_path) return getPublicUrlFromPath(asset.storage_path)
  return asset.external_url
}

function assetDownloadFilename(asset: MarketingAsset): string {
  const base = asset.title.replace(/[^\w.-]+/g, '-').replace(/-+/g, '-') || 'asset'
  if (asset.storage_path) {
    const ext = asset.storage_path.split('.').pop() ?? 'webp'
    return `${base}.${ext}`
  }
  return base
}

async function downloadMarketingAsset(asset: MarketingAsset): Promise<void> {
  const url = assetPreviewUrl(asset)
  if (!url) throw new Error('Este asset no tiene archivo descargable.')

  if (asset.asset_type === 'video' && asset.external_url && !asset.storage_path) {
    window.open(url, '_blank', 'noopener,noreferrer')
    return
  }

  const res = await fetch(url)
  if (!res.ok) throw new Error('No se pudo descargar el archivo.')
  const blob = await res.blob()
  const objectUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = objectUrl
  a.download = assetDownloadFilename(asset)
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(objectUrl)
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—'
  return new Date(value).toLocaleString('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

export function AdminMarketingPanel({
  initialAssets,
  initialTemplates,
  initialPosts,
  initialCampaigns,
  initialShops,
  initialCarouselSlides,
  metaConfigured,
  metaConnection,
  initialNotice,
}: {
  initialAssets: MarketingAsset[]
  initialTemplates: MarketingPostTemplate[]
  initialPosts: MarketingPost[]
  initialCampaigns: MarketingCampaign[]
  initialShops: ShopOption[]
  initialCarouselSlides: MarketingCarouselSlidePayload[]
  metaConfigured: boolean
  metaConnection: MetaConnectionPublic | null
  initialNotice?: string | null
}) {
  const [tab, setTab] = useState<Tab>('assets')
  const [pendingPostAssetIds, setPendingPostAssetIds] = useState<string[]>([])
  const [assets, setAssets] = useState(initialAssets)
  const [templates, setTemplates] = useState(initialTemplates)
  const [posts, setPosts] = useState(initialPosts)
  const [campaigns, setCampaigns] = useState(initialCampaigns)
  const [message, setMessage] = useState<string | null>(initialNotice ?? null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function flash(ok: string | null, err: string | null = null) {
    setMessage(ok)
    setError(err)
  }

  return (
    <div className="space-y-6 min-w-0 max-w-full overflow-x-hidden">
      <nav className="-mx-1 flex gap-1.5 overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/60 p-1.5 sm:mx-0 sm:flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`caps-nav-btn ${tab === t.id ? 'caps-nav-btn--active' : 'caps-nav-btn--ghost'}`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {message && <p className="text-sm text-emerald-300">{message}</p>}
      {error && (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}

      {tab === 'assets' && (
        <AssetsTab
          assets={assets}
          shops={initialShops}
          carouselSlides={initialCarouselSlides}
          onAssetsChange={setAssets}
          onFlash={flash}
          onUseInPost={(assetId) => {
            setPendingPostAssetIds([assetId])
            setTab('posts')
          }}
        />
      )}
      {tab === 'templates' && (
        <TemplatesTab
          templates={templates}
          assets={assets}
          pending={pending}
          onTemplatesChange={setTemplates}
          onFlash={flash}
          startTransition={startTransition}
        />
      )}
      {tab === 'posts' && (
        <PostsTab
          posts={posts}
          assets={assets}
          templates={templates}
          campaigns={campaigns}
          shops={initialShops}
          metaConfigured={metaConfigured}
          metaConnection={metaConnection}
          pending={pending}
          initialAssetIds={pendingPostAssetIds}
          onInitialAssetIdsConsumed={() => setPendingPostAssetIds([])}
          onPostsChange={setPosts}
          onFlash={flash}
          startTransition={startTransition}
        />
      )}
      {tab === 'social' && (
        <AdminMarketingMetaSection
          metaConfigured={metaConfigured}
          metaConnection={metaConnection}
          onFlash={flash}
        />
      )}
      {tab === 'campaigns' && (
        <CampaignsTab
          campaigns={campaigns}
          pending={pending}
          onCampaignsChange={setCampaigns}
          onFlash={flash}
          startTransition={startTransition}
        />
      )}
      {tab === 'calendar' && <CalendarTab posts={posts} />}
      {tab === 'manual' && (
        <ManualTab
          templates={templates}
          assets={assets}
          campaigns={campaigns}
          shops={initialShops}
          onFlash={flash}
        />
      )}
    </div>
  )
}

function AssetsTab({
  assets,
  shops,
  carouselSlides,
  onAssetsChange,
  onFlash,
  onUseInPost,
}: {
  assets: MarketingAsset[]
  shops: ShopOption[]
  carouselSlides: MarketingCarouselSlidePayload[]
  onAssetsChange: (assets: MarketingAsset[]) => void
  onFlash: (ok: string | null, err?: string | null) => void
  onUseInPost: (assetId: string) => void
}) {
  const savedSectionRef = useRef<HTMLElement>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [rubro, setRubro] = useState('')
  const [city, setCity] = useState('')
  const [shopId, setShopId] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [videoTitle, setVideoTitle] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [tags, setTags] = useState('')
  const [uploading, setUploading] = useState(false)
  const [pending, startTransition] = useTransition()
  const [previewAsset, setPreviewAsset] = useState<MarketingAsset | null>(null)

  function clearImageForm() {
    setTitle('')
    setDescription('')
    setRubro('')
    setCity('')
    setShopId('')
    setTags('')
    setImageFile(null)
  }

  async function handleSaveImage() {
    if (!title.trim()) {
      onFlash(null, 'Escribí un título para la imagen.')
      return
    }
    if (!imageFile) {
      onFlash(null, 'Elegí una imagen (JPG, PNG, etc.). No hace falta ninguna URL de video.')
      return
    }

    setUploading(true)
    onFlash(null, null)
    try {
      const webp = await compressImageForUpload(imageFile)
      const fd = new FormData()
      fd.append('title', title)
      fd.append('description', description)
      fd.append('rubro', rubro)
      fd.append('city', city)
      fd.append('shopId', shopId)
      fd.append('tags', tags)
      fd.append('file', webp, 'image.webp')

      startTransition(async () => {
        const res = await saveMarketingImageAdmin(fd)
        if ('error' in res) {
          onFlash(null, res.error)
          return
        }
        if (res.asset) onAssetsChange([res.asset as MarketingAsset, ...assets])
        clearImageForm()
        onFlash('Imagen guardada en biblioteca.')
        scrollToSaved()
      })
    } catch (e) {
      onFlash(null, e instanceof Error ? e.message : 'No se pudo subir la imagen.')
    } finally {
      setUploading(false)
    }
  }

  async function handleExternalVideo() {
    if (!videoTitle.trim() || !videoUrl.trim()) {
      onFlash(null, 'Para un video externo: título y URL del video (TikTok, Drive, etc.).')
      return
    }
    startTransition(async () => {
      const res = await createMarketingAssetAdmin({
        title: videoTitle,
        description: null,
        asset_type: 'video',
        external_url: videoUrl,
        rubro: null,
        city: null,
        shop_id: null,
        tags: [],
      })
      if ('error' in res) {
        onFlash(null, res.error)
        return
      }
      onAssetsChange([
        {
          id: res.id,
          title: videoTitle,
          description: null,
          asset_type: 'video',
          storage_path: null,
          external_url: videoUrl,
          rubro: null,
          city: null,
          shop_id: null,
          tags: [],
          created_at: new Date().toISOString(),
        },
        ...assets,
      ])
      setVideoTitle('')
      setVideoUrl('')
      onFlash('Enlace de video guardado (solo referencia; no sube el archivo).')
      scrollToSaved()
    })
  }

  function handleDelete(id: string) {
    if (!confirm('¿Eliminar este asset?')) return
    startTransition(async () => {
      const res = await deleteMarketingAssetAdmin(id)
      if ('error' in res) {
        onFlash(null, res.error)
        return
      }
      onAssetsChange(assets.filter((a) => a.id !== id))
      onFlash('Asset eliminado.')
    })
  }

  function scrollToSaved() {
    savedSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="space-y-8">
      {previewAsset && (
        <MarketingAssetPreviewModal asset={previewAsset} onClose={() => setPreviewAsset(null)} />
      )}
      <section className="card">
        <SettingsCollapsible
          title="Paso 1 · Vitrinas del carrusel de inicio"
          subtitle={`${carouselSlides.length} tienditas · Un clic en «Guardar vitrina en biblioteca» (no hace falta el formulario de la derecha)`}
          defaultOpen={false}
        >
          <MarketingCarouselSlidePicker
            slides={carouselSlides}
            assets={assets}
            onAssetAdded={(asset) => {
              onAssetsChange([asset, ...assets])
              scrollToSaved()
            }}
            onFlash={onFlash}
          />
        </SettingsCollapsible>
      </section>

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
      <section className="card space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Paso 2 · Subir una foto</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Solo para imágenes propias (capturas, flyers, etc.). No necesitás pegar ninguna URL de TikTok.
          </p>
        </div>
        <label className="block space-y-1 text-sm">
          <span className="text-zinc-400">Título (obligatorio para subir)</span>
          <input className="input w-full" value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-zinc-400">Descripción</span>
          <textarea className="input w-full min-h-20" value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1 text-sm">
            <span className="text-zinc-400">Rubro</span>
            <input className="input w-full" value={rubro} onChange={(e) => setRubro(e.target.value)} />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="text-zinc-400">Ciudad</span>
            <input className="input w-full" value={city} onChange={(e) => setCity(e.target.value)} />
          </label>
        </div>
        <label className="block space-y-1 text-sm">
          <span className="text-zinc-400">Tienda (opcional)</span>
          <select className="input w-full" value={shopId} onChange={(e) => setShopId(e.target.value)}>
            <option value="">Sin tienda vinculada</option>
            {shops.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.slug})
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-zinc-400">Tags (separados por coma)</span>
          <input className="input w-full" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="indumentaria, antes-despues" />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-zinc-400">Archivo de imagen</span>
          <input
            type="file"
            accept="image/*"
            disabled={uploading || pending}
            onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-zinc-300"
          />
          {imageFile && (
            <p className="text-xs text-zinc-500">
              Seleccionado: {imageFile.name} ({Math.round(imageFile.size / 1024)} KB)
            </p>
          )}
        </label>
        <button
          type="button"
          className="btn-primary w-full text-sm"
          disabled={uploading || pending || !imageFile}
          onClick={() => void handleSaveImage()}
        >
          {uploading ? 'Subiendo imagen…' : 'Guardar imagen en biblioteca'}
        </button>

        <SettingsCollapsible
          title="Opcional: enlace a video externo"
          subtitle="Solo si querés guardar la URL de un TikTok, Drive, etc. No hace falta para subir fotos."
          defaultOpen={false}
        >
          <div className="space-y-3">
            <label className="block space-y-1 text-sm">
              <span className="text-zinc-400">Título del video</span>
              <input
                className="input w-full"
                value={videoTitle}
                onChange={(e) => setVideoTitle(e.target.value)}
                placeholder="Ej. Reel promo verano"
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="text-zinc-400">URL del video</span>
              <input
                className="input w-full"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://..."
              />
            </label>
            <button
              type="button"
              className="btn-secondary-outline w-full text-sm"
              disabled={pending || !videoTitle.trim() || !videoUrl.trim()}
              onClick={() => void handleExternalVideo()}
            >
              Guardar enlace de video
            </button>
          </div>
        </SettingsCollapsible>
      </section>

      <section ref={savedSectionRef} className="space-y-4 scroll-mt-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Paso 3 · Lo que ya guardaste ({assets.length})</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Acá aparece todo lo que guardaste (vitrinas del carrusel o archivos subidos). Desde acá pasás a
            armar el post en <strong className="text-zinc-300">Publicaciones</strong>.
          </p>
        </div>
        {assets.length === 0 ? (
          <p className="text-sm text-zinc-500">
            Todavía no hay nada guardado. Usá «Guardar vitrina en biblioteca» arriba o subí una imagen en el
            paso 2.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {assets.map((asset) => {
              const preview = assetPreviewUrl(asset)
              return (
                <article key={asset.id} className="card space-y-3">
                  {preview && asset.asset_type === 'image' ? (
                    <button
                      type="button"
                      onClick={() => setPreviewAsset(asset)}
                      className="group relative block w-full overflow-hidden rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                      aria-label={`Ver imagen: ${asset.title}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={preview}
                        alt={asset.title}
                        className="aspect-video w-full object-cover transition group-hover:brightness-110"
                      />
                      <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/35">
                        <span className="rounded-lg bg-zinc-950/80 px-2 py-1 text-xs text-white opacity-0 transition group-hover:opacity-100">
                          Ver imagen
                        </span>
                      </span>
                    </button>
                  ) : (
                    <div className="flex aspect-video items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900/50 text-xs text-zinc-500">
                      {asset.asset_type === 'video' ? 'Video externo' : 'Sin preview'}
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-white">{asset.title}</p>
                    {asset.description && <p className="mt-1 text-xs text-zinc-400">{asset.description}</p>}
                    <p className="mt-2 text-xs text-zinc-500">
                      {[asset.rubro, asset.city].filter(Boolean).join(' · ') || 'Sin rubro/ciudad'}
                    </p>
                    {asset.tags.length > 0 && (
                      <p className="mt-1 text-xs text-zinc-600">Tags: {asset.tags.join(', ')}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {preview && asset.asset_type === 'image' && (
                      <button
                        type="button"
                        className="btn-secondary-outline flex-1 py-1.5 text-xs"
                        onClick={() => setPreviewAsset(asset)}
                      >
                        Ver imagen
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn-primary flex-1 py-1.5 text-xs"
                      onClick={() => onUseInPost(asset.id)}
                    >
                      Usar en Publicaciones →
                    </button>
                    <button type="button" className="text-xs text-red-400 hover:text-red-300" onClick={() => handleDelete(asset.id)}>
                      Eliminar
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
      </div>
    </div>
  )
}

function MarketingAssetPreviewModal({
  asset,
  onClose,
}: {
  asset: MarketingAsset
  onClose: () => void
}) {
  const url = assetPreviewUrl(asset)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!url || asset.asset_type !== 'image') return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/80"
        aria-label="Cerrar"
        onClick={onClose}
      />
      <div
        className="relative z-10 flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-950 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="marketing-asset-preview-title"
      >
        <div className="flex items-center justify-between gap-3 border-b border-zinc-800 px-4 py-3">
          <h2 id="marketing-asset-preview-title" className="truncate font-semibold text-white">
            {asset.title}
          </h2>
          <div className="flex shrink-0 items-center gap-2">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary-outline py-1.5 text-xs"
            >
              Abrir en pestaña
            </a>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              aria-label="Cerrar"
            >
              ✕
            </button>
          </div>
        </div>
        <div className="overflow-auto p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={asset.title} className="mx-auto max-h-[75vh] w-auto max-w-full rounded-lg object-contain" />
        </div>
      </div>
    </div>
  )
}

function TemplatesTab({
  templates,
  assets,
  pending,
  onTemplatesChange,
  onFlash,
  startTransition,
}: {
  templates: MarketingPostTemplate[]
  assets: MarketingAsset[]
  pending: boolean
  onTemplatesChange: (templates: MarketingPostTemplate[]) => void
  onFlash: (ok: string | null, err?: string | null) => void
  startTransition: (fn: () => void) => void
}) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [body, setBody] = useState('')
  const [hashtags, setHashtags] = useState('')
  const [platforms, setPlatforms] = useState<string[]>(['instagram'])
  const [assetIds, setAssetIds] = useState<string[]>([])

  function resetForm() {
    setEditingId(null)
    setName('')
    setDescription('')
    setBody('')
    setHashtags('')
    setPlatforms(['instagram'])
    setAssetIds([])
  }

  function loadTemplate(t: MarketingPostTemplate) {
    setEditingId(t.id)
    setName(t.name)
    setDescription(t.description ?? '')
    setBody(t.body)
    setHashtags(t.hashtags ?? '')
    setPlatforms(t.suggested_platforms.length ? t.suggested_platforms : ['instagram'])
    setAssetIds(t.asset_ids ?? [])
  }

  function toggleTemplateAsset(id: string) {
    setAssetIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  function togglePlatform(p: string) {
    setPlatforms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]))
  }

  function handleSave() {
    startTransition(async () => {
      const res = await saveMarketingTemplateAdmin({
        id: editingId ?? undefined,
        name,
        description,
        body,
        hashtags,
        suggested_platforms: platforms,
        asset_ids: assetIds,
      })
      if ('error' in res) {
        onFlash(null, res.error)
        return
      }
      const row: MarketingPostTemplate = {
        id: res.id ?? editingId ?? crypto.randomUUID(),
        name,
        description: description || null,
        body,
        suggested_platforms: platforms,
        hashtags: hashtags || null,
        is_default: false,
        asset_ids: assetIds,
      }
      if (editingId) {
        onTemplatesChange(templates.map((t) => (t.id === editingId ? { ...t, ...row } : t)))
      } else {
        onTemplatesChange([row, ...templates])
      }
      resetForm()
      onFlash('Plantilla guardada.')
    })
  }

  function handleDelete(id: string) {
    if (!confirm('¿Eliminar plantilla?')) return
    startTransition(async () => {
      const res = await deleteMarketingTemplateAdmin(id)
      if ('error' in res) {
        onFlash(null, res.error)
        return
      }
      onTemplatesChange(templates.filter((t) => t.id !== id))
      if (editingId === id) resetForm()
      onFlash('Plantilla eliminada.')
    })
  }

  function handleDuplicate(t: MarketingPostTemplate) {
    startTransition(async () => {
      const res = await duplicateMarketingTemplateAdmin(t.id)
      if ('error' in res) {
        onFlash(null, res.error)
        return
      }
      const copy = res.template as MarketingPostTemplate
      onTemplatesChange([copy, ...templates])
      loadTemplate(copy)
      onFlash('Plantilla duplicada. Cambiá nombre, imágenes o texto y guardá.')
    })
  }

  const preview = applyMarketingTemplate(body, defaultMarketingVariables())

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <section className="card space-y-4">
        <h2 className="text-lg font-semibold text-white">{editingId ? 'Editar plantilla' : 'Nueva plantilla'}</h2>
        <p className="text-xs text-zinc-500">
          Variables: {MARKETING_TEMPLATE_VARIABLES.map((v) => `{${v}}`).join(', ')}
        </p>
        <label className="block space-y-1 text-sm">
          <span className="text-zinc-400">Nombre</span>
          <input className="input w-full" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-zinc-400">Descripción</span>
          <input className="input w-full" value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-zinc-400">Texto</span>
          <textarea className="input w-full min-h-40 font-mono text-xs" value={body} onChange={(e) => setBody(e.target.value)} />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-zinc-400">Hashtags</span>
          <input className="input w-full" value={hashtags} onChange={(e) => setHashtags(e.target.value)} />
        </label>
        <div className="flex flex-wrap gap-2">
          {MARKETING_PLATFORMS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => togglePlatform(p)}
              className={`rounded-lg border px-3 py-1 text-xs ${platforms.includes(p) ? 'border-brand text-brand' : 'border-zinc-700 text-zinc-400'}`}
            >
              {marketingPlatformLabel(p)}
            </button>
          ))}
        </div>
        <div>
          <p className="mb-1 text-sm text-zinc-400">Imágenes y videos de la biblioteca</p>
          <p className="mb-2 text-xs text-zinc-500">
            Elegí qué assets van con esta plantilla (para descargar en la pestaña Manual).
          </p>
          {assets.length === 0 ? (
            <p className="text-xs text-zinc-500">No hay assets. Guardá fotos en Biblioteca primero.</p>
          ) : (
            <div className="max-h-44 space-y-2 overflow-y-auto rounded-lg border border-zinc-800 p-2">
              {assets.map((a) => {
                const preview = assetPreviewUrl(a)
                const checked = assetIds.includes(a.id)
                return (
                  <label
                    key={a.id}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border p-2 text-xs ${
                      checked ? 'border-brand/50 bg-brand/10' : 'border-transparent hover:bg-zinc-800/50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleTemplateAsset(a.id)}
                    />
                    {preview && a.asset_type === 'image' ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={preview} alt="" className="h-10 w-10 shrink-0 rounded object-cover" />
                    ) : (
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-zinc-800 text-[10px] text-zinc-500">
                        {a.asset_type === 'video' ? 'Video' : '?'}
                      </span>
                    )}
                    <span className="min-w-0 truncate text-zinc-300">{a.title}</span>
                  </label>
                )
              })}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button type="button" className="btn-primary flex-1 text-sm" disabled={pending} onClick={handleSave}>
            Guardar
          </button>
          {editingId && (
            <button type="button" className="btn-secondary-outline text-sm" onClick={resetForm}>
              Cancelar
            </button>
          )}
        </div>
      </section>

      <div className="space-y-4">
        <section className="card space-y-2">
          <h3 className="font-semibold text-white">Vista previa</h3>
          <pre className="whitespace-pre-wrap text-sm text-zinc-300">{preview || 'Escribí el texto de la plantilla…'}</pre>
          {hashtags && <p className="text-xs text-zinc-500">{hashtags}</p>}
        </section>

        <section className="space-y-3">
          <h3 className="font-semibold text-white">Plantillas ({templates.length})</h3>
          {templates.map((t) => (
            <article key={t.id} className="card flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium text-white">
                  {t.name}
                  {t.is_default && <span className="ml-2 text-xs text-brand">default</span>}
                </p>
                {t.description && <p className="text-xs text-zinc-500">{t.description}</p>}
                <p className="mt-1 text-xs text-zinc-600">
                  {(t.asset_ids ?? []).length} archivo{(t.asset_ids ?? []).length === 1 ? '' : 's'} en biblioteca
                </p>
                <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-xs text-zinc-400">{t.body}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="text-xs text-brand" onClick={() => loadTemplate(t)}>
                  Editar
                </button>
                <button
                  type="button"
                  className="text-xs text-zinc-300 hover:text-white"
                  disabled={pending}
                  onClick={() => handleDuplicate(t)}
                >
                  Duplicar
                </button>
                {!t.is_default && (
                  <button type="button" className="text-xs text-red-400" onClick={() => handleDelete(t.id)}>
                    Eliminar
                  </button>
                )}
              </div>
            </article>
          ))}
        </section>
      </div>
    </div>
  )
}

function PostsTab({
  posts,
  assets,
  templates,
  campaigns,
  shops,
  metaConfigured,
  metaConnection,
  pending,
  initialAssetIds,
  onInitialAssetIdsConsumed,
  onPostsChange,
  onFlash,
  startTransition,
}: {
  posts: MarketingPost[]
  assets: MarketingAsset[]
  templates: MarketingPostTemplate[]
  campaigns: MarketingCampaign[]
  shops: ShopOption[]
  metaConfigured: boolean
  metaConnection: MetaConnectionPublic | null
  pending: boolean
  initialAssetIds: string[]
  onInitialAssetIdsConsumed: () => void
  onPostsChange: (posts: MarketingPost[]) => void
  onFlash: (ok: string | null, err?: string | null) => void
  startTransition: (fn: () => void) => void
}) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [postType, setPostType] = useState<(typeof MARKETING_POST_TYPES)[number]>('photo')
  const [platforms, setPlatforms] = useState<string[]>(['instagram'])
  const [status, setStatus] = useState<(typeof MARKETING_POST_STATUSES)[number]>('draft')
  const [caption, setCaption] = useState('')
  const [templateId, setTemplateId] = useState('')
  const [assetIds, setAssetIds] = useState<string[]>([])
  const [scheduledAt, setScheduledAt] = useState('')
  const [utmSource, setUtmSource] = useState('instagram')
  const [utmCampaign, setUtmCampaign] = useState('7dias_gratis')
  const [notes, setNotes] = useState('')
  const [rubro, setRubro] = useState('')
  const [city, setCity] = useState('')
  const [shopId, setShopId] = useState('')

  useEffect(() => {
    if (initialAssetIds.length === 0) return
    setAssetIds(initialAssetIds)
    onInitialAssetIdsConsumed()
    onFlash('Imagen de biblioteca seleccionada. Completá el post y tocá Guardar.')
    // Solo reaccionar cuando llega una selección desde Biblioteca
    // eslint-disable-next-line react-hooks/exhaustive-deps -- consumir una vez por lote de ids
  }, [initialAssetIds.join('|')])

  const selectedShop = shops.find((s) => s.id === shopId)
  const selectedCampaign = campaigns.find((c) => c.utm_campaign === utmCampaign) ?? campaigns[0]

  const trackingLink = buildMarketingUrl({
    path: selectedCampaign?.landing_path ?? '/promo',
    utm_source: utmSource,
    utm_medium: 'social',
    utm_campaign: utmCampaign,
  })

  const fullCaption = composeMarketingCaption(
    caption,
    templates.find((t) => t.id === templateId)?.hashtags,
  )

  function resetForm() {
    setEditingId(null)
    setTitle('')
    setPostType('photo')
    setPlatforms(['instagram'])
    setStatus('draft')
    setCaption('')
    setTemplateId('')
    setAssetIds([])
    setScheduledAt('')
    setUtmSource('instagram')
    setUtmCampaign(campaigns[0]?.utm_campaign ?? '7dias_gratis')
    setNotes('')
    setRubro('')
    setCity('')
    setShopId('')
  }

  function loadPost(p: MarketingPost) {
    setEditingId(p.id)
    setTitle(p.title)
    setPostType(p.post_type)
    setPlatforms(p.platforms.length ? p.platforms : ['instagram'])
    setStatus(p.status)
    setCaption(p.caption)
    setTemplateId(p.template_id ?? '')
    setAssetIds(p.asset_ids ?? [])
    setScheduledAt(p.scheduled_at ? p.scheduled_at.slice(0, 16) : '')
    setUtmSource(p.utm_source ?? 'instagram')
    setUtmCampaign(p.utm_campaign ?? '7dias_gratis')
    setNotes(p.notes ?? '')
  }

  function togglePlatform(p: string) {
    setPlatforms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]))
  }

  function toggleAsset(id: string) {
    setAssetIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  async function generateFromTemplate() {
    if (!templateId) {
      onFlash(null, 'Elegí una plantilla.')
      return
    }
    const shop = selectedShop
    const res = await previewMarketingCaptionAdmin({
      templateId,
      rubro: rubro || shop?.category_label,
      city: city || undefined,
      shopName: shop?.name,
      offerText: selectedCampaign?.offer_text,
      utm_source: utmSource,
      utm_medium: 'social',
      utm_campaign: utmCampaign,
      link_path: selectedCampaign?.landing_path ?? '/promo',
    })
    if ('error' in res) {
      onFlash(null, res.error)
      return
    }
    setCaption(res.caption)
    onFlash('Caption generado desde plantilla.')
  }

  function handleSave() {
    startTransition(async () => {
      const input: MarketingPostInput & { id?: string } = {
        id: editingId ?? undefined,
        title,
        post_type: postType,
        platforms: platforms as MarketingPostInput['platforms'],
        status,
        caption,
        template_id: templateId || null,
        asset_ids: assetIds,
        scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
        published_at: status === 'published' ? new Date().toISOString() : null,
        utm_source: utmSource,
        utm_medium: 'social',
        utm_campaign: utmCampaign,
        link_path: selectedCampaign?.landing_path ?? '/promo',
        notes,
      }

      const res = await saveMarketingPostAdmin(input)
      if ('error' in res) {
        onFlash(null, res.error)
        return
      }

      const row: MarketingPost = {
        id: res.id ?? editingId ?? crypto.randomUUID(),
        title,
        post_type: postType,
        platforms,
        status,
        caption,
        template_id: templateId || null,
        asset_ids: assetIds,
        scheduled_at: input.scheduled_at ?? null,
        published_at: input.published_at ?? null,
        utm_source: utmSource,
        utm_medium: 'social',
        utm_campaign: utmCampaign,
        link_path: selectedCampaign?.landing_path ?? '/promo',
        notes: notes || null,
        created_at: new Date().toISOString(),
      }

      if (editingId) {
        onPostsChange(posts.map((p) => (p.id === editingId ? { ...p, ...row } : p)))
      } else {
        onPostsChange([row, ...posts])
      }
      resetForm()
      onFlash('Publicación guardada.')
    })
  }

  function handleDelete(id: string) {
    if (!confirm('¿Eliminar publicación?')) return
    startTransition(async () => {
      const res = await deleteMarketingPostAdmin(id)
      if ('error' in res) {
        onFlash(null, res.error)
        return
      }
      onPostsChange(posts.filter((p) => p.id !== id))
      if (editingId === id) resetForm()
      onFlash('Publicación eliminada.')
    })
  }

  async function copyCaption() {
    await navigator.clipboard.writeText(fullCaption)
    onFlash('Caption copiado al portapapeles.')
  }

  function handlePublishNow(postId: string) {
    if (!metaConnection) {
      onFlash(null, 'Conectá Facebook e Instagram en la pestaña Redes sociales.')
      return
    }
    startTransition(async () => {
      const res = await publishMarketingPostToMetaAdmin(postId)
      if ('error' in res) {
        onFlash(null, res.error)
        return
      }
      onPostsChange(
        posts.map((p) =>
          p.id === postId
            ? {
                ...p,
                status: 'published',
                published_at: new Date().toISOString(),
                last_published_at: new Date().toISOString(),
                meta_facebook_post_id: res.facebookPostId ?? p.meta_facebook_post_id,
                meta_instagram_post_id: res.instagramPostId ?? p.meta_instagram_post_id,
                last_publish_error: res.warnings.length ? res.warnings.join(' ') : null,
              }
            : p,
        ),
      )
      onFlash(
        res.warnings.length
          ? `Publicado con avisos: ${res.warnings.join(' ')}`
          : 'Publicado en Meta.',
      )
    })
  }

  const canAutoPublish = metaConfigured && Boolean(metaConnection)

  return (
    <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
      <section className="card space-y-4">
        <h2 className="text-lg font-semibold text-white">{editingId ? 'Editar publicación' : 'Nueva publicación'}</h2>

        <label className="block space-y-1 text-sm">
          <span className="text-zinc-400">Título interno</span>
          <input className="input w-full" value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1 text-sm">
            <span className="text-zinc-400">Tipo</span>
            <select className="input w-full" value={postType} onChange={(e) => setPostType(e.target.value as typeof postType)}>
              {MARKETING_POST_TYPES.map((t) => (
                <option key={t} value={t}>
                  {marketingPostTypeLabel(t)}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1 text-sm">
            <span className="text-zinc-400">Estado</span>
            <select className="input w-full" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
              {MARKETING_POST_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {marketingPostStatusLabel(s)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div>
          <p className="mb-2 text-sm text-zinc-400">Redes</p>
          <div className="flex flex-wrap gap-2">
            {MARKETING_PLATFORMS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => togglePlatform(p)}
                className={`rounded-lg border px-3 py-1 text-xs ${platforms.includes(p) ? 'border-brand text-brand' : 'border-zinc-700 text-zinc-400'}`}
              >
                {marketingPlatformLabel(p)}
              </button>
            ))}
          </div>
        </div>

        <label className="block space-y-1 text-sm">
          <span className="text-zinc-400">Programar (opcional)</span>
          <input type="datetime-local" className="input w-full" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1 text-sm">
            <span className="text-zinc-400">UTM source</span>
            <select className="input w-full" value={utmSource} onChange={(e) => setUtmSource(e.target.value)}>
              {MARKETING_PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1 text-sm">
            <span className="text-zinc-400">Campaña</span>
            <select className="input w-full" value={utmCampaign} onChange={(e) => setUtmCampaign(e.target.value)}>
              {campaigns.map((c) => (
                <option key={c.id} value={c.utm_campaign}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1 text-sm">
            <span className="text-zinc-400">Rubro (plantilla)</span>
            <input className="input w-full" value={rubro} onChange={(e) => setRubro(e.target.value)} />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="text-zinc-400">Ciudad (plantilla)</span>
            <input className="input w-full" value={city} onChange={(e) => setCity(e.target.value)} />
          </label>
        </div>

        <label className="block space-y-1 text-sm">
          <span className="text-zinc-400">Tienda de referencia</span>
          <select
            className="input w-full"
            value={shopId}
            onChange={(e) => {
              setShopId(e.target.value)
              const shop = shops.find((s) => s.id === e.target.value)
              if (shop?.category_label) setRubro(shop.category_label)
            }}
          >
            <option value="">Ninguna</option>
            {shops.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1 text-sm">
          <span className="text-zinc-400">Plantilla</span>
          <select className="input w-full" value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
            <option value="">Sin plantilla</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="btn-secondary-outline w-full text-sm" onClick={() => void generateFromTemplate()}>
          Generar caption desde plantilla
        </button>

        <label className="block space-y-1 text-sm">
          <span className="text-zinc-400">Caption</span>
          <textarea className="input w-full min-h-40" value={caption} onChange={(e) => setCaption(e.target.value)} />
        </label>

        <label className="block space-y-1 text-sm">
          <span className="text-zinc-400">Notas internas</span>
          <textarea className="input w-full min-h-16" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>

        <div>
          <p className="mb-1 text-sm font-medium text-zinc-300">Imágenes de la biblioteca</p>
          <p className="mb-2 text-xs text-zinc-500">
            Marcá qué foto va en este post ({assetIds.length} seleccionada{assetIds.length === 1 ? '' : 's'}).
            Si no hay nada, primero guardá en la pestaña Biblioteca.
          </p>
          {assets.length === 0 ? (
            <p className="rounded-lg border border-dashed border-zinc-700 px-3 py-4 text-xs text-zinc-500">
              No hay assets guardados. Andá a <strong className="text-zinc-400">Biblioteca</strong>, guardá una
              vitrina o subí una imagen, y volvé acá.
            </p>
          ) : (
            <div className="max-h-52 space-y-2 overflow-y-auto rounded-lg border border-zinc-800 p-2">
              {assets.map((a) => {
                const preview = assetPreviewUrl(a)
                const checked = assetIds.includes(a.id)
                return (
                  <label
                    key={a.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-2 text-xs ${
                      checked ? 'border-brand/50 bg-brand/10' : 'border-transparent hover:bg-zinc-800/50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="shrink-0"
                      checked={checked}
                      onChange={() => toggleAsset(a.id)}
                    />
                    {preview && a.asset_type === 'image' ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={preview} alt="" className="h-12 w-12 shrink-0 rounded object-cover" />
                    ) : (
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded bg-zinc-800 text-[10px] text-zinc-500">
                        {a.asset_type === 'video' ? 'Video' : '?'}
                      </span>
                    )}
                    <span className="min-w-0 text-zinc-300">
                      <span className="block font-medium text-zinc-100">{a.title}</span>
                      {a.rubro && <span className="text-zinc-500">{a.rubro}</span>}
                    </span>
                  </label>
                )
              })}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button type="button" className="btn-primary flex-1 text-sm" disabled={pending} onClick={handleSave}>
            Guardar
          </button>
          {editingId && (
            <button type="button" className="btn-secondary-outline text-sm" onClick={resetForm}>
              Cancelar
            </button>
          )}
        </div>
      </section>

      <div className="space-y-4">
        <section className="card space-y-3">
          <h3 className="font-semibold text-white">Listo para publicar</h3>
          <p className="text-xs text-zinc-500">Link con tracking:</p>
          <a href={trackingLink} target="_blank" rel="noopener noreferrer" className="break-all text-sm text-brand hover:underline">
            {trackingLink}
          </a>
          <pre className="whitespace-pre-wrap rounded-lg border border-zinc-800 bg-zinc-950/50 p-3 text-sm text-zinc-200">
            {fullCaption || 'Generá o escribí el caption…'}
          </pre>
          <button type="button" className="btn-secondary-outline text-sm" onClick={() => void copyCaption()}>
            Copiar caption
          </button>
          {editingId && canAutoPublish && (platforms.includes('facebook') || platforms.includes('instagram')) && (
            <button
              type="button"
              className="btn-primary text-sm"
              disabled={pending}
              onClick={() => handlePublishNow(editingId)}
            >
              Publicar ahora en Meta
            </button>
          )}
          <p className="text-xs text-zinc-500">
            {canAutoPublish
              ? 'Facebook e Instagram se publican desde acá. TikTok sigue siendo manual (copiar caption).'
              : 'Conectá Meta en Redes sociales para publicar automáticamente, o copiá el caption y publicá a mano.'}
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="font-semibold text-white">Publicaciones ({posts.length})</h3>
          {posts.map((p) => (
            <article key={p.id} className="card space-y-2">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-white">{p.title}</p>
                  <p className="text-xs text-zinc-500">
                    {marketingPostStatusLabel(p.status)} · {p.platforms.map(marketingPlatformLabel).join(', ')}
                    {p.scheduled_at ? ` · ${formatDateTime(p.scheduled_at)}` : ''}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {canAutoPublish && (p.platforms.includes('facebook') || p.platforms.includes('instagram')) && p.status !== 'published' && (
                    <button type="button" className="text-xs text-emerald-400" onClick={() => handlePublishNow(p.id)}>
                      Publicar Meta
                    </button>
                  )}
                  <button type="button" className="text-xs text-brand" onClick={() => loadPost(p)}>
                    Editar
                  </button>
                  <button type="button" className="text-xs text-red-400" onClick={() => handleDelete(p.id)}>
                    Eliminar
                  </button>
                </div>
              </div>
              <p className="line-clamp-4 whitespace-pre-wrap text-xs text-zinc-400">{p.caption}</p>
              {p.last_publish_error && <p className="text-xs text-amber-400">{p.last_publish_error}</p>}
            </article>
          ))}
        </section>
      </div>
    </div>
  )
}

function CampaignsTab({
  campaigns,
  pending,
  onCampaignsChange,
  onFlash,
  startTransition,
}: {
  campaigns: MarketingCampaign[]
  pending: boolean
  onCampaignsChange: (campaigns: MarketingCampaign[]) => void
  onFlash: (ok: string | null, err?: string | null) => void
  startTransition: (fn: () => void) => void
}) {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [offerText, setOfferText] = useState('7 días gratis')
  const [utmCampaign, setUtmCampaign] = useState('')

  function handleSave() {
    startTransition(async () => {
      const res = await saveMarketingCampaignAdmin({
        name,
        slug,
        offer_text: offerText,
        utm_campaign: utmCampaign,
      })
      if ('error' in res) {
        onFlash(null, res.error)
        return
      }
      onCampaignsChange([
        {
          id: res.id ?? crypto.randomUUID(),
          name,
          slug,
          offer_text: offerText,
          landing_path: '/promo',
          utm_campaign: utmCampaign,
          active: true,
        },
        ...campaigns,
      ])
      setName('')
      setSlug('')
      setOfferText('7 días gratis')
      setUtmCampaign('')
      onFlash('Campaña creada.')
    })
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <section className="card space-y-4">
        <h2 className="text-lg font-semibold text-white">Nueva campaña UTM</h2>
        <label className="block space-y-1 text-sm">
          <span className="text-zinc-400">Nombre</span>
          <input className="input w-full" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-zinc-400">Slug</span>
          <input className="input w-full" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="7dias-gratis" />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-zinc-400">Texto de oferta</span>
          <input className="input w-full" value={offerText} onChange={(e) => setOfferText(e.target.value)} />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-zinc-400">utm_campaign</span>
          <input className="input w-full" value={utmCampaign} onChange={(e) => setUtmCampaign(e.target.value)} placeholder="7dias_gratis" />
        </label>
        <button type="button" className="btn-primary w-full text-sm" disabled={pending} onClick={handleSave}>
          Crear campaña
        </button>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Enlaces por red</h2>
        {campaigns.map((c) => (
          <article key={c.id} className="card space-y-3">
            <div>
              <p className="font-medium text-white">{c.name}</p>
              <p className="text-xs text-zinc-500">{c.offer_text}</p>
            </div>
            <div className="space-y-2">
              {MARKETING_PLATFORMS.map((platform) => {
                const url = buildMarketingUrl({
                  path: c.landing_path,
                  utm_source: platform,
                  utm_medium: 'social',
                  utm_campaign: c.utm_campaign,
                })
                const registroUrl = buildRegistroUrlFromMarketing({
                  utm_source: platform,
                  utm_medium: 'social',
                  utm_campaign: c.utm_campaign,
                })
                return (
                  <div key={platform} className="rounded-lg border border-zinc-800 p-3 text-xs">
                    <p className="font-medium text-zinc-300">{marketingPlatformLabel(platform)}</p>
                    <p className="mt-1 text-zinc-500">Landing:</p>
                    <a href={url} className="break-all text-brand hover:underline" target="_blank" rel="noopener noreferrer">
                      {url}
                    </a>
                    <p className="mt-2 text-zinc-500">Registro directo:</p>
                    <a href={registroUrl} className="break-all text-brand hover:underline" target="_blank" rel="noopener noreferrer">
                      {registroUrl}
                    </a>
                  </div>
                )
              })}
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}

function ManualTab({
  templates,
  assets,
  campaigns,
  shops,
  onFlash,
}: {
  templates: MarketingPostTemplate[]
  assets: MarketingAsset[]
  campaigns: MarketingCampaign[]
  shops: ShopOption[]
  onFlash: (ok: string | null, err?: string | null) => void
}) {
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? '')
  const [rubro, setRubro] = useState('')
  const [city, setCity] = useState('')
  const [shopId, setShopId] = useState('')
  const [utmCampaign, setUtmCampaign] = useState(campaigns[0]?.utm_campaign ?? '7dias_gratis')
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const template = templates.find((t) => t.id === templateId)
  const selectedCampaign = campaigns.find((c) => c.utm_campaign === utmCampaign) ?? campaigns[0]
  const selectedShop = shops.find((s) => s.id === shopId)

  const trackingLink = buildMarketingUrl({
    path: selectedCampaign?.landing_path ?? '/promo',
    utm_source: 'manual',
    utm_medium: 'social',
    utm_campaign: utmCampaign,
  })

  const captionBody = applyMarketingTemplate(
    template?.body ?? '',
    defaultMarketingVariables({
      rubro: rubro || selectedShop?.category_label,
      city: city || undefined,
      shopName: selectedShop?.name,
      offerText: selectedCampaign?.offer_text,
      link: trackingLink,
    }),
  )
  const fullCaption = composeMarketingCaption(captionBody, template?.hashtags)

  const templateAssets = (template?.asset_ids ?? [])
    .map((id) => assets.find((a) => a.id === id))
    .filter((a): a is MarketingAsset => Boolean(a))

  async function copyCaption() {
    if (!fullCaption.trim()) {
      onFlash(null, 'Elegí una plantilla con texto.')
      return
    }
    try {
      await navigator.clipboard.writeText(fullCaption)
      onFlash('Texto copiado al portapapeles.')
    } catch {
      onFlash(null, 'No se pudo copiar. Seleccioná el texto y copiá manualmente.')
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(trackingLink)
      onFlash('Link copiado al portapapeles.')
    } catch {
      onFlash(null, 'No se pudo copiar el link.')
    }
  }

  async function handleDownload(asset: MarketingAsset) {
    setDownloadingId(asset.id)
    onFlash(null, null)
    try {
      await downloadMarketingAsset(asset)
      onFlash(
        asset.asset_type === 'video' && !asset.storage_path
          ? 'Se abrió el enlace del video en una pestaña nueva.'
          : `Descargado: ${asset.title}`,
      )
    } catch (e) {
      onFlash(null, e instanceof Error ? e.message : 'No se pudo descargar.')
    } finally {
      setDownloadingId(null)
    }
  }

  if (templates.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        No hay plantillas. Creá una en la pestaña Plantillas (texto + imágenes de Biblioteca).
      </p>
    )
  }

  return (
    <div className="min-w-0 max-w-full overflow-x-hidden">
      <div className="grid min-w-0 gap-4 sm:gap-6 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
      <section className="card min-w-0 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Publicación manual</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Elegí plantilla, copiá el texto y descargá las imágenes para subir vos en Instagram, Facebook o
            TikTok.
          </p>
        </div>
        <label className="block space-y-1 text-sm">
          <span className="text-zinc-400">Plantilla</span>
          <select className="input w-full" value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
        {template?.description && <p className="text-xs text-zinc-500">{template.description}</p>}
        <label className="block space-y-1 text-sm">
          <span className="text-zinc-400">Campaña (link y beneficio)</span>
          <select className="input w-full" value={utmCampaign} onChange={(e) => setUtmCampaign(e.target.value)}>
            {campaigns.map((c) => (
              <option key={c.id} value={c.utm_campaign}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-zinc-400">Rubro (opcional)</span>
          <input className="input w-full" value={rubro} onChange={(e) => setRubro(e.target.value)} />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-zinc-400">Ciudad (opcional)</span>
          <input className="input w-full" value={city} onChange={(e) => setCity(e.target.value)} />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-zinc-400">Tienda de referencia (opcional)</span>
          <select
            className="input w-full"
            value={shopId}
            onChange={(e) => {
              setShopId(e.target.value)
              const shop = shops.find((s) => s.id === e.target.value)
              if (shop?.category_label) setRubro(shop.category_label)
            }}
          >
            <option value="">Ninguna</option>
            {shops.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        {template && template.suggested_platforms.length > 0 && (
          <p className="text-xs text-zinc-500">
            Sugerido: {template.suggested_platforms.map(marketingPlatformLabel).join(', ')}
          </p>
        )}
      </section>

      <div className="min-w-0 space-y-4 sm:space-y-6">
        <section className="card min-w-0 space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="font-semibold text-white">Texto del post</h3>
            <button
              type="button"
              className="btn-primary w-full text-sm sm:w-auto sm:shrink-0"
              onClick={() => void copyCaption()}
            >
              Copiar texto
            </button>
          </div>
          <pre className="max-w-full overflow-x-auto whitespace-pre-wrap break-words rounded-lg border border-zinc-800 bg-zinc-950/50 p-3 text-xs text-zinc-200 sm:text-sm">
            {fullCaption || 'Sin texto en la plantilla.'}
          </pre>
          <div className="flex flex-col gap-2 border-t border-zinc-800 pt-3 sm:flex-row sm:items-start sm:gap-3">
            <p className="min-w-0 flex-1 break-all text-xs text-zinc-500">{trackingLink}</p>
            <button
              type="button"
              className="btn-secondary-outline w-full shrink-0 text-xs sm:w-auto"
              onClick={() => void copyLink()}
            >
              Copiar link
            </button>
          </div>
        </section>

        <section className="card min-w-0 space-y-3">
          <h3 className="font-semibold text-white">
            Archivos de la plantilla ({templateAssets.length})
          </h3>
          {templateAssets.length === 0 ? (
            <p className="text-sm text-zinc-500">
              Esta plantilla no tiene imágenes. Editá la plantilla en la pestaña Plantillas y marcá assets de
              Biblioteca.
            </p>
          ) : (
            <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
              {templateAssets.map((asset) => {
                const preview = assetPreviewUrl(asset)
                const busy = downloadingId === asset.id
                return (
                  <article key={asset.id} className="min-w-0 space-y-2 rounded-xl border border-zinc-800 p-3">
                    {preview && asset.asset_type === 'image' ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={preview}
                        alt={asset.title}
                        className="aspect-video w-full max-w-full rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex aspect-video w-full max-w-full items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900/50 text-xs text-zinc-500">
                        {asset.asset_type === 'video' ? 'Video (enlace externo)' : 'Sin preview'}
                      </div>
                    )}
                    <p className="break-words text-sm font-medium text-white">{asset.title}</p>
                    <button
                      type="button"
                      className="btn-secondary-outline w-full text-sm"
                      disabled={busy}
                      onClick={() => void handleDownload(asset)}
                    >
                      {busy
                        ? 'Descargando…'
                        : asset.asset_type === 'video' && !asset.storage_path
                          ? 'Abrir enlace del video'
                          : 'Descargar imagen'}
                    </button>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </div>
      </div>
    </div>
  )
}

function CalendarTab({ posts }: { posts: MarketingPost[] }) {
  const scheduled = useMemo(
    () =>
      [...posts]
        .filter((p) => p.scheduled_at || p.status === 'scheduled')
        .sort((a, b) => (a.scheduled_at ?? '').localeCompare(b.scheduled_at ?? '')),
    [posts],
  )

  const grouped = useMemo(() => {
    const map = new Map<string, MarketingPost[]>()
    for (const p of scheduled) {
      const day = p.scheduled_at ? p.scheduled_at.slice(0, 10) : 'sin-fecha'
      const list = map.get(day) ?? []
      list.push(p)
      map.set(day, list)
    }
    return [...map.entries()]
  }, [scheduled])

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-white">Calendario editorial</h2>
      <p className="text-sm text-zinc-400">
        Publicaciones programadas con estado &quot;Programado&quot; se publican solas en Facebook/Instagram cada 5 minutos
        (si Meta está conectado).
      </p>
      {grouped.length === 0 ? (
        <p className="text-sm text-zinc-500">No hay publicaciones programadas.</p>
      ) : (
        grouped.map(([day, items]) => (
          <div key={day} className="card space-y-3">
            <h3 className="font-medium text-white">
              {day === 'sin-fecha' ? 'Sin fecha' : new Date(`${day}T12:00:00`).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </h3>
            {items.map((p) => (
              <article key={p.id} className="rounded-lg border border-zinc-800 p-3">
                <p className="font-medium text-zinc-200">{p.title}</p>
                <p className="text-xs text-zinc-500">
                  {formatDateTime(p.scheduled_at)} · {p.platforms.map(marketingPlatformLabel).join(', ')} ·{' '}
                  {marketingPostStatusLabel(p.status)}
                </p>
              </article>
            ))}
          </div>
        ))
      )}
    </section>
  )
}
