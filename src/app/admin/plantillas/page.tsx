import { listHomeCarouselAdmin } from '@/app/actions/admin-home-carousel'
import { listTemplateShowcaseAdmin } from '@/app/actions/admin-template-showcase'
import { AdminHomeCarouselPicker } from '@/components/admin-home-carousel-picker'
import { AdminPageHeader } from '@/components/admin-page-header'
import { AdminTemplateShowcaseEditor } from '@/components/admin-template-showcase-editor'

export default async function AdminPlantillasPage() {
  const [data, carousel] = await Promise.all([listTemplateShowcaseAdmin(), listHomeCarouselAdmin()])
  const initialRows = 'rows' in data ? data.rows : {}

  return (
    <div className="space-y-6">
      <AdminPageHeader description="Carrusel de la home: tiendas reales (hasta 7) y plantillas de relleno con tus fotos." />
      {'error' in carousel && (
        <p className="text-sm text-red-400" role="alert">
          {carousel.error}
        </p>
      )}
      {'shops' in carousel && (
        <AdminHomeCarouselPicker
          initialSelectedIds={carousel.selectedShopIds}
          initialShops={carousel.shops}
        />
      )}
      {'error' in data && (
        <p className="text-sm text-red-400" role="alert">
          {data.error}
        </p>
      )}
      <AdminTemplateShowcaseEditor initialRows={initialRows} />
    </div>
  )
}
