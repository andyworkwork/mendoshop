import { QrPanel } from '@/components/qr-panel'
import { requireDashboardShop } from '@/lib/dashboard'

export default async function DashboardQrPage() {
  const shop = await requireDashboardShop()
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Código QR</h1>
      <QrPanel slug={shop.slug} shopName={shop.name} />
    </div>
  )
}
