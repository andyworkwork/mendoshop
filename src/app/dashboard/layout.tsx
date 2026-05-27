import { DashboardShell } from '@/components/dashboard-shell'
import { getAuthUserEmail, isPlatformAdmin } from '@/lib/admin'
import { requireDashboardShop } from '@/lib/dashboard'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const shop = await requireDashboardShop()
  const [platformAdmin, userEmail] = await Promise.all([isPlatformAdmin(), getAuthUserEmail()])
  return (
    <DashboardShell shop={shop} platformAdmin={platformAdmin} userEmail={userEmail ?? ''}>
      {children}
    </DashboardShell>
  )
}
