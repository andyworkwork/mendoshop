import { HeroFeatures } from '@/components/hero-features'
import { HeroTypewriterTitle } from '@/components/hero-typewriter-title'
import { HomeHeroCta } from '@/components/home-hero-cta'
import { MendoshopPageBackground } from '@/components/mendoshop-page-background'
import { SiteHeader } from '@/components/site-header'
import { ShopDirectory } from '@/components/shop-directory'
import { createClient } from '@/lib/supabase/server'
import { fetchFeaturedShops } from '@/lib/shops'

export default async function HomePage() {
  const supabase = await createClient()
  const shops = await fetchFeaturedShops(supabase, 24)

  return (
    <div className="relative min-h-screen mendoshop-page-bg">
      <MendoshopPageBackground />
      <div className="relative z-10">
        <SiteHeader />
      </div>
      <main className="relative z-10 mx-auto max-w-6xl px-4 pb-20">
        <section className="flex flex-col items-center py-16 text-center">
          <p className="hero-text-shadow mb-2 text-sm font-medium uppercase tracking-widest text-brand">
            Mendoza vende online
          </p>
          <div className="hero-text-shadow max-w-4xl">
            <HeroTypewriterTitle />
          </div>
          <p className="hero-text-shadow mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-zinc-100">
            Catálogo propio, plantillas personalizadas, elegí tus colores y las categorías que
            quieras!
          </p>
          <HomeHeroCta />
          <HeroFeatures />
        </section>

        <section id="tiendas" className="mt-20">
          <h2 className="hero-text-shadow mb-6 text-2xl font-bold">Tiendas en Mendoshop</h2>
          <ShopDirectory shops={shops} />
        </section>
      </main>
      <footer className="relative z-10 border-t border-white/10 py-8 text-center text-sm text-zinc-300">
        Mendoshop · Tiendas para emprendedores de Mendoza
      </footer>
    </div>
  )
}
