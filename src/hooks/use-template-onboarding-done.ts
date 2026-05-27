'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  FIRST_STEPS_STORAGE_EVENT,
  isTemplateOnboardingDone,
} from '@/lib/first-steps'

export function useTemplateOnboardingDone(shopId: string, initialFromServer = false) {
  const readDone = useCallback(
    () => isTemplateOnboardingDone(shopId, initialFromServer),
    [shopId, initialFromServer],
  )
  const [done, setDone] = useState(initialFromServer)

  useEffect(() => {
    setDone(readDone())
  }, [readDone])

  useEffect(() => {
    function onUpdate(event: Event) {
      const detail = (event as CustomEvent<{ shopId?: string }>).detail
      if (!detail?.shopId || detail.shopId === shopId) {
        setDone(readDone())
      }
    }
    window.addEventListener(FIRST_STEPS_STORAGE_EVENT, onUpdate)
    return () => window.removeEventListener(FIRST_STEPS_STORAGE_EVENT, onUpdate)
  }, [shopId, readDone])

  return { done, markDone: () => setDone(true) }
}
