import Link from 'next/link'
import { MendoshopLogo } from '@/components/mendoshop-logo'

/** Marca Mendoshop en el header de la vitrina (mismos colores que la home). */
export function StoreHeaderBrand() {
  return (
    <Link
      href="/"
      className="inline-flex min-w-0 flex-1 items-center justify-center gap-2"
      aria-label="Mendoshop — inicio"
    >
      <MendoshopLogo size={36} priority />
      <span className="truncate text-lg font-bold tracking-tight">
        <span className="text-brand">Mendo</span>
        <span className="text-brand-accent">shop</span>
      </span>
    </Link>
  )
}
