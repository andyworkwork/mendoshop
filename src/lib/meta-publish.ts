import { composeMarketingCaption, buildMarketingUrl } from '@/lib/marketing'
import {
  metaPublishFacebookFeed,
  metaPublishFacebookPhoto,
  metaPublishInstagramPhoto,
  type MetaConnectionPublic,
} from '@/lib/meta-graph'
import { getPublicUrlFromPath } from '@/lib/publicUrl'
import { createServiceClient } from '@/lib/supabase/service'

type MarketingPostRow = {
  id: string
  title: string
  platforms: string[]
  caption: string
  asset_ids: string[]
  template_id: string | null
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  link_path: string
  status: string
}

type MarketingAssetRow = {
  id: string
  storage_path: string | null
  external_url: string | null
  asset_type: string
}

async function loadPost(postId: string): Promise<MarketingPostRow | null> {
  const service = createServiceClient()
  const { data } = await service.from('marketing_posts').select('*').eq('id', postId).maybeSingle()
  return data as MarketingPostRow | null
}

async function loadConnection(): Promise<(MetaConnectionPublic & { page_access_token: string }) | null> {
  const service = createServiceClient()
  const { data } = await service
    .from('marketing_meta_connections')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return data as (MetaConnectionPublic & { page_access_token: string }) | null
}

async function loadAssets(assetIds: string[]): Promise<MarketingAssetRow[]> {
  if (!assetIds.length) return []
  const service = createServiceClient()
  const { data } = await service.from('marketing_assets').select('id, storage_path, external_url, asset_type').in('id', assetIds)
  return (data ?? []) as MarketingAssetRow[]
}

async function loadTemplateHashtags(templateId: string | null): Promise<string | null> {
  if (!templateId) return null
  const service = createServiceClient()
  const { data } = await service.from('marketing_post_templates').select('hashtags').eq('id', templateId).maybeSingle()
  return (data?.hashtags as string | null) ?? null
}

function firstPublicImageUrl(assets: MarketingAssetRow[]): string | null {
  for (const asset of assets) {
    if (asset.asset_type !== 'image') continue
    if (asset.storage_path) {
      const url = getPublicUrlFromPath(asset.storage_path)
      if (url) return url
    }
    if (asset.external_url?.startsWith('http')) return asset.external_url
  }
  return null
}

export async function publishMarketingPostToMeta(postId: string): Promise<
  | { ok: true; facebookPostId?: string; instagramPostId?: string; warnings: string[] }
  | { error: string }
> {
  const post = await loadPost(postId)
  if (!post) return { error: 'Publicación no encontrada.' }

  const connection = await loadConnection()
  if (!connection) {
    return { error: 'Conectá Facebook e Instagram en Marketing → Redes sociales.' }
  }

  const wantsFacebook = post.platforms.includes('facebook')
  const wantsInstagram = post.platforms.includes('instagram')
  if (!wantsFacebook && !wantsInstagram) {
    return { error: 'Esta publicación no incluye Facebook ni Instagram.' }
  }

  const assets = await loadAssets(post.asset_ids ?? [])
  const imageUrl = firstPublicImageUrl(assets)
  const hashtags = await loadTemplateHashtags(post.template_id)
  const trackingLink = buildMarketingUrl({
    path: post.link_path,
    utm_source: post.utm_source,
    utm_medium: post.utm_medium,
    utm_campaign: post.utm_campaign,
  })
  const caption = composeMarketingCaption(post.caption, hashtags)
  const warnings: string[] = []
  let facebookPostId: string | undefined
  let instagramPostId: string | undefined

  try {
    if (wantsFacebook) {
      if (imageUrl) {
        facebookPostId = await metaPublishFacebookPhoto({
          pageId: connection.facebook_page_id,
          pageAccessToken: connection.page_access_token,
          imageUrl,
          caption: `${caption}\n\n${trackingLink}`.trim(),
        })
      } else {
        facebookPostId = await metaPublishFacebookFeed({
          pageId: connection.facebook_page_id,
          pageAccessToken: connection.page_access_token,
          message: caption,
          link: trackingLink,
        })
      }
    }

    if (wantsInstagram) {
      if (!connection.instagram_user_id) {
        warnings.push('Instagram no está vinculado a la Página de Facebook conectada.')
      } else if (!imageUrl) {
        warnings.push('Instagram requiere al menos una imagen en la publicación.')
      } else {
        instagramPostId = await metaPublishInstagramPhoto({
          instagramUserId: connection.instagram_user_id,
          pageAccessToken: connection.page_access_token,
          imageUrl,
          caption: `${caption}\n\n${trackingLink}`.trim(),
        })
      }
    }

    if (wantsFacebook && !facebookPostId && wantsInstagram && !instagramPostId && warnings.length) {
      return { error: warnings.join(' ') }
    }

    const service = createServiceClient()
    await service
      .from('marketing_posts')
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
        last_published_at: new Date().toISOString(),
        last_publish_error: warnings.length ? warnings.join(' ') : null,
        meta_facebook_post_id: facebookPostId ?? null,
        meta_instagram_post_id: instagramPostId ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', postId)

    return { ok: true, facebookPostId, instagramPostId, warnings }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error al publicar en Meta.'
    const service = createServiceClient()
    await service
      .from('marketing_posts')
      .update({
        last_publish_error: message,
        updated_at: new Date().toISOString(),
      })
      .eq('id', postId)
    return { error: message }
  }
}

export async function publishDueScheduledMarketingPosts(): Promise<{
  processed: number
  published: number
  errors: string[]
}> {
  const service = createServiceClient()
  const now = new Date().toISOString()
  const { data: rows } = await service
    .from('marketing_posts')
    .select('id, title')
    .eq('status', 'scheduled')
    .lte('scheduled_at', now)
    .order('scheduled_at', { ascending: true })
    .limit(10)

  let published = 0
  const errors: string[] = []

  for (const row of rows ?? []) {
    const result = await publishMarketingPostToMeta(row.id as string)
    if ('error' in result) {
      errors.push(`${row.title}: ${result.error}`)
    } else {
      published += 1
      if (result.warnings.length) {
        errors.push(`${row.title}: ${result.warnings.join(' ')}`)
      }
    }
  }

  return { processed: rows?.length ?? 0, published, errors }
}
