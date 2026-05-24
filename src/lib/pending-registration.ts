export type PendingShopRegistration = {
  shopName: string
  slug: string
  whatsapp: string
  rubro: string
  referralSlug: string | null
}

export function pendingShopFromMetadata(
  meta: Record<string, unknown> | undefined,
): Partial<PendingShopRegistration> {
  if (!meta) return {}
  return {
    shopName: typeof meta.pending_shop_name === 'string' ? meta.pending_shop_name : undefined,
    slug: typeof meta.pending_shop_slug === 'string' ? meta.pending_shop_slug : undefined,
    whatsapp: typeof meta.pending_whatsapp === 'string' ? meta.pending_whatsapp : undefined,
    rubro: typeof meta.pending_rubro === 'string' ? meta.pending_rubro : undefined,
    referralSlug:
      typeof meta.pending_ref === 'string' && meta.pending_ref.length >= 3 ? meta.pending_ref : null,
  }
}

export function isPendingShopComplete(
  partial: Partial<PendingShopRegistration>,
): partial is PendingShopRegistration {
  const slug = partial.slug?.trim() ?? ''
  const wa = partial.whatsapp?.replace(/\D/g, '') ?? ''
  return Boolean(partial.shopName?.trim() && slug.length >= 3 && wa.length >= 10)
}

export function pendingShopToUserMetadata(input: PendingShopRegistration) {
  return {
    pending_shop_name: input.shopName.trim(),
    pending_shop_slug: input.slug,
    pending_whatsapp: input.whatsapp,
    pending_rubro: input.rubro.trim() || null,
    pending_ref: input.referralSlug,
  }
}
