import { formatMoneyArs } from '@/lib/format'
import { buildWhatsAppUrl } from '@/lib/shops'
import { CHECKOUT_PRODUCTS, checkoutProductLabel, type PlanCheckoutProduct } from '@/lib/plan-checkout'
import { planDaysRemaining, planLabel } from '@/lib/plans'
import type { ShopRow } from '@/types/shop'

/** WhatsApp de soporte Mendoshop (renovaciones, planes). */
export const MENDOSHOP_SUPPORT_WHATSAPP =
  process.env.NEXT_PUBLIC_MENDOSHOP_SUPPORT_WHATSAPP?.replace(/\D/g, '') || '5492612733660'

export function buildSupportWhatsAppMessage(shop: Pick<ShopRow, 'name' | 'plan' | 'plan_until'>): string {
  const days = planDaysRemaining(shop.plan_until)
  const daysLine =
    days === null
      ? ''
      : days === 0
        ? 'Mi período ya venció o vence hoy.'
        : `Me quedan ${days} día(s) de vigencia.`

  return [
    `Hola! Soy *${shop.name}* en Mendoshop.`,
    `Mi plan actual es *${planLabel(shop.plan)}*.`,
    daysLine,
    '',
    'Quiero consultar por renovación, más días o cambio de plan.',
  ]
    .filter(Boolean)
    .join('\n')
}

export function supportWhatsAppUrl(shop: Pick<ShopRow, 'name' | 'plan' | 'plan_until'>): string {
  return buildWhatsAppUrl(MENDOSHOP_SUPPORT_WHATSAPP, buildSupportWhatsAppMessage(shop))
}

export function buildPlanPurchaseWhatsAppMessage(
  shop: Pick<ShopRow, 'name' | 'plan'>,
  product: PlanCheckoutProduct,
): string {
  const meta = CHECKOUT_PRODUCTS[product]
  const price = formatMoneyArs(meta.priceArs, meta.priceArs < 1 ? 2 : undefined)
  return [
    `Hola! Soy *${shop.name}* en Mendoshop.`,
    `Quiero *${checkoutProductLabel(product)}* (${price}, +${meta.daysAdded} día${meta.daysAdded === 1 ? '' : 's'}).`,
    `Mi plan actual es *${planLabel(shop.plan)}*.`,
  ].join('\n')
}

export function planPurchaseWhatsAppUrl(
  shop: Pick<ShopRow, 'name' | 'plan' | 'plan_until'>,
  product: PlanCheckoutProduct,
): string {
  return buildWhatsAppUrl(
    MENDOSHOP_SUPPORT_WHATSAPP,
    buildPlanPurchaseWhatsAppMessage(shop, product),
  )
}

export function planPurchaseButtonLabel(
  product: PlanCheckoutProduct,
  currentPlan: ShopRow['plan'],
): string | null {
  if (product === 'test_andy') return 'Probar pago real'
  if (currentPlan === 'pro' && product === 'basic') return null
  if (currentPlan === product) return `Renovar plan ${planLabel(product)}`
  if (currentPlan === 'free_trial') return `Adquirir plan ${planLabel(product)}`
  return `Pasar a plan ${planLabel(product)}`
}
