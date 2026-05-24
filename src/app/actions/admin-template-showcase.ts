'use server'

import type { AdminActionResult } from '@/app/actions/admin'
import { isPlatformAdmin } from '@/lib/admin'
import { createServiceClient } from '@/lib/supabase/service'
import { revalidatePath } from 'next/cache'

async function assertAdmin(): Promise<{ error: string } | null> {
  if (!(await isPlatformAdmin())) {
    return { error: 'No tenés permisos de administrador.' }
  }
  return null
}

export type TemplateShowcaseInput = {
  shop_name?: string | null
  tagline?: string | null
  banner_path?: string | null
  product_1_name?: string | null
  product_1_price?: number | null
  product_1_image_path?: string | null
  product_2_name?: string | null
  product_2_price?: number | null
  product_2_image_path?: string | null
}

export async function listTemplateShowcaseAdmin(): Promise<
  { rows: Record<string, TemplateShowcaseInput> } | { error: string }
> {
  const denied = await assertAdmin()
  if (denied) return denied

  const service = createServiceClient()
  const { data, error } = await service.from('template_showcase').select('*')
  if (error) return { error: error.message }

  const rows: Record<string, TemplateShowcaseInput> = {}
  for (const r of data ?? []) {
    rows[r.template_id as string] = {
      shop_name: r.shop_name as string | null,
      tagline: r.tagline as string | null,
      banner_path: r.banner_path as string | null,
      product_1_name: r.product_1_name as string | null,
      product_1_price: r.product_1_price != null ? Number(r.product_1_price) : null,
      product_1_image_path: r.product_1_image_path as string | null,
      product_2_name: r.product_2_name as string | null,
      product_2_price: r.product_2_price != null ? Number(r.product_2_price) : null,
      product_2_image_path: r.product_2_image_path as string | null,
    }
  }
  return { rows }
}

export async function saveTemplateShowcaseAdmin(
  templateId: string,
  input: TemplateShowcaseInput,
): Promise<AdminActionResult> {
  const denied = await assertAdmin()
  if (denied) return denied

  const service = createServiceClient()
  const { error } = await service.from('template_showcase').upsert(
    {
      template_id: templateId,
      shop_name: input.shop_name?.trim() || null,
      tagline: input.tagline?.trim() || null,
      banner_path: input.banner_path ?? null,
      product_1_name: input.product_1_name?.trim() || null,
      product_1_price: input.product_1_price ?? null,
      product_1_image_path: input.product_1_image_path ?? null,
      product_2_name: input.product_2_name?.trim() || null,
      product_2_price: input.product_2_price ?? null,
      product_2_image_path: input.product_2_image_path ?? null,
    },
    { onConflict: 'template_id' },
  )

  if (error) return { error: error.message }

  revalidatePath('/')
  revalidatePath('/admin/plantillas')
  return { ok: true }
}

export async function clearTemplateShowcaseImageAdmin(
  templateId: string,
  field: 'banner_path' | 'product_1_image_path' | 'product_2_image_path',
): Promise<AdminActionResult> {
  const denied = await assertAdmin()
  if (denied) return denied

  const service = createServiceClient()
  const { data: row } = await service
    .from('template_showcase')
    .select('*')
    .eq('template_id', templateId)
    .maybeSingle()

  const patch: TemplateShowcaseInput = row
    ? {
        shop_name: row.shop_name as string | null,
        tagline: row.tagline as string | null,
        banner_path: row.banner_path as string | null,
        product_1_name: row.product_1_name as string | null,
        product_1_price: row.product_1_price != null ? Number(row.product_1_price) : null,
        product_1_image_path: row.product_1_image_path as string | null,
        product_2_name: row.product_2_name as string | null,
        product_2_price: row.product_2_price != null ? Number(row.product_2_price) : null,
        product_2_image_path: row.product_2_image_path as string | null,
        [field]: null,
      }
    : { [field]: null }

  return saveTemplateShowcaseAdmin(templateId, patch)
}
