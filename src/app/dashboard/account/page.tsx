import { Suspense } from 'react'
import { mercadoPagoPaymentsEnabled } from '@/app/actions/billing'
import { PlanPaymentNotice } from '@/components/plan-payment-notice'
import { ShopAccountPanel } from '@/components/shop-account-panel'
import { ShopPlanGrantNotices } from '@/components/shop-plan-grant-notices'
import { requireDashboardShop } from '@/lib/dashboard'
import { fetchUnseenPlanGrants, markPlanGrantsSeen } from '@/lib/plan-grants'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardAccountPage() {
  const shop = await requireDashboardShop()
  const mercadoPagoEnabled = await mercadoPagoPaymentsEnabled()
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
      <h1 className="text-2xl font-bold">Cuenta</h1>
      <p className="text-sm text-zinc-400">Plan, vigencia y contacto con Mendoshop.</p>
      <Suspense fallback={null}>
        <PlanPaymentNotice />
      </Suspense>
      <ShopPlanGrantNotices grants={planGrants} />
      <ShopAccountPanel shop={shop} mercadoPagoEnabled={mercadoPagoEnabled} />
    </div>
  )
}
