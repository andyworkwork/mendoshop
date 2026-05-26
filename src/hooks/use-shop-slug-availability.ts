'use client'

import { useEffect, useState } from 'react'
import { checkShopSlugAvailable } from '@/app/actions/register'
import { slugify } from '@/lib/format'
import { SHOP_SLUG_TAKEN_MESSAGE } from '@/lib/shop-slug'

export function useShopSlugAvailability(slug: string) {
  const cleanSlug = slugify(slug)
  const [slugTaken, setSlugTaken] = useState(false)
  const [slugChecking, setSlugChecking] = useState(false)

  useEffect(() => {
    if (cleanSlug.length < 3) {
      setSlugTaken(false)
      setSlugChecking(false)
      return
    }

    let cancelled = false
    setSlugChecking(true)
    const timer = setTimeout(() => {
      void checkShopSlugAvailable(cleanSlug).then((res) => {
        if (cancelled) return
        setSlugChecking(false)
        if ('error' in res) {
          setSlugTaken(false)
          return
        }
        setSlugTaken(!res.available)
      })
    }, 400)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [cleanSlug])

  return { cleanSlug, slugTaken, slugChecking, slugTakenMessage: SHOP_SLUG_TAKEN_MESSAGE }
}

export async function assertShopSlugAvailable(slug: string): Promise<string | null> {
  const cleanSlug = slugify(slug)
  if (cleanSlug.length < 3) {
    return 'El link de tu tienda debe tener al menos 3 caracteres (solo letras, números y guiones).'
  }
  const res = await checkShopSlugAvailable(cleanSlug)
  if ('error' in res) return res.error
  if (!res.available) return SHOP_SLUG_TAKEN_MESSAGE
  return null
}
