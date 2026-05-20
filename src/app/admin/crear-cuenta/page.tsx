import { AdminCreateShopForm } from '@/components/admin-create-shop-form'
import { AdminPageHeader } from '@/components/admin-page-header'

export default function AdminCrearCuentaPage() {
  return (
    <div className="space-y-6 sm:space-y-8">
      <AdminPageHeader description="Creá usuario, tienda y contraseña para un comercio nuevo." />

      <section className="mx-auto max-w-lg space-y-4">
        <h2 className="text-base font-semibold text-white sm:text-lg">Crear cuenta</h2>
        <p className="text-sm text-zinc-400">
          El comercio entra con el email y la contraseña que definas. Podés asignar plan de prueba o de
          pago desde el primer día.
        </p>
        <AdminCreateShopForm />
      </section>
    </div>
  )
}
