'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type CartLine = {
  productId: string
  name: string
  unitPrice: number
  quantity: number
  maxStock: number
  imagePath: string | null
  categoryId: string
  categoryName: string
  categorySortOrder: number
}

type CartContextValue = {
  lines: CartLine[]
  addLine: (p: Omit<CartLine, 'quantity'>) => void
  removeLine: (productId: string) => void
  setQty: (productId: string, quantity: number) => void
  clear: () => void
  subtotal: number
}

const CartContext = createContext<CartContextValue | null>(null)

/** Vitrina tipo catálogo: sin tope por stock en BD (coordinación por WhatsApp). */
const CART_QTY_MAX = 999

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([])

  const addLine = useCallback((p: Omit<CartLine, 'quantity'>) => {
    setLines((prev) => {
      const i = prev.findIndex((l) => l.productId === p.productId)
      if (i === -1) return [...prev, { ...p, quantity: 1 }]
      const next = [...prev]
      next[i] = { ...next[i]!, quantity: Math.min(next[i]!.quantity + 1, CART_QTY_MAX) }
      return next
    })
  }, [])

  const removeLine = useCallback((productId: string) => {
    setLines((prev) => prev.filter((l) => l.productId !== productId))
  }, [])

  const setQty = useCallback((productId: string, quantity: number) => {
    setLines((prev) =>
      prev
        .map((l) =>
          l.productId === productId
            ? { ...l, quantity: Math.max(0, Math.min(quantity, CART_QTY_MAX)) }
            : l,
        )
        .filter((l) => l.quantity > 0),
    )
  }, [])

  const clear = useCallback(() => setLines([]), [])

  const subtotal = useMemo(
    () => lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0),
    [lines],
  )

  const value = useMemo(
    () => ({ lines, addLine, removeLine, setQty, clear, subtotal }),
    [lines, addLine, removeLine, setQty, clear, subtotal],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart debe usarse dentro de CartProvider')
  return ctx
}
