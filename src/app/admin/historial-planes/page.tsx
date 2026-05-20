import { listGlobalPlanActivityForAdmin } from '@/app/actions/admin'
import { AdminGlobalPlanHistory } from '@/components/admin-global-plan-history'
import { AdminPageHeader } from '@/components/admin-page-header'

export default async function AdminHistorialPlanesPage() {
  const result = await listGlobalPlanActivityForAdmin()

  return (
    <div className="space-y-6 sm:space-y-8">
      <AdminPageHeader description="Revisá intentos de pago y cambios de plan en todas las cuentas." />

      <section className="space-y-4">
        <h2 className="text-base font-semibold text-white sm:text-lg">Historial de planes</h2>
        <p className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-xs text-zinc-400">
          <span className="font-medium text-amber-300">Revisar:</span> pagos pendientes o rechazados,
          muchos intentos seguidos, o cambios de plan sin días. Los pendientes abandonados pasan a
          cancelados a los 5 minutos.
        </p>
        {'error' in result ? (
          <p className="text-sm text-red-400" role="alert">
            {result.error}
          </p>
        ) : (
          <AdminGlobalPlanHistory entries={result} />
        )}
      </section>
    </div>
  )
}
