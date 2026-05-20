import { isPlatformAdmin } from '@/lib/admin'
import { createClient } from '@/lib/supabase/server'
import { fetchUserShops } from '@/lib/shops'

export type SessionNavState = {
  loggedIn: boolean
  hasShop: boolean
  admin: boolean
}

export async function getSessionNavState(): Promise<SessionNavState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { loggedIn: false, hasShop: false, admin: false }
  }

  const shops = await fetchUserShops(supabase)
  const admin = await isPlatformAdmin()

  return {
    loggedIn: true,
    hasShop: shops.length > 0,
    admin,
  }
}
