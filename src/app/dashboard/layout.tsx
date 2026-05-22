import { DashboardShell } from '@/components/dashboard-shell'
import { PlanExpiryBanner } from '@/components/plan-expiry-banner'
import { isPlatformAdmin } from '@/lib/admin'
import { requireDashboardShop } from '@/lib/dashboard'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const shop = await requireDashboardShop()
  const platformAdmin = await isPlatformAdmin()
  return (
    <DashboardShell shop={shop} platformAdmin={platformAdmin}>
      <div className="mb-6">
        <PlanExpiryBanner shop={shop} />
      </div>
      {children}
    </DashboardShell>
  )
}
