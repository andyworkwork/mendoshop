import { RegisterForm } from '@/components/auth-forms'
import { MendoshopPageBackground } from '@/components/mendoshop-page-background'
import { SiteHeader } from '@/components/site-header'

type Props = { searchParams: Promise<{ ref?: string }> }

export default async function RegistroPage({ searchParams }: Props) {
  const { ref } = await searchParams
  return (
    <div className="relative min-h-screen mendoshop-page-bg">
      <MendoshopPageBackground />
      <div className="relative z-10">
        <SiteHeader />
      </div>
      <main className="relative z-10 px-4 py-12">
        <RegisterForm referralSlug={ref} />
      </main>
    </div>
  )
}
