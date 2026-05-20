import type { ShopPlan } from '@/types/shop'

export type PlanLimits = {
  maxProducts: number
  maxImagesPerProduct: number
  maxStorageMb: number
  showPoweredBy: boolean
}

export const PLAN_LIMITS: Record<ShopPlan, PlanLimits> = {
  free_trial: {
    maxProducts: 30,
    maxImagesPerProduct: 2,
    maxStorageMb: 50,
    showPoweredBy: true,
  },
  basic: {
    maxProducts: 60,
    maxImagesPerProduct: 4,
    maxStorageMb: 200,
    showPoweredBy: true,
  },
  pro: {
    maxProducts: 300,
    maxImagesPerProduct: 8,
    maxStorageMb: 1024,
    showPoweredBy: false,
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

export function isShopSubscriptionActive(planUntil: string | null): boolean {
  if (!planUntil) return true
  return new Date(planUntil) > new Date()
}

/** Días restantes hasta plan_until (0 si venció). null si no hay fecha de corte. */
export function planDaysRemaining(planUntil: string | null): number | null {
  if (!planUntil) return null
  const end = new Date(planUntil)
  const ms = end.getTime() - Date.now()
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)))
}

export function formatPlanUntil(planUntil: string | null): string | null {
  if (!planUntil) return null
  return new Date(planUntil).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export const PLAN_CATALOG: {
  id: ShopPlan
  name: string
  summary: string
  features: string[]
}[] = [
  {
    id: 'free_trial',
    name: 'Prueba gratis',
    summary: 'Para probar Mendoshop con tu catálogo real.',
    features: ['30 productos', '2 fotos por producto', 'Período de prueba con fecha de vencimiento'],
  },
  {
    id: 'basic',
    name: 'Básico',
    summary: 'Para tiendas en crecimiento.',
    features: ['60 productos', '4 fotos por producto', 'Más espacio para imágenes'],
  },
  {
    id: 'pro',
    name: 'Pro',
    summary: 'Catálogo amplio sin límites ajustados.',
    features: ['300 productos', '8 fotos por producto', 'Máximo almacenamiento'],
  },
]
