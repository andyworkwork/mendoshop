import { RegisterForm } from '@/components/auth-forms'
import { SiteHeader } from '@/components/site-header'

export default function RegistroPage() {
  return (
    <div className="min-h-screen shop-bg-gradient">
      <SiteHeader />
      <main className="px-4 py-12">
        <RegisterForm />
      </main>
    </div>
  )
}
