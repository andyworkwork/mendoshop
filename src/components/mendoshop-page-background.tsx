import Image from 'next/image'

const HERO_BG_DESKTOP = '/mendoshop-hero-bg.png'
const HERO_BG_MOBILE = '/mendoshop-hero-bg-mobile.png'

const heroImageBase = {
  alt: '',
  fill: true as const,
  priority: true as const,
  quality: 85,
}

/** Fondo hero: retrato en móvil, apaisado en desktop (ambos con cover). */
export function MendoshopPageBackground() {
  return (
    <div
      aria-hidden
      className="mendoshop-page-bg__layers pointer-events-none absolute inset-0 z-0 overflow-hidden"
    >
      <Image
        {...heroImageBase}
        src={HERO_BG_MOBILE}
        sizes="(max-width: 767px) 100vw, 0px"
        className="mendoshop-page-bg__img md:hidden"
      />
      <Image
        {...heroImageBase}
        src={HERO_BG_DESKTOP}
        sizes="(min-width: 768px) 100vw, 0px"
        className="mendoshop-page-bg__img hidden md:block"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/[0.58] via-black/[0.48] to-black/[0.68]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_50%_20%,rgba(0,0,0,0.25),transparent_65%)]" />
    </div>
  )
}
