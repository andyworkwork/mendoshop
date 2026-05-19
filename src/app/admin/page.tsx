import { AdminCreateShopForm } from '@/components/admin-create-shop-form'
import { AdminShopsTable } from '@/components/admin-shops-table'
import { listShopsForAdmin } from '@/app/actions/admin'

export default async function AdminPage() {
  const shops = await listShopsForAdmin()

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-white">Administración Mendoshop</h1>
        <p className="mt-1 text-zinc-400">
          Creá cuentas y tiendas para comercios. Ellos entran con el email y contraseña que definas.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,420px)_1fr]">
        <AdminCreateShopForm />
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Todas las tiendas ({shops.length})</h2>
          <AdminShopsTable shops={shops} />
        </div>
      </div>
    </div>
  )
}
