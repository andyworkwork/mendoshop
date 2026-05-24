import { createClient } from '@/lib/supabase/server'
import { type EmailOtpType } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'

function defaultNextAfterAuth(type: string | null): string {
  if (type === 'recovery' || type === 'email_change') return '/actualizar-contrasena'
  if (type === 'signup' || type === 'email' || type === 'invite') return '/registro/completar'
  return '/registro/completar'
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const authType = searchParams.get('type')
  const nextParam = searchParams.get('next')
  const next = nextParam ?? defaultNextAfterAuth(authType)
  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : defaultNextAfterAuth(authType)

  const supabase = await createClient()

  const code = searchParams.get('code')
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${safeNext}`)
    }
  }

  const tokenHash = searchParams.get('token_hash')
  const otpType = searchParams.get('type') as EmailOtpType | null
  if (tokenHash && otpType) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: otpType })
    if (!error) {
      return NextResponse.redirect(`${origin}${safeNext}`)
    }
  }

  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent('El enlace no es válido o venció. Pedí uno nuevo.')}`,
  )
}
