import { ShopAccountAuthPanel } from '@/components/shop-account-auth-panel'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

type Props = {
  searchParams: Promise<{ updated?: string }>
}

export default async function DashboardAccountConfigPage({ searchParams }: Props) {
  const { updated } = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/dashboard/account/configuracion')

  return (
    <ShopAccountAuthPanel
      email={user.email ?? ''}
      emailJustConfirmed={updated === 'email'}
    />
  )
}
