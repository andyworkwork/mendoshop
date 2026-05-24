'use server'

import type { AdminActionResult } from '@/app/actions/admin'
import { isPlatformAdmin } from '@/lib/admin'
import { HOME_CAROUSEL_MAX_SLIDES } from '@/lib/home-carousel'
import { isShopSubscriptionActive } from '@/lib/plans'
import { mapShopRow } from '@/lib/shops'
import { createServiceClient } from '@/lib/supabase/service'
import { revalidatePath } from 'next/cache'

async function assertAdmin(): Promise<{ error: string } | null> {
  if (!(await isPlatformAdmin())) {
    return { error: 'No tenés permisos de administrador.' }
  }
  return null
}

export type HomeCarouselShopOption = {
  id: string
  name: string
  slug: string
  plan: string
  eligible: boolean
}

export async function listHomeCarouselAdmin(): Promise<
  | { selectedShopIds: string[]; shops: HomeCarouselShopOption[] }
  | { error: string }
> {
  const denied = await assertAdmin()
  if (denied) return denied

  const service = createServiceClient()
  const [shopsRes, selectedRes] = await Promise.all([
    service
      .from('shops')
      .select('id, name, slug, plan, active, plan_until')
      .order('name', { ascending: true }),
    service
      .from('home_carousel_shops')
      .select('shop_id')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true }),
  ])

  if (shopsRes.error) return { error: shopsRes.error.message }

  const selectedShopIds = (selectedRes.data ?? []).map((r) => r.shop_id as string)
  const shops: HomeCarouselShopOption[] = (shopsRes.data ?? []).map((r) => {
    const row = mapShopRow(r as Record<string, unknown>)
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      plan: row.plan,
      eligible: row.active && isShopSubscriptionActive(row.plan_until),
    }
  })

  return { selectedShopIds, shops }
}

export async function saveHomeCarouselAdmin(shopIds: string[]): Promise<AdminActionResult> {
  const denied = await assertAdmin()
  if (denied) return denied

  const unique = [...new Set(shopIds)].slice(0, HOME_CAROUSEL_MAX_SLIDES)
  const service = createServiceClient()

  const { error: delErr } = await service.from('home_carousel_shops').delete().gte('sort_order', 0)
  if (delErr) return { error: delErr.message }

  if (unique.length === 0) {
    revalidatePath('/')
    revalidatePath('/admin/plantillas')
    return { ok: true }
  }

  const { data: validShops } = await service.from('shops').select('id, active, plan_until').in('id', unique)
  const eligible = new Set(
    (validShops ?? [])
      .filter((s) => s.active && isShopSubscriptionActive(s.plan_until as string | null))
      .map((s) => s.id as string),
  )
  const ordered = unique.filter((id) => eligible.has(id))

  const { error: insErr } = await service.from('home_carousel_shops').insert(
    ordered.map((shop_id, i) => ({ shop_id, sort_order: i })),
  )
  if (insErr) return { error: insErr.message }

  revalidatePath('/')
  revalidatePath('/admin/plantillas')
  return { ok: true }
}
