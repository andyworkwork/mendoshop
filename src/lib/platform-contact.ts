import { buildWhatsAppUrl } from '@/lib/shops'
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
