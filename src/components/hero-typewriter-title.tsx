'use client'

import { useEffect, useState } from 'react'

const PREFIX = 'Tu tienda online en minutos con '
const MENDO = 'Mendo'
const SHOP = 'shop'
const TOTAL = PREFIX.length + MENDO.length + SHOP.length
const MS_PER_CHAR = 65

export function HeroTypewriterTitle() {
  const [count, setCount] = useState(0)
  const [done, setDone] = useState(false)

  useEffect(() => {
    setCount(0)
    setDone(false)
    let i = 0
    const timer = window.setInterval(() => {
      i += 1
      setCount(i)
      if (i >= TOTAL) {
        window.clearInterval(timer)
        setDone(true)
      }
    }, MS_PER_CHAR)
    return () => window.clearInterval(timer)
  }, [])

  const prefixLen = Math.min(count, PREFIX.length)
  const mendoLen = Math.min(Math.max(0, count - PREFIX.length), MENDO.length)
  const shopLen = Math.min(Math.max(0, count - PREFIX.length - MENDO.length), SHOP.length)

  return (
    <h1 className="text-4xl font-bold tracking-tight text-white drop-shadow-lg sm:text-5xl">
      <span>{PREFIX.slice(0, prefixLen)}</span>
      {mendoLen > 0 && <span className="text-brand">{MENDO.slice(0, mendoLen)}</span>}
      {shopLen > 0 && <span className="text-white">{SHOP.slice(0, shopLen)}</span>}
      {!done && (
        <span aria-hidden className="ml-0.5 inline-block w-[3px] animate-pulse text-brand">
          |
        </span>
      )}
    </h1>
  )
}
