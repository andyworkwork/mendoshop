'use client'

import { DashboardOnboardingStepCard } from '@/components/dashboard-onboarding-step-card'
import { useTemplateOnboardingDone } from '@/hooks/use-template-onboarding-done'

type Props = {
  shopId: string
  productCount: number
  templateOnboardingDone?: boolean
}

export function DashboardNextStepCta({
  shopId,
  productCount,
  templateOnboardingDone = false,
}: Props) {
  const { done } = useTemplateOnboardingDone(shopId, templateOnboardingDone)

  if (productCount > 0 || !done) return null

  return (
    <DashboardOnboardingStepCard
      stepLabel="Tu siguiente paso"
      href="/dashboard/catalog"
      buttonLabel="Creá categorías y subí productos →"
    />
  )
}
