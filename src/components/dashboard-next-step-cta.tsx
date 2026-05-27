'use client'

import { useEffect, useState } from 'react'
import { DashboardOnboardingStepCard } from '@/components/dashboard-onboarding-step-card'
import { isFirstStepsDone } from '@/lib/first-steps'

type Props = {
  shopId: string
  productCount: number
}

export function DashboardNextStepCta({ shopId, productCount }: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(productCount === 0 && isFirstStepsDone(shopId))
  }, [shopId, productCount])

  if (!visible) return null

  return (
    <DashboardOnboardingStepCard
      stepLabel="Tu siguiente paso"
      href="/dashboard/catalog"
      buttonLabel="Creá categorías y subí productos →"
    />
  )
}
