import type { SupabaseClient } from '@supabase/supabase-js'
import { parseTheme } from '@/lib/themes'
import type { ShopRow } from '@/types/shop'
import { DEFAULT_THEME } from '@/types/shop'

export function mapShopRow(raw: Record<string, unknown>): ShopRow {
  return {
    id: String(raw.id),
    slug: String(raw.slug),
    name: String(raw.name),
    description: (raw.description as string | null) ?? null,
    whatsapp_e164: String(raw.whatsapp_e164),
    logo_path: (raw.logo_path as string | null) ?? null,
    banner_path: (raw.banner_path as string | null) ?? null,
    plan: (raw.plan as ShopRow['plan']) ?? 'free_trial',
    plan_until: (raw.plan_until as string | null) ?? null,
    active: Boolean(raw.active),
    featured: Boolean(raw.featured),
    category_label: (raw.category_label as string | null) ?? null,
    theme: parseTheme(raw.theme ?? DEFAULT_THEME),
    seo_title: (raw.seo_title as string | null) ?? null,
    seo_description: (raw.seo_description as string | null) ?? null,
    view_count: Number(raw.view_count ?? 0),
    instagram_url: (raw.instagram_url as string | null) ?? null,
    tiktok_url: (raw.tiktok_url as string | null) ?? null,
    website_url: (raw.website_url as string | null) ?? null,
    social_whatsapp_visible: raw.social_whatsapp_visible === true,
  }
}

export async function fetchShopBySlug(
  supabase: SupabaseClient,
  slug: string,
): Promise<ShopRow | null> {
  const { data, error } = await supabase
    .from('shops')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()

  if (error || !data) return null
  return mapShopRow(data as Record<string, unknown>)
}

export async function fetchFeaturedShops(supabase: SupabaseClient, limit = 12): Promise<ShopRow[]> {
  const { data } = await supabase
    .from('shops')
    .select('*')
    .eq('active', true)
    .order('featured', { ascending: false })
    .order('view_count', { ascending: false })
    .limit(Math.max(limit * 3, limit))

  const shops = (data ?? []).map((r) => mapShopRow(r as Record<string, unknown>))
  const pro = shops.filter((s) => s.plan === 'pro')
  const rest = shops.filter((s) => s.plan !== 'pro')
  return [...pro, ...rest].slice(0, limit)
}

export async function fetchUserShops(supabase: SupabaseClient): Promise<ShopRow[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data: members } = await supabase
    .from('shop_members')
    .select('shop_id')
    .eq('user_id', user.id)

  const ids = (members ?? []).map((m) => m.shop_id as string)
  if (ids.length === 0) return []

  const { data } = await supabase.from('shops').select('*').in('id', ids)
  return (data ?? []).map((r) => mapShopRow(r as Record<string, unknown>))
}

export function buildWhatsAppUrl(digits: string, text?: string): string {
  const d = digits.replace(/\D/g, '')
  const base = `https://wa.me/${d}`
  if (!text?.trim()) return base
  return `${base}?text=${encodeURIComponent(text)}`
}
