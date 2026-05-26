import { appBaseUrl } from '@/lib/app-url'

export const META_GRAPH_VERSION = 'v21.0'
export const META_GRAPH_BASE = `https://graph.facebook.com/${META_GRAPH_VERSION}`

/** Permisos para publicar en Página de Facebook e Instagram Business vinculado. */
export const META_OAUTH_SCOPES = [
  'pages_show_list',
  'pages_manage_posts',
  'pages_read_engagement',
  'instagram_basic',
  'instagram_content_publish',
  'business_management',
] as const

export type MetaPageCandidate = {
  pageId: string
  pageName: string
  pageAccessToken: string
  instagramUserId: string | null
  instagramUsername: string | null
}

export type MetaConnectionPublic = {
  id: string
  facebook_page_id: string
  facebook_page_name: string
  instagram_user_id: string | null
  instagram_username: string | null
  connected_by: string
  created_at: string
}

export function isMetaConfigured(): boolean {
  return Boolean(
    process.env.META_APP_ID?.trim() &&
      process.env.META_APP_SECRET?.trim(),
  )
}

export function metaAppId(): string {
  const id = process.env.META_APP_ID?.trim()
  if (!id) throw new Error('META_APP_ID no está configurado.')
  return id
}

export function metaAppSecret(): string {
  const secret = process.env.META_APP_SECRET?.trim()
  if (!secret) throw new Error('META_APP_SECRET no está configurado.')
  return secret
}

export function metaOAuthRedirectUri(): string {
  const explicit = process.env.META_REDIRECT_URI?.trim()
  if (explicit) return explicit
  return `${appBaseUrl()}/api/marketing/meta/callback`
}

export function metaOAuthAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: metaAppId(),
    redirect_uri: metaOAuthRedirectUri(),
    state,
    scope: META_OAUTH_SCOPES.join(','),
    response_type: 'code',
  })
  return `https://www.facebook.com/${META_GRAPH_VERSION}/dialog/oauth?${params.toString()}`
}

type GraphErrorBody = {
  error?: { message?: string; type?: string; code?: number }
}

async function graphFetch<T>(
  path: string,
  options?: { method?: string; searchParams?: Record<string, string>; body?: Record<string, string> },
): Promise<T> {
  const url = new URL(`${META_GRAPH_BASE}${path}`)
  if (options?.searchParams) {
    for (const [key, value] of Object.entries(options.searchParams)) {
      url.searchParams.set(key, value)
    }
  }

  const res = await fetch(url.toString(), {
    method: options?.method ?? (options?.body ? 'POST' : 'GET'),
    headers: options?.body ? { 'Content-Type': 'application/x-www-form-urlencoded' } : undefined,
    body: options?.body ? new URLSearchParams(options.body).toString() : undefined,
    cache: 'no-store',
  })

  const data = (await res.json()) as T & GraphErrorBody
  if (!res.ok || data.error?.message) {
    throw new Error(data.error?.message ?? `Meta Graph respondió ${res.status}`)
  }
  return data
}

export async function metaExchangeCodeForToken(code: string): Promise<{ access_token: string; expires_in?: number }> {
  return graphFetch('/oauth/access_token', {
    searchParams: {
      client_id: metaAppId(),
      client_secret: metaAppSecret(),
      redirect_uri: metaOAuthRedirectUri(),
      code,
    },
  })
}

export async function metaExchangeForLongLivedUserToken(
  shortLivedToken: string,
): Promise<{ access_token: string; expires_in?: number }> {
  return graphFetch('/oauth/access_token', {
    searchParams: {
      grant_type: 'fb_exchange_token',
      client_id: metaAppId(),
      client_secret: metaAppSecret(),
      fb_exchange_token: shortLivedToken,
    },
  })
}

export async function metaFetchManagedPages(userAccessToken: string): Promise<MetaPageCandidate[]> {
  const data = await graphFetch<{
    data?: Array<{
      id: string
      name: string
      access_token: string
      instagram_business_account?: { id?: string; username?: string } | null
    }>
  }>('/me/accounts', {
    searchParams: {
      access_token: userAccessToken,
      fields: 'id,name,access_token,instagram_business_account{id,username}',
    },
  })

  return (data.data ?? []).map((page) => ({
    pageId: page.id,
    pageName: page.name,
    pageAccessToken: page.access_token,
    instagramUserId: page.instagram_business_account?.id ?? null,
    instagramUsername: page.instagram_business_account?.username ?? null,
  }))
}

export async function metaPublishFacebookPhoto(input: {
  pageId: string
  pageAccessToken: string
  imageUrl: string
  caption: string
}): Promise<string> {
  const data = await graphFetch<{ id?: string; post_id?: string }>(`/${input.pageId}/photos`, {
    method: 'POST',
    body: {
      url: input.imageUrl,
      caption: input.caption,
      access_token: input.pageAccessToken,
    },
  })
  return data.post_id ?? data.id ?? ''
}

export async function metaPublishFacebookFeed(input: {
  pageId: string
  pageAccessToken: string
  message: string
  link?: string
}): Promise<string> {
  const body: Record<string, string> = {
    message: input.message,
    access_token: input.pageAccessToken,
  }
  if (input.link) body.link = input.link

  const data = await graphFetch<{ id?: string }>(`/${input.pageId}/feed`, {
    method: 'POST',
    body,
  })
  return data.id ?? ''
}

export async function metaPublishInstagramPhoto(input: {
  instagramUserId: string
  pageAccessToken: string
  imageUrl: string
  caption: string
}): Promise<string> {
  const container = await graphFetch<{ id?: string }>(`/${input.instagramUserId}/media`, {
    method: 'POST',
    body: {
      image_url: input.imageUrl,
      caption: input.caption,
      access_token: input.pageAccessToken,
    },
  })

  if (!container.id) throw new Error('Meta no devolvió el contenedor de Instagram.')

  const published = await graphFetch<{ id?: string }>(`/${input.instagramUserId}/media_publish`, {
    method: 'POST',
    body: {
      creation_id: container.id,
      access_token: input.pageAccessToken,
    },
  })

  return published.id ?? container.id
}

export async function metaDebugToken(inputToken: string): Promise<{ is_valid?: boolean; expires_at?: number }> {
  const data = await graphFetch<{ data?: { is_valid?: boolean; expires_at?: number } }>('/debug_token', {
    searchParams: {
      input_token: inputToken,
      access_token: `${metaAppId()}|${metaAppSecret()}`,
    },
  })
  return data.data ?? {}
}
