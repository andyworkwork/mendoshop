'use client'

import { DashboardOnboardingStepCard } from '@/components/dashboard-onboarding-step-card'
import { useTemplateOnboardingDone } from '@/hooks/use-template-onboarding-done'

type Props = {
  shopId: string
  productCount: number
  templateOnboardingDone?: boolean
}

export function DashboardFirstStepsCta({
  shopId,
  productCount,
  templateOnboardingDone = false,
}: Props) {
  const { done } = useTemplateOnboardingDone(shopId, templateOnboardingDone)

  if (productCount > 0 || done) return null

  return (
    <DashboardOnboardingStepCard
      stepLabel="Tus primeros pasos"
      href="/dashboard/editar-tienda?open=appearance&first=1"
      buttonLabel="Elegí la plantilla de tu tienda →"
    />
  )
}
