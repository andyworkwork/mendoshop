import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function getAuthUserEmail(): Promise<string | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user?.email ?? null
}

export async function isPlatformAdmin(): Promise<boolean> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email) return false

  const { data, error } = await supabase.rpc('current_user_is_platform_admin')
  if (!error && data === true) return true

  const { data: row } = await supabase
    .from('platform_admins')
    .select('email')
    .ilike('email', user.email)
    .maybeSingle()

  return Boolean(row)
}

export async function requirePlatformAdmin(): Promise<void> {
  const email = await getAuthUserEmail()
  if (!email) redirect('/login?next=/admin')
  const ok = await isPlatformAdmin()
  if (!ok) redirect('/')
}
