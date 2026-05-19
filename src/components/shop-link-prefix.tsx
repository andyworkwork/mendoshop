'use client'

import { shopLinkPrefix } from '@/lib/publicUrl'
import { useSyncExternalStore } from 'react'

function subscribe() {
  return () => {}
}

function getClientPrefix() {
  if (typeof window !== 'undefined') {
    return `${window.location.host}/tienda/`
  }
  return shopLinkPrefix()
}

/** Prefijo del link de tienda; en el cliente usa el host real (Vercel, localhost, etc.). */
export function ShopLinkPrefix() {
  const prefix = useSyncExternalStore(subscribe, getClientPrefix, shopLinkPrefix)
  return <span className="text-zinc-500">{prefix}</span>
}
