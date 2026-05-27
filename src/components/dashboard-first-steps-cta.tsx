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
    <div className="mb-4">
      <Link
        href="/dashboard/editar-tienda?open=appearance&first=1"
        className="group relative inline-flex items-center rounded-xl border border-brand/40 bg-brand/10 px-4 pb-3 pt-5 text-sm font-semibold text-brand transition hover:border-brand/60 hover:bg-brand/15"
      >
        <span className="pointer-events-none absolute -top-2.5 left-3 rounded-full bg-brand px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--brand-ink)] shadow-md">
          Tus primeros pasos
        </span>
        Elegí la plantilla de tu tienda →
      </Link>
    </div>
  )
}
