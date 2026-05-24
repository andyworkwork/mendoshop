import { getPublicUrlFromPath } from '@/lib/publicUrl'
import { getProductImageUrl } from '@/lib/product-images'
import { getTemplateShowcaseMock } from '@/lib/template-showcase-mock'
import type { StoreTemplate } from '@/lib/store-templates'
import { templateBannerSrc } from '@/lib/store-templates'
import { createServiceClient } from '@/lib/supabase/service'

export type TemplateShowcaseRow = {
  template_id: string
  shop_name: string | null
  tagline: string | null
  banner_path: string | null
  product_1_name: string | null
  product_1_price: number | null
  product_1_image_path: string | null
  product_2_name: string | null
  product_2_price: number | null
  product_2_image_path: string | null
}

export type ResolvedTemplateShowcase = {
  templateId: string
  shopName: string
  tagline: string
  bannerUrl: string
  products: { name: string; price: number; imageUrl: string | null }[]
}

function productImageUrl(path: string | null | undefined): string | null {
  if (!path) return null
  return getProductImageUrl(path, 'thumb') ?? getPublicUrlFromPath(path)
}

export function resolveTemplateShowcase(
  template: StoreTemplate,
  row: TemplateShowcaseRow | null | undefined,
): ResolvedTemplateShowcase {
  const mock = getTemplateShowcaseMock(template)
  const bannerDefault = templateBannerSrc(template.id) ?? template.bannerSrc

  const p1Name = row?.product_1_name?.trim() || mock.products[0]?.name || 'Producto 1'
  const p2Name = row?.product_2_name?.trim() || mock.products[1]?.name || 'Producto 2'
  const p1Price =
    row?.product_1_price != null && Number.isFinite(Number(row.product_1_price))
      ? Number(row.product_1_price)
      : (mock.products[0]?.price ?? 9900)
  const p2Price =
    row?.product_2_price != null && Number.isFinite(Number(row.product_2_price))
      ? Number(row.product_2_price)
      : (mock.products[1]?.price ?? 14900)

  const bannerUrl = row?.banner_path
    ? (getPublicUrlFromPath(row.banner_path) ?? bannerDefault)
    : bannerDefault

  return {
    templateId: template.id,
    shopName: row?.shop_name?.trim() || mock.shopName,
    tagline: row?.tagline?.trim() || mock.tagline,
    bannerUrl,
    products: [
      {
        name: p1Name,
        price: p1Price,
        imageUrl: productImageUrl(row?.product_1_image_path),
      },
      {
        name: p2Name,
        price: p2Price,
        imageUrl: productImageUrl(row?.product_2_image_path),
      },
    ],
  }
}

export async function fetchTemplateShowcaseMap(): Promise<Map<string, TemplateShowcaseRow>> {
  const supabase = createServiceClient()
  const { data, error } = await supabase.from('template_showcase').select('*')
  if (error) {
    console.error('fetchTemplateShowcaseMap', error.message)
    return new Map()
  }
  return new Map((data ?? []).map((r) => [r.template_id as string, r as TemplateShowcaseRow]))
}

export function buildResolvedShowcases(
  templates: StoreTemplate[],
  rows: Map<string, TemplateShowcaseRow>,
): { template: StoreTemplate; showcase: ResolvedTemplateShowcase }[] {
  return templates.map((template) => ({
    template,
    showcase: resolveTemplateShowcase(template, rows.get(template.id)),
  }))
}
