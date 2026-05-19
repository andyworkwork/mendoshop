import { LoginForm } from '@/components/auth-forms'
import { SiteHeader } from '@/components/site-header'

type Props = { searchParams: Promise<{ next?: string }> }

export default async function LoginPage({ searchParams }: Props) {
  const { next } = await searchParams
  const redirectTo = next?.startsWith('/') ? next : '/dashboard'

  return (
    <div className="min-h-screen mendoshop-page-bg">
      <SiteHeader />
      <main className="px-4 py-12">
        <LoginForm redirectTo={redirectTo} />
      </main>
    </div>
  )
}
