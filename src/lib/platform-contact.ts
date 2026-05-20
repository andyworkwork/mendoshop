import { formatMoneyArs } from '@/lib/format'
import { buildWhatsAppUrl } from '@/lib/shops'
import { planDaysRemaining, planLabel, PLAN_PRICES_ARS, PLAN_SUBSCRIPTION_DAYS } from '@/lib/plans'
import type { PaidShopPlan } from '@/lib/plan-payments'
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
  targetPlan: PaidShopPlan,
): string {
  const price = formatMoneyArs(PLAN_PRICES_ARS[targetPlan])
  return [
    `Hola! Soy *${shop.name}* en Mendoshop.`,
    `Quiero contratar el plan *${planLabel(targetPlan)}* (${price}, ${PLAN_SUBSCRIPTION_DAYS} días).`,
    `Mi plan actual es *${planLabel(shop.plan)}*.`,
  ].join('\n')
}

export function planPurchaseWhatsAppUrl(
  shop: Pick<ShopRow, 'name' | 'plan' | 'plan_until'>,
  targetPlan: PaidShopPlan,
): string {
  return buildWhatsAppUrl(
    MENDOSHOP_SUPPORT_WHATSAPP,
    buildPlanPurchaseWhatsAppMessage(shop, targetPlan),
  )
}

export function planPurchaseButtonLabel(
  targetPlan: PaidShopPlan,
  currentPlan: ShopRow['plan'],
): string | null {
  if (currentPlan === 'pro' && targetPlan === 'basic') return null
  if (currentPlan === targetPlan) return `Renovar plan ${planLabel(targetPlan)}`
  if (currentPlan === 'free_trial') return `Adquirir plan ${planLabel(targetPlan)}`
  return `Pasar a plan ${planLabel(targetPlan)}`
}
