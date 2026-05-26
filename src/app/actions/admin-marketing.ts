'use server'

import type { AdminActionResult } from '@/app/actions/admin'
import { isPlatformAdmin } from '@/lib/admin'
import {
  applyMarketingTemplate,
  buildMarketingUrl,
  defaultMarketingVariables,
  type MarketingAssetType,
  type MarketingPlatform,
  type MarketingPostStatus,
  type MarketingPostType,
} from '@/lib/marketing'
import { createServiceClient } from '@/lib/supabase/service'
import { revalidatePath } from 'next/cache'

async function assertAdmin(): Promise<{ error: string } | null> {
  if (!(await isPlatformAdmin())) {
    return { error: 'No tenés permisos de administrador.' }
  }
  return null
}

function revalidateMarketing() {
  revalidatePath('/admin/marketing')
  revalidatePath('/promo')
}

export type MarketingAssetInput = {
  title: string
  description?: string | null
  asset_type: MarketingAssetType
  storage_path?: string | null
  external_url?: string | null
  rubro?: string | null
  city?: string | null
  shop_id?: string | null
  tags?: string[]
}

export type MarketingTemplateInput = {
  name: string
  description?: string | null
  body: string
  suggested_platforms?: string[]
  hashtags?: string | null
}

export type MarketingPostInput = {
  title: string
  post_type: MarketingPostType
  platforms: MarketingPlatform[]
  status: MarketingPostStatus
  caption: string
  template_id?: string | null
  asset_ids?: string[]
  scheduled_at?: string | null
  published_at?: string | null
  utm_source?: string | null
  utm_medium?: string | null
  utm_campaign?: string | null
  link_path?: string
  notes?: string | null
}

export type MarketingCampaignInput = {
  name: string
  slug: string
  offer_text: string
  landing_path?: string
  utm_campaign: string
  active?: boolean
}

export async function listMarketingAssetsAdmin() {
  const denied = await assertAdmin()
  if (denied) return denied

  const service = createServiceClient()
  const { data, error } = await service
    .from('marketing_assets')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return { error: error.message }
  return { assets: data ?? [] }
}

export async function createMarketingAssetAdmin(input: MarketingAssetInput) {
  const denied = await assertAdmin()
  if (denied) return denied

  const title = input.title.trim()
  if (!title) return { error: 'El título es obligatorio.' }
  if (!input.storage_path?.trim() && !input.external_url?.trim()) {
    return { error: 'Subí una imagen o pegá una URL externa.' }
  }

  const service = createServiceClient()
  const { data, error } = await service
    .from('marketing_assets')
    .insert({
      title,
      description: input.description?.trim() || null,
      asset_type: input.asset_type,
      storage_path: input.storage_path?.trim() || null,
      external_url: input.external_url?.trim() || null,
      rubro: input.rubro?.trim() || null,
      city: input.city?.trim() || null,
      shop_id: input.shop_id || null,
      tags: input.tags ?? [],
    })
    .select('id')
    .single()

  if (error) return { error: error.message }
  revalidateMarketing()
  return { ok: true as const, id: data.id as string }
}

export async function updateMarketingAssetAdmin(id: string, input: MarketingAssetInput): Promise<AdminActionResult> {
  const denied = await assertAdmin()
  if (denied) return denied

  const title = input.title.trim()
  if (!title) return { error: 'El título es obligatorio.' }

  const service = createServiceClient()
  const { error } = await service
    .from('marketing_assets')
    .update({
      title,
      description: input.description?.trim() || null,
      asset_type: input.asset_type,
      storage_path: input.storage_path?.trim() || null,
      external_url: input.external_url?.trim() || null,
      rubro: input.rubro?.trim() || null,
      city: input.city?.trim() || null,
      shop_id: input.shop_id || null,
      tags: input.tags ?? [],
    })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidateMarketing()
  return { ok: true }
}

export async function deleteMarketingAssetAdmin(id: string): Promise<AdminActionResult> {
  const denied = await assertAdmin()
  if (denied) return denied

  const service = createServiceClient()
  const { error } = await service.from('marketing_assets').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidateMarketing()
  return { ok: true }
}

export async function listMarketingTemplatesAdmin() {
  const denied = await assertAdmin()
  if (denied) return denied

  const service = createServiceClient()
  const { data, error } = await service
    .from('marketing_post_templates')
    .select('*')
    .order('is_default', { ascending: false })
    .order('name')

  if (error) return { error: error.message }
  return { templates: data ?? [] }
}

export async function saveMarketingTemplateAdmin(
  input: MarketingTemplateInput & { id?: string },
): Promise<AdminActionResult & { id?: string }> {
  const denied = await assertAdmin()
  if (denied) return denied

  const name = input.name.trim()
  const body = input.body.trim()
  if (!name) return { error: 'El nombre es obligatorio.' }
  if (!body) return { error: 'El texto de la plantilla es obligatorio.' }

  const service = createServiceClient()
  const row = {
    name,
    description: input.description?.trim() || null,
    body,
    suggested_platforms: input.suggested_platforms ?? [],
    hashtags: input.hashtags?.trim() || null,
  }

  if (input.id) {
    const { error } = await service.from('marketing_post_templates').update(row).eq('id', input.id)
    if (error) return { error: error.message }
    revalidateMarketing()
    return { ok: true, id: input.id }
  }

  const { data, error } = await service.from('marketing_post_templates').insert(row).select('id').single()
  if (error) return { error: error.message }
  revalidateMarketing()
  return { ok: true, id: data.id as string }
}

export async function deleteMarketingTemplateAdmin(id: string): Promise<AdminActionResult> {
  const denied = await assertAdmin()
  if (denied) return denied

  const service = createServiceClient()
  const { error } = await service.from('marketing_post_templates').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidateMarketing()
  return { ok: true }
}

export async function listMarketingPostsAdmin() {
  const denied = await assertAdmin()
  if (denied) return denied

  const service = createServiceClient()
  const { data, error } = await service
    .from('marketing_posts')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return { error: error.message }
  return { posts: data ?? [] }
}

export async function saveMarketingPostAdmin(
  input: MarketingPostInput & { id?: string },
): Promise<AdminActionResult & { id?: string }> {
  const denied = await assertAdmin()
  if (denied) return denied

  const title = input.title.trim()
  if (!title) return { error: 'El título es obligatorio.' }
  if (!input.platforms.length) return { error: 'Elegí al menos una red social.' }

  const service = createServiceClient()
  const row = {
    title,
    post_type: input.post_type,
    platforms: input.platforms,
    status: input.status,
    caption: input.caption,
    template_id: input.template_id || null,
    asset_ids: input.asset_ids ?? [],
    scheduled_at: input.scheduled_at || null,
    published_at: input.published_at || null,
    utm_source: input.utm_source?.trim() || null,
    utm_medium: input.utm_medium?.trim() || 'social',
    utm_campaign: input.utm_campaign?.trim() || null,
    link_path: input.link_path?.trim() || '/promo',
    notes: input.notes?.trim() || null,
  }

  if (input.id) {
    const { error } = await service.from('marketing_posts').update(row).eq('id', input.id)
    if (error) return { error: error.message }
    revalidateMarketing()
    return { ok: true, id: input.id }
  }

  const { data, error } = await service.from('marketing_posts').insert(row).select('id').single()
  if (error) return { error: error.message }
  revalidateMarketing()
  return { ok: true, id: data.id as string }
}

export async function deleteMarketingPostAdmin(id: string): Promise<AdminActionResult> {
  const denied = await assertAdmin()
  if (denied) return denied

  const service = createServiceClient()
  const { error } = await service.from('marketing_posts').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidateMarketing()
  return { ok: true }
}

export async function listMarketingCampaignsAdmin() {
  const denied = await assertAdmin()
  if (denied) return denied

  const service = createServiceClient()
  const { data, error } = await service
    .from('marketing_campaigns')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return { error: error.message }
  return { campaigns: data ?? [] }
}

export async function saveMarketingCampaignAdmin(
  input: MarketingCampaignInput & { id?: string },
): Promise<AdminActionResult & { id?: string }> {
  const denied = await assertAdmin()
  if (denied) return denied

  const name = input.name.trim()
  const slug = input.slug.trim().toLowerCase().replace(/\s+/g, '-')
  const utm_campaign = input.utm_campaign.trim()
  if (!name || !slug || !utm_campaign) {
    return { error: 'Nombre, slug y utm_campaign son obligatorios.' }
  }

  const service = createServiceClient()
  const row = {
    name,
    slug,
    offer_text: input.offer_text.trim() || '7 días gratis',
    landing_path: input.landing_path?.trim() || '/promo',
    utm_campaign,
    active: input.active ?? true,
  }

  if (input.id) {
    const { error } = await service.from('marketing_campaigns').update(row).eq('id', input.id)
    if (error) return { error: error.message }
    revalidateMarketing()
    return { ok: true, id: input.id }
  }

  const { data, error } = await service.from('marketing_campaigns').insert(row).select('id').single()
  if (error) return { error: error.message }
  revalidateMarketing()
  return { ok: true, id: data.id as string }
}

export async function previewMarketingCaptionAdmin(input: {
  templateId: string
  rubro?: string | null
  city?: string | null
  shopName?: string | null
  offerText?: string | null
  utm_source?: string | null
  utm_medium?: string | null
  utm_campaign?: string | null
  link_path?: string
}) {
  const denied = await assertAdmin()
  if (denied) return denied

  const service = createServiceClient()
  const { data: template, error } = await service
    .from('marketing_post_templates')
    .select('body, hashtags')
    .eq('id', input.templateId)
    .maybeSingle()

  if (error) return { error: error.message }
  if (!template) return { error: 'Plantilla no encontrada.' }

  const link = buildMarketingUrl({
    path: input.link_path ?? '/promo',
    utm_source: input.utm_source,
    utm_medium: input.utm_medium,
    utm_campaign: input.utm_campaign,
  })

  const vars = defaultMarketingVariables({
    rubro: input.rubro,
    city: input.city,
    shopName: input.shopName,
    offerText: input.offerText,
    link,
  })

  const caption = applyMarketingTemplate(template.body as string, vars)
  const hashtags = (template.hashtags as string | null) ?? null

  return { caption, hashtags, link }
}

export async function listMarketingShopsForAssetsAdmin() {
  const denied = await assertAdmin()
  if (denied) return denied

  const service = createServiceClient()
  const { data, error } = await service
    .from('shops')
    .select('id, name, slug, category_label')
    .order('name')
    .limit(200)

  if (error) return { error: error.message }
  return { shops: data ?? [] }
}

export async function getMarketingDashboardAdmin() {
  const denied = await assertAdmin()
  if (denied) return denied

  const service = createServiceClient()
  const [assets, templates, posts, campaigns, shops] = await Promise.all([
    service.from('marketing_assets').select('*').order('created_at', { ascending: false }),
    service.from('marketing_post_templates').select('*').order('is_default', { ascending: false }).order('name'),
    service.from('marketing_posts').select('*').order('created_at', { ascending: false }),
    service.from('marketing_campaigns').select('*').order('created_at', { ascending: false }),
    service.from('shops').select('id, name, slug, category_label').order('name').limit(200),
  ])

  if (assets.error) return { error: assets.error.message }
  if (templates.error) return { error: templates.error.message }
  if (posts.error) return { error: posts.error.message }
  if (campaigns.error) return { error: campaigns.error.message }
  if (shops.error) return { error: shops.error.message }

  return {
    assets: assets.data ?? [],
    templates: templates.data ?? [],
    posts: posts.data ?? [],
    campaigns: campaigns.data ?? [],
    shops: shops.data ?? [],
  }
}
