import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

function redirectAuthCodeToConfirmar(request: NextRequest): NextResponse | null {
  const { pathname, searchParams } = request.nextUrl
  const code = searchParams.get('code')
  if (!code || pathname.startsWith('/auth/confirmar')) return null

  const url = request.nextUrl.clone()
  url.pathname = '/auth/confirmar'
  if (!url.searchParams.has('next')) {
    const type = searchParams.get('type')
    const next =
      type === 'recovery' || type === 'email_change'
        ? '/actualizar-contrasena'
        : '/registro/completar'
    url.searchParams.set('next', next)
  }
  return NextResponse.redirect(url)
}

export async function updateSession(request: NextRequest) {
  const authRedirect = redirectAuthCodeToConfirmar(request)
  if (authRedirect) return authRedirect

  let supabaseResponse = NextResponse.next({ request })
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        )
      },
    },
  })

  await supabase.auth.getUser()
  return supabaseResponse
}
