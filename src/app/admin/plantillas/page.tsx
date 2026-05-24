import { listTemplateShowcaseAdmin } from '@/app/actions/admin-template-showcase'
import { AdminPageHeader } from '@/components/admin-page-header'
import { AdminTemplateShowcaseEditor } from '@/components/admin-template-showcase-editor'

export default async function AdminPlantillasPage() {
  const data = await listTemplateShowcaseAdmin()
  const initialRows = 'rows' in data ? data.rows : {}

  return (
    <div className="space-y-6">
      <AdminPageHeader description="Carrusel de la home: vitrinas de ejemplo por rubro con tus propias fotos." />
      {'error' in data && (
        <p className="text-sm text-red-400" role="alert">
          {data.error}
        </p>
      )}
      <AdminTemplateShowcaseEditor initialRows={initialRows} />
    </div>
  )
}
