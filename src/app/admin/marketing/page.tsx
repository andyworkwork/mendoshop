import { getMarketingDashboardAdmin } from '@/app/actions/admin-marketing'
import { AdminMarketingPanel } from '@/components/admin-marketing-panel'
import { AdminPageHeader } from '@/components/admin-page-header'
import type {
  MarketingAsset,
  MarketingCampaign,
  MarketingPost,
  MarketingPostTemplate,
} from '@/lib/marketing'
import type { MetaConnectionPublic } from '@/lib/meta-graph'
import type { MarketingCarouselSlidePayload } from '@/lib/marketing-carousel-slides'

type Props = {
  searchParams: Promise<{ meta?: string; reason?: string }>
}

function metaNotice(meta?: string, reason?: string): string | null {
  if (meta === 'connected') return 'Facebook e Instagram conectados correctamente.'
  if (meta === 'error') {
    if (reason === 'not_configured') return 'Meta no está configurado en el servidor.'
    if (reason === 'no_pages') return 'No encontramos Páginas de Facebook en tu cuenta.'
    if (reason === 'invalid_state') return 'La conexión expiró. Intentá de nuevo.'
    return reason ? `Error al conectar Meta: ${decodeURIComponent(reason)}` : 'Error al conectar Meta.'
  }
  return null
}

export default async function AdminMarketingPage({ searchParams }: Props) {
  const params = await searchParams
  const data = await getMarketingDashboardAdmin()

  if ('error' in data) {
    return (
      <div className="space-y-6">
        <AdminPageHeader description="Biblioteca de contenido, plantillas, publicaciones y enlaces UTM para redes sociales." />
        <p className="text-sm text-red-400" role="alert">
          {data.error}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader description="Biblioteca de contenido, plantillas, publicaciones y publicación automática en Facebook e Instagram." />
      <AdminMarketingPanel
        initialAssets={data.assets as MarketingAsset[]}
        initialTemplates={data.templates as MarketingPostTemplate[]}
        initialPosts={data.posts as MarketingPost[]}
        initialCampaigns={data.campaigns as MarketingCampaign[]}
        initialShops={data.shops as { id: string; name: string; slug: string; category_label: string | null }[]}
        initialCarouselSlides={data.carouselSlides as MarketingCarouselSlidePayload[]}
        metaConfigured={data.metaConfigured}
        metaConnection={data.metaConnection as MetaConnectionPublic | null}
        initialNotice={metaNotice(params.meta, params.reason)}
      />
    </div>
  )
}
