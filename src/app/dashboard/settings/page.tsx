import { ShopSettingsForm } from '@/components/shop-settings-form'
import { requireDashboardShop } from '@/lib/dashboard'

export default async function DashboardSettingsPage() {
  const shop = await requireDashboardShop()
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Ajustes</h1>
      <ShopSettingsForm shop={shop} />
    </div>
  )
}
