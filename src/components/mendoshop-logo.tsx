import Image from 'next/image'
import Link from 'next/link'

const LOGO_SRC = '/mendoshop-logo.png'

type MendoshopLogoProps = {
  size?: number
  className?: string
  priority?: boolean
}

export function MendoshopLogo({
  size = 44,
  className = '',
  priority = false,
}: MendoshopLogoProps) {
  return (
    <Image
      src={LOGO_SRC}
      alt="Mendoshop"
      width={size}
      height={size}
      priority={priority}
      className={`shrink-0 rounded-lg object-cover ${className}`}
    />
  )
}

export function MendoshopLogoLink({
  size = 44,
  className = '',
  priority = false,
}: MendoshopLogoProps) {
  return (
    <Link
      href="/"
      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-orange)] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 sm:h-12 sm:w-12 ${className}`}
      aria-label="Mendoshop — inicio"
    >
      <MendoshopLogo size={size} priority={priority} className="h-full w-full" />
    </Link>
  )
}
