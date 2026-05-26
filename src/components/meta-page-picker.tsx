'use client'

import { useState, useTransition } from 'react'
import { finalizeMetaConnectionAdmin } from '@/app/actions/admin-marketing'
import type { MetaPageCandidate } from '@/lib/meta-graph'
import { useRouter } from 'next/navigation'

export function MetaPagePicker({ pendingId, pages }: { pendingId: string; pages: MetaPageCandidate[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function choose(pageId: string) {
    setError(null)
    startTransition(async () => {
      const res = await finalizeMetaConnectionAdmin({ pendingId, pageId })
      if ('error' in res) {
        setError(res.error)
        return
      }
      router.push('/admin/marketing?meta=connected')
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
      <div className="grid gap-3">
        {pages.map((page) => (
          <button
            key={page.pageId}
            type="button"
            disabled={pending}
            onClick={() => choose(page.pageId)}
            className="card text-left transition hover:border-brand/40"
          >
            <p className="font-medium text-white">{page.pageName}</p>
            <p className="mt-1 text-xs text-zinc-500">
              Facebook Page ID: {page.pageId}
              {page.instagramUsername
                ? ` · Instagram @${page.instagramUsername}`
                : ' · Sin Instagram Business vinculado'}
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}
