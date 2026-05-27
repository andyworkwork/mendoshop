'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { isFirstStepsDone } from '@/lib/first-steps'

type Props = {
  shopId: string
  productCount: number
}

export function DashboardFirstStepsCta({ shopId, productCount }: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(productCount === 0 && !isFirstStepsDone(shopId))
  }, [shopId, productCount])

  if (!visible) return null

  return (
    <div className="mb-2">
      <div className="inline-flex max-w-full flex-col items-start gap-2 rounded-xl border border-brand/40 bg-brand/10 p-4">
        <span className="rounded-full bg-brand px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-zinc-900 shadow-sm">
          Tus primeros pasos
        </span>
        <Link
          href="/dashboard/editar-tienda?open=appearance&first=1"
          className="btn-primary text-sm"
        >
          Elegí la plantilla de tu tienda →
        </Link>
      </div>
    </div>
  )
}
