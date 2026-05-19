export function appBaseUrl(): string {
  const env = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '')
  if (env) return env
  if (typeof window !== 'undefined') return window.location.origin
  return 'http://localhost:3000'
}

export function shopPublicUrl(slug: string): string {
  return `${appBaseUrl()}/tienda/${slug}`
}

export function getPublicUrlFromPath(path: string | null | undefined): string | null {
  if (!path) return null
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!base) return null
  return `${base}/storage/v1/object/public/shop-images/${path}`
}
