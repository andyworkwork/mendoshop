import { AdminPageHeader } from '@/components/admin-page-header'
import { AdminShopsTable } from '@/components/admin-shops-table'
import { listShopsForAdmin } from '@/app/actions/admin'

export default async function AdminPage() {
  const shops = await listShopsForAdmin()

  return (
    <div className="space-y-6 sm:space-y-8">
      <AdminPageHeader description="Gestioná tiendas, planes y estado de cada comercio." />

      <section className="min-w-0 space-y-4">
        <h2 className="text-base font-semibold text-white sm:text-lg">Todas las tiendas</h2>
        <p className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-xs text-zinc-400">
          <span className="font-medium text-zinc-300">Destacada:</span> la tienda sube de posición en el
          listado de la página principal de Mendoshop (antes que las no destacadas). Las tiendas Pro también
          tienen prioridad extra en ese listado.
        </p>
        <AdminShopsTable shops={shops} />
      </section>
    </div>
  )
}
