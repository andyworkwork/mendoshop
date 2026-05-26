import { getMarketingDashboardAdmin } from '@/app/actions/admin-marketing'
import { AdminMarketingPanel } from '@/components/admin-marketing-panel'
import { AdminPageHeader } from '@/components/admin-page-header'
import type {
  MarketingAsset,
  MarketingCampaign,
  MarketingPost,
  MarketingPostTemplate,
} from '@/lib/marketing'

export default async function AdminMarketingPage() {
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
      <AdminPageHeader description="Biblioteca de contenido, plantillas, publicaciones y enlaces UTM para Facebook, Instagram y TikTok." />
      <AdminMarketingPanel
        initialAssets={data.assets as MarketingAsset[]}
        initialTemplates={data.templates as MarketingPostTemplate[]}
        initialPosts={data.posts as MarketingPost[]}
        initialCampaigns={data.campaigns as MarketingCampaign[]}
        initialShops={data.shops as { id: string; name: string; slug: string; category_label: string | null }[]}
      />
    </div>
  )
}
