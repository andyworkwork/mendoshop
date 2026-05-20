import { ShopAccountPanel } from '@/components/shop-account-panel'
import { requireDashboardShop } from '@/lib/dashboard'

export default async function DashboardAccountPage() {
  const shop = await requireDashboardShop()
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Cuenta</h1>
      <p className="text-sm text-zinc-400">Plan, vigencia y contacto con Mendoshop.</p>
      <ShopAccountPanel shop={shop} />
    </div>
  )
}
