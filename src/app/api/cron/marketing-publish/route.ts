import { NextResponse } from 'next/server'
import { publishDueScheduledMarketingPosts } from '@/lib/meta-publish'

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim()
  if (!secret) return process.env.NODE_ENV !== 'production'
  const header = req.headers.get('authorization')
  return header === `Bearer ${secret}`
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  try {
    const result = await publishDueScheduledMarketingPosts()
    return NextResponse.json({ ok: true, ...result })
  } catch (e) {
    console.error('marketing-publish cron', e)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}

export async function POST(req: Request) {
  return GET(req)
}
