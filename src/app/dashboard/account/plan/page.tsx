import { Suspense } from 'react'
import { mercadoPagoPaymentsEnabled, syncPendingPlanQrPaymentsForShop } from '@/app/actions/billing'
import { PlanPaymentNotice } from '@/components/plan-payment-notice'
import { ShopAccountPanel } from '@/components/shop-account-panel'
import { ShopPlanGrantNotices } from '@/components/shop-plan-grant-notices'
import { isPlatformAdmin } from '@/lib/admin'
import { requireDashboardShop } from '@/lib/dashboard'
import { fetchUnseenPlanGrants, markPlanGrantsSeen } from '@/lib/plan-grants'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardAccountPlanPage() {
  await syncPendingPlanQrPaymentsForShop()
  const shop = await requireDashboardShop()
  const mercadoPagoEnabled = await mercadoPagoPaymentsEnabled()
  const showTestPlan = await isPlatformAdmin()
  const supabase = await createClient()
  const planGrants = await fetchUnseenPlanGrants(supabase, shop.id)
  if (planGrants.length > 0) {
    await markPlanGrantsSeen(
      supabase,
      planGrants.map((g) => g.id),
    )
  }

  return (
    <div className="space-y-4">
      <Suspense fallback={null}>
        <PlanPaymentNotice />
      </Suspense>
      <ShopPlanGrantNotices grants={planGrants} />
      <ShopAccountPanel
        shop={shop}
        mercadoPagoEnabled={mercadoPagoEnabled}
        showTestPlan={showTestPlan}
      />
    </div>
  )
}
