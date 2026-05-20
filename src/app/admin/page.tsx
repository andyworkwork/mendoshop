import { AdminCreateShopForm } from '@/components/admin-create-shop-form'
import { AdminShopsTable } from '@/components/admin-shops-table'
import { listShopsForAdmin } from '@/app/actions/admin'

export default async function AdminPage() {
  const shops = await listShopsForAdmin()

  return (
    <div className="space-y-8 sm:space-y-10">
      <div>
        <h1 className="text-xl font-bold text-white sm:text-2xl">Administración Mendoshop</h1>
        <p className="mt-1 text-sm text-zinc-400 sm:text-base">
          Creá cuentas y tiendas para comercios. Ellos entran con el email y contraseña que definas.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr] lg:gap-8">
        <AdminCreateShopForm />
        <div className="min-w-0 space-y-4">
          <h2 className="text-base font-semibold text-white sm:text-lg">
            Todas las tiendas ({shops.length})
          </h2>
          <p className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-xs text-zinc-400">
            <span className="font-medium text-zinc-300">Destacada:</span> la tienda sube de posición en el
            listado de la página principal de Mendoshop (antes que las no destacadas). Las tiendas Pro también
            tienen prioridad extra en ese listado.
          </p>
          <AdminShopsTable shops={shops} />
        </div>
      </div>
    </div>
  )
}
