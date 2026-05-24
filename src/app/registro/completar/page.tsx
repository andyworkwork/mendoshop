import { redirect } from 'next/navigation'
import { CompleteRegistrationForm } from '@/components/complete-registration-form'
import { MendoshopPageBackground } from '@/components/mendoshop-page-background'
import { SiteHeader } from '@/components/site-header'
import { pendingShopFromMetadata } from '@/lib/pending-registration'
import { isPlatformAdmin } from '@/lib/admin'
import { createClient } from '@/lib/supabase/server'
import { fetchUserShops } from '@/lib/shops'

export default async function RegistroCompletarPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/registro/completar')
  }

  const shops = await fetchUserShops(supabase)
  if (shops.length > 0) redirect('/dashboard')
  if (await isPlatformAdmin()) redirect('/admin')

  const initial = pendingShopFromMetadata(user.user_metadata as Record<string, unknown>)

  return (
    <div className="relative min-h-screen mendoshop-page-bg">
      <MendoshopPageBackground />
      <div className="relative z-10">
        <SiteHeader />
      </div>
      <main className="relative z-10 px-4 py-12">
        <CompleteRegistrationForm initial={initial} autoCreateFromSignup />
      </main>
    </div>
  )
}
