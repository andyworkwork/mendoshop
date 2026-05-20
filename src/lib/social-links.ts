import { buildWhatsAppUrl } from '@/lib/shops'
import type { ShopRow } from '@/types/shop'

export type SocialLinkId = 'instagram' | 'tiktok' | 'whatsapp' | 'website'

export type ShopSocialLink = {
  id: SocialLinkId
  label: string
  href: string
}

export function normalizeInstagramUrl(input: string): string | null {
  const s = input.trim()
  if (!s) return null
  if (/^https?:\/\//i.test(s)) return s.replace(/\/+$/, '')
  const user = s.replace(/^@/, '').replace(/^instagram\.com\//i, '').replace(/\/+$/, '')
  if (!user) return null
  return `https://www.instagram.com/${user}/`
}

export function normalizeWebsiteUrl(input: string): string | null {
  const s = input.trim()
  if (!s) return null
  if (/^https?:\/\//i.test(s)) return s.replace(/\/+$/, '')
  return `https://${s.replace(/^\/+/, '')}`
}

export function normalizeTikTokUrl(input: string): string | null {
  const s = input.trim()
  if (!s) return null
  if (/^https?:\/\//i.test(s)) return s.replace(/\/+$/, '')
  let user = s.replace(/^@/, '').replace(/^tiktok\.com\//i, '').replace(/\/+$/, '')
  if (!user) return null
  if (!user.startsWith('@')) user = `@${user}`
  return `https://www.tiktok.com/${user}`
}

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

  return out
}
