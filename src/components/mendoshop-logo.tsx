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
      className={`rounded-lg object-cover ${className}`}
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
      className={`inline-flex shrink-0 items-center rounded-lg ring-offset-2 ring-offset-zinc-950 transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-orange)] ${className}`}
      aria-label="Mendoshop — inicio"
    >
      <MendoshopLogo size={size} priority={priority} />
    </Link>
  )
}
