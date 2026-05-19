import { DashboardShell } from '@/components/dashboard-shell'
import { requireDashboardShop } from '@/lib/dashboard'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const shop = await requireDashboardShop()
  return <DashboardShell shop={shop}>{children}</DashboardShell>
}
