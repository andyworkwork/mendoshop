import { LoginForm } from '@/components/auth-forms'
import { SiteHeader } from '@/components/site-header'

export default function LoginPage() {
  return (
    <div className="min-h-screen mendoshop-page-bg">
      <SiteHeader />
      <main className="px-4 py-12">
        <LoginForm />
      </main>
    </div>
  )
}
