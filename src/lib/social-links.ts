import { PLAN_LIMITS } from '@/lib/plans'
import { isSafeHttpUrl } from '@/lib/sanitize'
import { buildWhatsAppUrl } from '@/lib/shops'
import type { ShopRow } from '@/types/shop'

function safeExternalUrl(url: string | null): string | null {
  if (!url) return null
  return isSafeHttpUrl(url) ? url : null
}

export type SocialLinkId = 'instagram' | 'tiktok' | 'whatsapp' | 'website'

export type ShopSocialLink = {
  id: SocialLinkId
  label: string
  href: string
}

export function normalizeInstagramUrl(input: string): string | null {
  const s = sanitizeSocialUsernameInput(input)
  if (!s) return null
  if (/^https?:\/\//i.test(s)) {
    const url = s.replace(/\/+$/, '')
    return safeExternalUrl(url)
  }
  const user = s.replace(/^@/, '').replace(/^instagram\.com\//i, '').replace(/\/+$/, '')
  if (!user || /[/?#]/.test(user)) return null
  return safeExternalUrl(`https://www.instagram.com/${encodeURIComponent(user)}/`)
}

export function normalizeWebsiteUrl(input: string): string | null {
  const s = sanitizeSocialUsernameInput(input)
  if (!s) return null
  const url = /^https?:\/\//i.test(s) ? s.replace(/\/+$/, '') : `https://${s.replace(/^\/+/, '')}`
  return safeExternalUrl(url)
}

export function normalizeTikTokUrl(input: string): string | null {
  const s = sanitizeSocialUsernameInput(input)
  if (!s) return null
  if (/^https?:\/\//i.test(s)) {
    const url = s.replace(/\/+$/, '')
    return safeExternalUrl(url)
  }
  let user = s.replace(/^@/, '').replace(/^tiktok\.com\//i, '').replace(/\/+$/, '')
  if (!user || /[/?#]/.test(user)) return null
  if (!user.startsWith('@')) user = `@${user}`
  const handle = user.replace(/^@/, '')
  return safeExternalUrl(`https://www.tiktok.com/@${encodeURIComponent(handle)}`)
}

function sanitizeSocialUsernameInput(input: string): string {
  return input.replace(CONTROL_CHARS, '').trim()
}

const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g

export function getShopSocialLinks(shop: ShopRow): ShopSocialLink[] {
  const out: ShopSocialLink[] = []

  const ig = shop.instagram_url?.trim()
  if (ig) {
    out.push({
      id: 'instagram',
      label: 'Instagram',
      href: ig,
    })
  }

  const tt = shop.tiktok_url?.trim()
  if (tt) {
    out.push({
      id: 'tiktok',
      label: 'TikTok',
      href: tt,
    })
  }

  if (shop.social_whatsapp_visible && shop.whatsapp_e164) {
    out.push({
      id: 'whatsapp',
      label: 'WhatsApp',
      href: buildWhatsAppUrl(shop.whatsapp_e164, `Hola! Vi la tienda *${shop.name}*.`),
    })
  }

  const web = shop.website_url?.trim()
  if (web) {
    out.push({
      id: 'website',
      label: 'Web personal',
      href: web,
    })
  }

  const max = PLAN_LIMITS[shop.plan].maxSocialLinks
  if (max <= 0) return []
  return out.slice(0, max)
}
