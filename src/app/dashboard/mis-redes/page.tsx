import { MisRedesPanel } from '@/components/mis-redes-panel'
import { requireDashboardShop } from '@/lib/dashboard'

export default async function DashboardMisRedesPage() {
  const shop = await requireDashboardShop()
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Mis redes</h1>
      <p className="text-sm text-zinc-400">
        Compartí tu tienda, descargá el QR y configurá los enlaces que ven tus clientes.
      </p>
      <MisRedesPanel shop={shop} />
    </div>
  )
}
