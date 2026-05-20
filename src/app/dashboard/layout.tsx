import { DashboardShell } from '@/components/dashboard-shell'
import { isPlatformAdmin } from '@/lib/admin'
import { requireDashboardShop } from '@/lib/dashboard'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const shop = await requireDashboardShop()
  const platformAdmin = await isPlatformAdmin()
  return (
    <DashboardShell shop={shop} platformAdmin={platformAdmin}>
      {children}
    </DashboardShell>
  )
}
