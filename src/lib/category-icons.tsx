import type { ReactNode } from 'react'

/** Slugs de iconos disponibles para categorías en la vitrina y el editor de catálogo. */
export const CATEGORY_ICON_OPTIONS = [
  { id: 'tag', label: 'General' },
  { id: 'coffee', label: 'Café / bebidas' },
  { id: 'food', label: 'Comida' },
  { id: 'shirt', label: 'Ropa' },
  { id: 'hanger', label: 'Indumentaria' },
  { id: 'ring', label: 'Anillos / joyas' },
  { id: 'gem', label: 'Bijutería' },
  { id: 'phone', label: 'Celulares / tech' },
  { id: 'pet', label: 'Mascotas' },
  { id: 'flower', label: 'Flores / manualidades' },
  { id: 'plant', label: 'Plantas' },
  { id: 'sport', label: 'Deportes' },
  { id: 'beauty', label: 'Belleza / uñas' },
  { id: 'gift', label: 'Regalos' },
] as const

export type CategoryIconId = (typeof CATEGORY_ICON_OPTIONS)[number]['id']

const VALID = new Set<string>(CATEGORY_ICON_OPTIONS.map((o) => o.id))

export function normalizeCategoryIcon(icon: string | null | undefined): CategoryIconId {
  if (icon && VALID.has(icon)) return icon as CategoryIconId
  return 'tag'
}

export function categoryIconLabel(icon: string | null | undefined): string {
  const id = normalizeCategoryIcon(icon)
  return CATEGORY_ICON_OPTIONS.find((o) => o.id === id)?.label ?? 'General'
}

type IconProps = { className?: string }

const icons: Record<CategoryIconId, (p: IconProps) => ReactNode> = {
  tag: TagIcon,
  coffee: CoffeeIcon,
  food: FoodIcon,
  shirt: ShirtIcon,
  hanger: HangerIcon,
  ring: RingIcon,
  gem: GemIcon,
  phone: PhoneIcon,
  pet: PetIcon,
  flower: FlowerIcon,
  plant: PlantIcon,
  sport: SportIcon,
  beauty: BeautyIcon,
  gift: GiftIcon,
}

export function CategoryIcon({
  icon,
  className = 'h-5 w-5',
  /** En vitrina: usa el color de tarjeta de producto del tema. */
  themeColor = 'inherit',
}: {
  icon: string | null | undefined
  className?: string
  themeColor?: 'inherit' | 'product-frame'
}) {
  const id = normalizeCategoryIcon(icon)
  const Cmp = icons[id]
  const wrapClass =
    themeColor === 'product-frame'
      ? 'store-category-icon--frame inline-flex shrink-0'
      : 'inline-flex shrink-0 text-current'
  return <span className={wrapClass}>{Cmp({ className })}</span>
}

function TagIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
    </svg>
  )
}

function CoffeeIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" />
      <path strokeLinecap="round" d="M6 1v3M10 1v3M14 1v3" />
    </svg>
  )
}

function FoodIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M8 7h8M6 11h12" />
    </svg>
  )
}

function ShirtIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 4l2-2 4 4-3 3v12H5V9L2 6l4-4 2 2 4-2 4 2z" />
    </svg>
  )
}

function HangerIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6a3 3 0 100-6 3 3 0 000 6zM4 20h16L12 9 4 20z" />
    </svg>
  )
}

function RingIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <circle cx="12" cy="14" r="6" />
      <path strokeLinecap="round" d="M12 8V4M10 4h4" />
    </svg>
  )
}

function GemIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 3h12l4 6-10 12L2 9l4-6z" />
    </svg>
  )
}

function PhoneIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <rect x="7" y="2" width="10" height="20" rx="2" />
      <path strokeLinecap="round" d="M12 18h.01" />
    </svg>
  )
}

function PetIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 14a2 2 0 104 0 2 2 0 00-4 0M14 12a2 2 0 104 0 2 2 0 00-4 0M6 8a2 2 0 104 0 2 2 0 00-4 0M16 8a2 2 0 104 0 2 2 0 00-4 0M12 18c-3 0-5 2-5 4h10c0-2-2-4-5-4z" />
    </svg>
  )
}

function FlowerIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <circle cx="12" cy="12" r="2" />
      <path strokeLinecap="round" d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1l2.1-2.1M17 7l2.1-2.1" />
    </svg>
  )
}

function PlantIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 22V12M12 12C12 7 8 4 4 4c0 4 3 8 8 8M12 12c0-5 4-8 8-8 0 4-3 8-8 8" />
    </svg>
  )
}

function SportIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" d="M12 3v18M3 12h18" />
    </svg>
  )
}

function BeautyIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 4l-2 16M6 8h12M8 4h8" />
    </svg>
  )
}

function GiftIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 12v8H4v-8M2 7h20v5H2V7zM12 22V7M12 7H8a2 2 0 110-4c2 0 4 2 4 4M12 7h4a2 2 0 100-4c-2 0-4 2-4 4" />
    </svg>
  )
}
