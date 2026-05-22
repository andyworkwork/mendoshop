import { getInfraUsageForAdmin } from '@/app/actions/admin'
import { AdminUsageDashboard } from '@/components/admin-usage-dashboard'
import { AdminPageHeader } from '@/components/admin-page-header'

export default async function AdminGastoPage() {
  const result = await getInfraUsageForAdmin()

  return (
    <div className="space-y-6 sm:space-y-8">
      <AdminPageHeader description="Consumo de infraestructura: Supabase, Storage y enlaces a egress/bandwidth." />

      <section className="space-y-4">
        <h2 className="text-base font-semibold text-white sm:text-lg">Gasto / uso</h2>
        {'error' in result ? (
          <p className="text-sm text-red-400" role="alert">
            {result.error}
          </p>
        ) : (
          <AdminUsageDashboard report={result} />
        )}
      </section>
    </div>
  )
}
