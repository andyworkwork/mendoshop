'use client'

import { useMemo, useState, useTransition } from 'react'
import {
  createMarketingAssetAdmin,
  deleteMarketingAssetAdmin,
  deleteMarketingPostAdmin,
  deleteMarketingTemplateAdmin,
  previewMarketingCaptionAdmin,
  publishMarketingPostToMetaAdmin,
  saveMarketingCampaignAdmin,
  saveMarketingPostAdmin,
  saveMarketingTemplateAdmin,
  type MarketingAssetInput,
  type MarketingPostInput,
} from '@/app/actions/admin-marketing'
import { AdminMarketingMetaSection } from '@/components/admin-marketing-meta-section'
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
import { marketingAssetImagePath } from '@/lib/marketing-storage'
import { getPublicUrlFromPath } from '@/lib/publicUrl'
import { SHOP_IMAGES_CACHE_CONTROL } from '@/lib/storage-cache'
import type { MetaConnectionPublic } from '@/lib/meta-graph'
import { createClient } from '@/lib/supabase/browser'

type ShopOption = {
  id: string
  name: string
  slug: string
  category_label: string | null
}

type Tab = 'assets' | 'templates' | 'posts' | 'campaigns' | 'calendar' | 'social'

const TABS: { id: Tab; label: string }[] = [
  { id: 'assets', label: 'Biblioteca' },
  { id: 'templates', label: 'Plantillas' },
  { id: 'posts', label: 'Publicaciones' },
  { id: 'social', label: 'Redes sociales' },
  { id: 'campaigns', label: 'Enlaces UTM' },
  { id: 'calendar', label: 'Calendario' },
]

function assetPreviewUrl(asset: MarketingAsset): string | null {
  if (asset.storage_path) return getPublicUrlFromPath(asset.storage_path)
  return asset.external_url
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
  metaConfigured,
  metaConnection,
  initialNotice,
}: {
  initialAssets: MarketingAsset[]
  initialTemplates: MarketingPostTemplate[]
  initialPosts: MarketingPost[]
  initialCampaigns: MarketingCampaign[]
  initialShops: ShopOption[]
  metaConfigured: boolean
  metaConnection: MetaConnectionPublic | null
  initialNotice?: string | null
}) {
  const [tab, setTab] = useState<Tab>('assets')
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
    <div className="space-y-6">
      <nav className="flex flex-wrap gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/60 p-1.5">
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
          pending={pending}
          onAssetsChange={setAssets}
          onFlash={flash}
          startTransition={startTransition}
        />
      )}
      {tab === 'templates' && (
        <TemplatesTab
          templates={templates}
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
    </div>
  )
}

function AssetsTab({
  assets,
  shops,
  pending,
  onAssetsChange,
  onFlash,
  startTransition,
}: {
  assets: MarketingAsset[]
  shops: ShopOption[]
  pending: boolean
  onAssetsChange: (assets: MarketingAsset[]) => void
  onFlash: (ok: string | null, err?: string | null) => void
  startTransition: (fn: () => void) => void
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [rubro, setRubro] = useState('')
  const [city, setCity] = useState('')
  const [shopId, setShopId] = useState('')
  const [externalUrl, setExternalUrl] = useState('')
  const [tags, setTags] = useState('')
  const [uploading, setUploading] = useState(false)

  async function handleUpload(file: File | null) {
    if (!file) return
    if (!title.trim()) {
      onFlash(null, 'Escribí un título antes de subir.')
      return
    }

    setUploading(true)
    onFlash(null, null)
    try {
      const assetId = crypto.randomUUID()
      const path = marketingAssetImagePath(assetId)
      const webp = await compressImageForUpload(file)
      const sb = createClient()
      const { error: upErr } = await sb.storage.from('shop-images').upload(path, webp, {
        cacheControl: SHOP_IMAGES_CACHE_CONTROL,
        upsert: true,
        contentType: 'image/webp',
      })
      if (upErr) throw new Error(upErr.message)

      const input: MarketingAssetInput = {
        title,
        description,
        asset_type: 'image',
        storage_path: path,
        external_url: externalUrl || null,
        rubro,
        city,
        shop_id: shopId || null,
        tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      }

      startTransition(async () => {
        const res = await createMarketingAssetAdmin(input)
        if ('error' in res) {
          onFlash(null, res.error)
          return
        }
        onAssetsChange([
          {
            id: res.id,
            title: input.title,
            description: input.description ?? null,
            asset_type: 'image',
            storage_path: path,
            external_url: input.external_url ?? null,
            rubro: input.rubro ?? null,
            city: input.city ?? null,
            shop_id: input.shop_id ?? null,
            tags: input.tags ?? [],
            created_at: new Date().toISOString(),
          },
          ...assets,
        ])
        setTitle('')
        setDescription('')
        setRubro('')
        setCity('')
        setShopId('')
        setExternalUrl('')
        setTags('')
        onFlash('Asset subido.')
      })
    } catch (e) {
      onFlash(null, e instanceof Error ? e.message : 'No se pudo subir la imagen.')
    } finally {
      setUploading(false)
    }
  }

  async function handleExternalVideo() {
    if (!title.trim() || !externalUrl.trim()) {
      onFlash(null, 'Título y URL son obligatorios para video externo.')
      return
    }
    startTransition(async () => {
      const res = await createMarketingAssetAdmin({
        title,
        description,
        asset_type: 'video',
        external_url: externalUrl,
        rubro,
        city,
        shop_id: shopId || null,
        tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      })
      if ('error' in res) {
        onFlash(null, res.error)
        return
      }
      onAssetsChange([
        {
          id: res.id,
          title,
          description: description || null,
          asset_type: 'video',
          storage_path: null,
          external_url: externalUrl,
          rubro: rubro || null,
          city: city || null,
          shop_id: shopId || null,
          tags: tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean),
          created_at: new Date().toISOString(),
        },
        ...assets,
      ])
      setTitle('')
      setDescription('')
      setExternalUrl('')
      onFlash('Video externo guardado.')
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

  return (
    <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
      <section className="card space-y-4">
        <h2 className="text-lg font-semibold text-white">Subir asset</h2>
        <label className="block space-y-1 text-sm">
          <span className="text-zinc-400">Título</span>
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
          <span className="text-zinc-400">Imagen</span>
          <input
            type="file"
            accept="image/*"
            disabled={uploading || pending}
            onChange={(e) => void handleUpload(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-zinc-300"
          />
        </label>
        <div className="border-t border-zinc-800 pt-4 space-y-2">
          <p className="text-xs text-zinc-500">O pegá URL de video (TikTok, Drive, etc.)</p>
          <input className="input w-full" value={externalUrl} onChange={(e) => setExternalUrl(e.target.value)} placeholder="https://..." />
          <button type="button" className="btn-secondary-outline w-full text-sm" disabled={pending} onClick={() => void handleExternalVideo()}>
            Guardar video externo
          </button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Biblioteca ({assets.length})</h2>
        {assets.length === 0 ? (
          <p className="text-sm text-zinc-500">Todavía no hay fotos ni videos cargados.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {assets.map((asset) => {
              const preview = assetPreviewUrl(asset)
              return (
                <article key={asset.id} className="card space-y-3">
                  {preview && asset.asset_type === 'image' ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={preview} alt={asset.title} className="aspect-video w-full rounded-lg object-cover" />
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
                  </div>
                  <button type="button" className="text-xs text-red-400 hover:text-red-300" onClick={() => handleDelete(asset.id)}>
                    Eliminar
                  </button>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

function TemplatesTab({
  templates,
  pending,
  onTemplatesChange,
  onFlash,
  startTransition,
}: {
  templates: MarketingPostTemplate[]
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

  function resetForm() {
    setEditingId(null)
    setName('')
    setDescription('')
    setBody('')
    setHashtags('')
    setPlatforms(['instagram'])
  }

  function loadTemplate(t: MarketingPostTemplate) {
    setEditingId(t.id)
    setName(t.name)
    setDescription(t.description ?? '')
    setBody(t.body)
    setHashtags(t.hashtags ?? '')
    setPlatforms(t.suggested_platforms.length ? t.suggested_platforms : ['instagram'])
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
                <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-xs text-zinc-400">{t.body}</p>
              </div>
              <div className="flex gap-2">
                <button type="button" className="text-xs text-brand" onClick={() => loadTemplate(t)}>
                  Editar
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
          <p className="mb-2 text-sm text-zinc-400">Assets ({assetIds.length} seleccionados)</p>
          <div className="max-h-40 space-y-2 overflow-y-auto rounded-lg border border-zinc-800 p-2">
            {assets.map((a) => (
              <label key={a.id} className="flex items-center gap-2 text-xs text-zinc-300">
                <input type="checkbox" checked={assetIds.includes(a.id)} onChange={() => toggleAsset(a.id)} />
                {a.title}
              </label>
            ))}
          </div>
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
