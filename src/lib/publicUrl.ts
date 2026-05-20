/** Origen público de la app (sin barra final). */
export function appBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '')

  if (fromEnv && !isLocalHost(fromEnv)) {
    return fromEnv
  }

  const vercel = vercelOrigin()
  if (vercel) return vercel

  if (typeof window !== 'undefined') {
    return window.location.origin
  }

  if (fromEnv) return fromEnv
  return 'http://localhost:3000'
}

function isLocalHost(url: string): boolean {
  return /localhost|127\.0\.0\.1/i.test(url)
}

function vercelOrigin(): string | null {
  const host = process.env.VERCEL_URL?.replace(/^https?:\/\//, '').replace(/\/$/, '')
  if (!host) return null
  return `https://${host}`
}

export function shopPublicUrl(slug: string): string {
  return `${appBaseUrl()}/tienda/${slug}`
}

/** URL de retorno tras enlaces de auth (recuperar contraseña, confirmar email). */
export function authConfirmUrl(next = '/actualizar-contrasena'): string {
  return `${appBaseUrl()}/auth/confirmar?next=${encodeURIComponent(next)}`
}

/** Texto para formularios: mendoshop.vercel.app/tienda/ */
export function shopLinkPrefix(): string {
  try {
    return `${new URL(appBaseUrl()).host}/tienda/`
  } catch {
    return '/tienda/'
  }
}

export function getPublicUrlFromPath(path: string | null | undefined): string | null {
  if (!path) return null
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!base) return null
  return `${base}/storage/v1/object/public/shop-images/${path}`
}
