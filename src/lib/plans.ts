import type { ShopPlan } from '@/types/shop'

export type PlanLimits = {
  maxProducts: number
  maxImagesPerProduct: number
  maxStorageMb: number
  showPoweredBy: boolean
  /** Máximo de íconos de redes en el pie de la tienda pública. */
  maxSocialLinks: number
  viewCount: boolean
  featuredPriority: boolean
}

export const PLAN_LIMITS: Record<ShopPlan, PlanLimits> = {
  free_trial: {
    maxProducts: 30,
    maxImagesPerProduct: 2,
    maxStorageMb: 50,
    showPoweredBy: true,
    maxSocialLinks: 0,
    viewCount: false,
    featuredPriority: false,
  },
  basic: {
    maxProducts: 30,
    maxImagesPerProduct: 4,
    maxStorageMb: 200,
    showPoweredBy: true,
    maxSocialLinks: 2,
    viewCount: false,
    featuredPriority: false,
  },
  pro: {
    maxProducts: 80,
    maxImagesPerProduct: 8,
    maxStorageMb: 1024,
    showPoweredBy: false,
    maxSocialLinks: 4,
    viewCount: true,
    featuredPriority: true,
  },
}

export function planLabel(plan: ShopPlan): string {
  switch (plan) {
    case 'free_trial':
      return 'Prueba gratis'
    case 'basic':
      return 'Básico'
    case 'pro':
      return 'Pro'
  }
}

export function planHasViewCount(plan: ShopPlan): boolean {
  return PLAN_LIMITS[plan].viewCount
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function parsePlanEndDate(planUntil: string): Date | null {
  const end = new Date(planUntil)
  if (Number.isNaN(end.getTime())) return null
  return end
}

/** Vigente hasta el final del día de vencimiento (hora local). */
export function isShopSubscriptionActive(planUntil: string | null): boolean {
  if (!planUntil) return true
  const end = parsePlanEndDate(planUntil)
  if (!end) return true
  const endOfDay = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59, 999)
  return Date.now() <= endOfDay.getTime()
}

/**
 * Días de calendario restantes (incluye hoy si aún no venció).
 * Ej.: hoy 19 may, vence 1 jun → 13 días (no 14 por redondeo de horas).
 */
export function planDaysRemaining(planUntil: string | null): number | null {
  if (!planUntil) return null
  const end = parsePlanEndDate(planUntil)
  if (!end) return null
  const today = startOfLocalDay(new Date())
  const endDay = startOfLocalDay(end)
  const diff = Math.round((endDay.getTime() - today.getTime()) / 86_400_000)
  return Math.max(0, diff)
}

/** Suma días de calendario a la vigencia actual (o desde hoy si venció o no hay fecha). */
export function extendPlanUntil(planUntil: string | null, daysToAdd: number): string {
  const days = Math.max(1, Math.floor(daysToAdd))
  const today = startOfLocalDay(new Date())
  let baseDay = today

  if (planUntil) {
    const end = parsePlanEndDate(planUntil)
    if (end) {
      const endDay = startOfLocalDay(end)
      baseDay = endDay.getTime() >= today.getTime() ? endDay : today
    }
  }

  const newEndDay = new Date(baseDay)
  newEndDay.setDate(newEndDay.getDate() + days)
  const endOfDay = new Date(
    newEndDay.getFullYear(),
    newEndDay.getMonth(),
    newEndDay.getDate(),
    23,
    59,
    59,
    999,
  )
  return endOfDay.toISOString()
}

export function formatPlanUntil(planUntil: string | null): string | null {
  if (!planUntil) return null
  const end = parsePlanEndDate(planUntil)
  if (!end) return null
  return end.toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/** Días de vigencia incluidos al contratar o renovar Básico / Pro. */
export const PLAN_SUBSCRIPTION_DAYS = 30

/** Precio mensual en pesos argentinos (planes de pago). */
export const PLAN_PRICES_ARS = {
  basic: 9_999,
  pro: 20_999,
} as const satisfies Record<Exclude<ShopPlan, 'free_trial'>, number>

/** Bullets de marketing compartidos (panel, precios, checkout). */
export function planMarketingFeatures(plan: ShopPlan): string[] {
  switch (plan) {
    case 'free_trial':
      return ['30 productos', '7 días de prueba', '2 productos destacados (grilla)']
    case 'basic':
      return [
        '30 productos',
        '30 días de tienda',
        '2 productos destacados (grilla)',
        'Soporte técnico',
        '2 links a redes en el pie',
      ]
    case 'pro':
      return [
        'Hasta 80 productos',
        '30 días de tienda',
        'Carrusel con hasta 4 productos destacados',
        '4 links a redes en el pie',
        'Prioridad en el directorio Mendoshop',
        'Contador de visitas y productos más consultados',
        'Sin marca Mendoshop en el pie',
      ]
  }
}

export const PLAN_CATALOG: {
  id: ShopPlan
  name: string
  summary: string
  priceArs: number | null
  features: string[]
}[] = [
  {
    id: 'free_trial',
    name: 'Prueba gratis',
    summary: 'Para probar Mendoshop con tu catálogo real.',
    priceArs: null,
    features: planMarketingFeatures('free_trial'),
  },
  {
    id: 'basic',
    name: 'Básico',
    summary: 'Tu tienda online con lo esencial para vender por WhatsApp.',
    priceArs: PLAN_PRICES_ARS.basic,
    features: planMarketingFeatures('basic'),
  },
  {
    id: 'pro',
    name: 'Pro',
    summary: 'Más catálogo, visibilidad y herramientas para crecer.',
    priceArs: PLAN_PRICES_ARS.pro,
    features: planMarketingFeatures('pro'),
  },
]
