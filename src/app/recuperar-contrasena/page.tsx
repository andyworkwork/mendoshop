import { ForgotPasswordForm } from '@/components/forgot-password-form'
import { MendoshopPageBackground } from '@/components/mendoshop-page-background'
import { SiteHeader } from '@/components/site-header'

export default function RecuperarContrasenaPage() {
  return (
    <div className="relative min-h-screen mendoshop-page-bg">
      <MendoshopPageBackground />
      <div className="relative z-10">
        <SiteHeader />
      </div>
      <main className="relative z-10 px-4 py-12">
        <ForgotPasswordForm />
      </main>
    </div>
  )
}
