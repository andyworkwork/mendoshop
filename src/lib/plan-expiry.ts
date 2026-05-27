import { isShopSubscriptionActive, planDaysRemaining } from '@/lib/plans'

export type PlanExpiryNotice = {
  daysLeft: number
  urgent: boolean
  expired: boolean
}

/** Aviso si faltan ≤4 días o ya venció (con plan_until definido). */
export function planExpiryNotice(planUntil: string | null): PlanExpiryNotice | null {
  if (!planUntil) return null
  const active = isShopSubscriptionActive(planUntil)
  const daysLeft = planDaysRemaining(planUntil)
  if (daysLeft == null) return null
  if (!active) {
    return { daysLeft: 0, urgent: true, expired: true }
  }
  if (daysLeft <= 4) {
    return { daysLeft, urgent: daysLeft <= 1, expired: false }
  }
  return null
}
