import type { ShopPlan } from '@/types/shop'

export type PlanLimits = {
  maxProducts: number
  maxImagesPerProduct: number
  maxStorageMb: number
  showPoweredBy: boolean
}

export const PLAN_LIMITS: Record<ShopPlan, PlanLimits> = {
  free_trial: {
    maxProducts: 15,
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
