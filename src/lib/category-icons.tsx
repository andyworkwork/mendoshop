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
  { id: 'zapatilla', label: 'Zapatilla' },
  { id: 'flor', label: 'Flor' },
  { id: 'rosa', label: 'Rosa' },
  { id: 'cocina', label: 'Cocina' },
  { id: 'una', label: 'Uña' },
  { id: 'pelo', label: 'Pelo' },
  { id: 'tijera', label: 'Tijera' },
  { id: 'collar', label: 'Collar' },
  { id: 'lentes', label: 'Lentes' },
  { id: 'libro', label: 'Libro' },
  { id: 'juguete', label: 'Juguete' },
  { id: 'osito', label: 'Osito' },
  { id: 'tarjetas', label: 'Tarjetas' },
  { id: 'autito', label: 'Autito' },
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
  zapatilla: SneakerIcon,
  flor: FlorIcon,
  rosa: RoseIcon,
  cocina: KitchenIcon,
  una: NailIcon,
  pelo: HairIcon,
  tijera: ScissorsIcon,
  collar: CollarIcon,
  lentes: GlassesIcon,
  libro: BookIcon,
  juguete: ToyIcon,
  osito: TeddyIcon,
  tarjetas: CardsIcon,
  autito: ToyCarIcon,
}

export function CategoryIcon({
  icon,
  className = 'h-5 w-5',
  /** En vitrina: color de títulos del tema (por defecto) o tarjeta de producto. */
  themeColor = 'title',
}: {
  icon: string | null | undefined
  className?: string
  themeColor?: 'inherit' | 'title' | 'product-frame'
}) {
  const id = normalizeCategoryIcon(icon)
  const Cmp = icons[id]
  const wrapClass =
    themeColor === 'product-frame'
      ? 'store-category-icon--frame inline-flex shrink-0'
      : themeColor === 'title'
        ? 'store-category-icon--title inline-flex shrink-0'
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

function SneakerIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 14l2-6h12l2 4H4zM4 14v2a2 2 0 002 2h1M20 14v2a2 2 0 01-2 2h-1M7 18h4" />
      <path strokeLinecap="round" d="M8 10h3M14 10h2" />
    </svg>
  )
}

function FlorIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 13a3 3 0 100-6 3 3 0 000 6zM12 13v8M9 10a2.5 2.5 0 10-4 0M15 10a2.5 2.5 0 104 0M10 14a2.5 2.5 0 10-3-2M14 14a2.5 2.5 0 103-2" />
    </svg>
  )
}

function RoseIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c-2-2-4-1-4 1s2 3 4 1 4-1 4 1-4-1-4-1-4 1M12 11v9M10 20h4" />
      <path strokeLinecap="round" d="M9 8c0-1.5 1-2.5 3-2.5s3 1 3 2.5" />
    </svg>
  )
}

function KitchenIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 10h16v10H4V10zM8 10V6a2 2 0 114 0v4M12 10V4" />
      <path strokeLinecap="round" d="M9 14h6M9 17h4" />
    </svg>
  )
}

function NailIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 4c0 4 1.5 8 4 10s4 2 4 6H8c0-4 1.5-8 4-10" />
      <path strokeLinecap="round" d="M10 6h4" />
    </svg>
  )
}

function HairIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c-3 0-5 2-5 5v2c0 2 1 3 2 4l1 9h4l1-9c1-1 2-2 2-4V8c0-3-2-5-5-5z" />
      <path strokeLinecap="round" d="M9 9c1-1 2-1 3-1s2 0 3 1" />
    </svg>
  )
}

function ScissorsIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <circle cx="6" cy="6" r="2.5" />
      <circle cx="6" cy="18" r="2.5" />
      <path strokeLinecap="round" d="M8.5 7.5L20 4M8.5 16.5L20 20M8.5 7.5l4 4.5M8.5 16.5l4-4.5" />
    </svg>
  )
}

function CollarIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 10a6 6 0 1012 0" />
      <circle cx="12" cy="10" r="1.5" fill="currentColor" stroke="none" />
      <path strokeLinecap="round" d="M8 14v2M16 14v2" />
    </svg>
  )
}

function GlassesIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <circle cx="7" cy="12" r="4" />
      <circle cx="17" cy="12" r="4" />
      <path strokeLinecap="round" d="M11 12h2M3 12h0M21 12h0" />
      <path strokeLinecap="round" d="M3 10l2-2M21 10l-2-2" />
    </svg>
  )
}

function BookIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 4h9a3 3 0 013 3v13H8a3 3 0 00-3 3V4z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 18h11a3 3 0 013 3v-14H9a3 3 0 00-3 3" />
    </svg>
  )
}

function ToyIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <rect x="4" y="8" width="16" height="10" rx="2" />
      <circle cx="9" cy="13" r="1.25" />
      <circle cx="15" cy="13" r="1.25" />
      <path strokeLinecap="round" d="M12 8V5M10 5h4" />
      <path strokeLinecap="round" d="M7 8l-2-2M17 8l2-2" />
    </svg>
  )
}

function TeddyIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <circle cx="8" cy="9" r="2" />
      <circle cx="16" cy="9" r="2" />
      <circle cx="12" cy="13" r="5" />
      <path strokeLinecap="round" d="M10 16h4M11 12h.01M13 12h.01" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l-2 3M15 18l2 3" />
    </svg>
  )
}

function CardsIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <rect x="5" y="4" width="11" height="15" rx="1.5" transform="rotate(-8 10.5 11.5)" />
      <rect x="8" y="5" width="11" height="15" rx="1.5" transform="rotate(8 13.5 12.5)" />
      <path strokeLinecap="round" d="M10 9h.01M14 15h.01" />
    </svg>
  )
}

function ToyCarIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 14l1-4h12l1 4H5z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 14h16v2a1 1 0 01-1 1h-1a2 2 0 10-4 0H9a2 2 0 10-4 0H5a1 1 0 01-1-1v-2z" />
      <circle cx="8" cy="17" r="1" />
      <circle cx="16" cy="17" r="1" />
      <path strokeLinecap="round" d="M8 10h8" />
    </svg>
  )
}
