import { randomBytes } from 'crypto'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { appBaseUrl } from '@/lib/app-url'
import { isPlatformAdmin } from '@/lib/admin'
import { isMetaConfigured, metaOAuthAuthorizeUrl } from '@/lib/meta-graph'

const STATE_COOKIE = 'meta_oauth_state'

export async function GET() {
  if (!isMetaConfigured()) {
    return NextResponse.json({ error: 'Meta no está configurado (META_APP_ID / META_APP_SECRET).' }, { status: 503 })
  }

  if (!(await isPlatformAdmin())) {
    return NextResponse.redirect(new URL('/login?next=/admin/marketing', appBaseUrl()))
  }

  const state = randomBytes(24).toString('hex')
  const cookieStore = await cookies()
  cookieStore.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10,
    path: '/',
  })

  return NextResponse.redirect(metaOAuthAuthorizeUrl(state))
}
