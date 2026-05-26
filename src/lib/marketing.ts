import { appBaseUrl } from '@/lib/app-url'

export const MARKETING_PLATFORMS = ['facebook', 'instagram', 'tiktok'] as const
export type MarketingPlatform = (typeof MARKETING_PLATFORMS)[number]

export const MARKETING_POST_TYPES = ['photo', 'carousel', 'video', 'story'] as const
export type MarketingPostType = (typeof MARKETING_POST_TYPES)[number]

export const MARKETING_POST_STATUSES = ['draft', 'reviewed', 'scheduled', 'published'] as const
export type MarketingPostStatus = (typeof MARKETING_POST_STATUSES)[number]

export const MARKETING_ASSET_TYPES = ['image', 'video'] as const
export type MarketingAssetType = (typeof MARKETING_ASSET_TYPES)[number]

export const MARKETING_TEMPLATE_VARIABLES = [
  'BENEFICIO',
  'LINK',
  'RUBRO',
  'CIUDAD',
  'NOMBRE_TIENDA',
] as const

export type MarketingTemplateVariables = {
  BENEFICIO?: string
  LINK?: string
  RUBRO?: string
  CIUDAD?: string
  NOMBRE_TIENDA?: string
}

export type MarketingAsset = {
  id: string
  title: string
  description: string | null
  asset_type: MarketingAssetType
  storage_path: string | null
  external_url: string | null
  rubro: string | null
  city: string | null
  shop_id: string | null
  tags: string[]
  created_at: string
}

export type MarketingPostTemplate = {
  id: string
  name: string
  description: string | null
  body: string
  suggested_platforms: string[]
  hashtags: string | null
  is_default: boolean
}

export type MarketingPost = {
  id: string
  title: string
  post_type: MarketingPostType
  platforms: string[]
  status: MarketingPostStatus
  caption: string
  template_id: string | null
  asset_ids: string[]
  scheduled_at: string | null
  published_at: string | null
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  link_path: string
  notes: string | null
  created_at: string
}

export type MarketingCampaign = {
  id: string
  name: string
  slug: string
  offer_text: string
  landing_path: string
  utm_campaign: string
  active: boolean
}

export function marketingPlatformLabel(platform: string): string {
  switch (platform) {
    case 'facebook':
      return 'Facebook'
    case 'instagram':
      return 'Instagram'
    case 'tiktok':
      return 'TikTok'
    default:
      return platform
  }
}

export function marketingPostStatusLabel(status: MarketingPostStatus): string {
  switch (status) {
    case 'draft':
      return 'Borrador'
    case 'reviewed':
      return 'Revisado'
    case 'scheduled':
      return 'Programado'
    case 'published':
      return 'Publicado'
  }
}

export function marketingPostTypeLabel(type: MarketingPostType): string {
  switch (type) {
    case 'photo':
      return 'Foto'
    case 'carousel':
      return 'Carrusel'
    case 'video':
      return 'Video'
    case 'story':
      return 'Story'
  }
}

export function buildMarketingUrl(input: {
  path?: string
  utm_source?: string | null
  utm_medium?: string | null
  utm_campaign?: string | null
  baseUrl?: string
}): string {
  const base = (input.baseUrl ?? appBaseUrl()).replace(/\/$/, '')
  const path = input.path?.startsWith('/') ? input.path : `/${input.path ?? 'promo'}`
  const url = new URL(`${base}${path}`)

  if (input.utm_source?.trim()) url.searchParams.set('utm_source', input.utm_source.trim())
  if (input.utm_medium?.trim()) url.searchParams.set('utm_medium', input.utm_medium.trim())
  if (input.utm_campaign?.trim()) url.searchParams.set('utm_campaign', input.utm_campaign.trim())

  return url.toString()
}

export function buildRegistroUrlFromMarketing(input: {
  utm_source?: string | null
  utm_medium?: string | null
  utm_campaign?: string | null
  ref?: string | null
  baseUrl?: string
}): string {
  const base = (input.baseUrl ?? appBaseUrl()).replace(/\/$/, '')
  const url = new URL(`${base}/registro`)

  if (input.ref?.trim()) url.searchParams.set('ref', input.ref.trim())
  if (input.utm_source?.trim()) url.searchParams.set('utm_source', input.utm_source.trim())
  if (input.utm_medium?.trim()) url.searchParams.set('utm_medium', input.utm_medium.trim())
  if (input.utm_campaign?.trim()) url.searchParams.set('utm_campaign', input.utm_campaign.trim())

  return url.toString()
}

export function applyMarketingTemplate(
  body: string,
  vars: MarketingTemplateVariables,
): string {
  let out = body
  for (const key of MARKETING_TEMPLATE_VARIABLES) {
    const value = vars[key]?.trim() ?? ''
    out = out.replaceAll(`{${key}}`, value)
  }
  return out
}

export function defaultMarketingVariables(input?: {
  rubro?: string | null
  city?: string | null
  shopName?: string | null
  offerText?: string | null
  link?: string | null
}): MarketingTemplateVariables {
  return {
    BENEFICIO: input?.offerText?.trim() || '7 días gratis',
    LINK: input?.link?.trim() || buildMarketingUrl({ path: '/promo', utm_campaign: '7dias_gratis' }),
    RUBRO: input?.rubro?.trim() || 'Tu rubro',
    CIUDAD: input?.city?.trim() || 'Tu ciudad',
    NOMBRE_TIENDA: input?.shopName?.trim() || 'Tu tienda',
  }
}

export function composeMarketingCaption(caption: string, hashtags: string | null | undefined): string {
  const base = caption.trim()
  const tags = hashtags?.trim()
  if (!tags) return base
  if (!base) return tags
  return `${base}\n\n${tags}`
}
