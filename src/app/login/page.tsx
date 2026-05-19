import { LoginForm } from '@/components/auth-forms'
import { MendoshopPageBackground } from '@/components/mendoshop-page-background'
import { SiteHeader } from '@/components/site-header'

type Props = { searchParams: Promise<{ next?: string }> }

export default async function LoginPage({ searchParams }: Props) {
  const { next } = await searchParams
  const redirectTo = next?.startsWith('/') ? next : '/dashboard'

  return (
    <div className="relative min-h-screen mendoshop-page-bg">
      <MendoshopPageBackground />
      <div className="relative z-10">
        <SiteHeader />
      </div>
      <main className="relative z-10 px-4 py-12">
        <LoginForm redirectTo={redirectTo} />
      </main>
    </div>
  )
}
