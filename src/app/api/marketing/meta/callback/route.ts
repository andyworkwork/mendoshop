import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { getAuthUserEmail, isPlatformAdmin } from '@/lib/admin'
import { appBaseUrl } from '@/lib/app-url'
import {
  isMetaConfigured,
  metaExchangeCodeForToken,
  metaExchangeForLongLivedUserToken,
  metaFetchManagedPages,
} from '@/lib/meta-graph'
import { createServiceClient } from '@/lib/supabase/service'

const STATE_COOKIE = 'meta_oauth_state'

function redirectToMarketing(query: string) {
  return NextResponse.redirect(`${appBaseUrl()}/admin/marketing${query}`)
}

export async function GET(req: Request) {
  if (!isMetaConfigured()) {
    return redirectToMarketing('?meta=error&reason=not_configured')
  }

  if (!(await isPlatformAdmin())) {
    return NextResponse.redirect(`${appBaseUrl()}/login?next=/admin/marketing`)
  }

  const url = new URL(req.url)
  const error = url.searchParams.get('error')
  if (error) {
    return redirectToMarketing(`?meta=error&reason=${encodeURIComponent(error)}`)
  }

  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const cookieStore = await cookies()
  const expectedState = cookieStore.get(STATE_COOKIE)?.value
  cookieStore.delete(STATE_COOKIE)

  if (!code || !state || !expectedState || state !== expectedState) {
    return redirectToMarketing('?meta=error&reason=invalid_state')
  }

  const email = (await getAuthUserEmail()) ?? 'admin'

  try {
    const short = await metaExchangeCodeForToken(code)
    const longLived = await metaExchangeForLongLivedUserToken(short.access_token)
    const pages = await metaFetchManagedPages(longLived.access_token)

    if (!pages.length) {
      return redirectToMarketing('?meta=error&reason=no_pages')
    }

    if (pages.length === 1) {
      const page = pages[0]!
      const service = createServiceClient()
      await service.from('marketing_meta_connections').upsert(
        {
          facebook_page_id: page.pageId,
          facebook_page_name: page.pageName,
          instagram_user_id: page.instagramUserId,
          instagram_username: page.instagramUsername,
          page_access_token: page.pageAccessToken,
          connected_by: email,
        },
        { onConflict: 'facebook_page_id' },
      )
      return redirectToMarketing('?meta=connected')
    }

    const service = createServiceClient()
    const { data: pending, error: pendingErr } = await service
      .from('marketing_meta_oauth_pending')
      .insert({
        pages,
        connected_by: email,
      })
      .select('id')
      .single()

    if (pendingErr || !pending) {
      return redirectToMarketing(`?meta=error&reason=${encodeURIComponent(pendingErr?.message ?? 'pending_failed')}`)
    }

    return NextResponse.redirect(`${appBaseUrl()}/admin/marketing/conectar-meta?pending=${pending.id}`)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'oauth_failed'
    return redirectToMarketing(`?meta=error&reason=${encodeURIComponent(message)}`)
  }
}
