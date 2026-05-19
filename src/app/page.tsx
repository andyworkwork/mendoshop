import { SiteHeader } from '@/components/site-header'
import { ShopDirectory } from '@/components/shop-directory'
import { createClient } from '@/lib/supabase/server'
import { fetchFeaturedShops } from '@/lib/shops'
import Link from 'next/link'

export default async function HomePage() {
  const supabase = await createClient()
  const shops = await fetchFeaturedShops(supabase, 24)

  return (
    <div className="min-h-screen shop-bg-gradient">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 pb-20">
        <section className="py-16 text-center">
          <p className="mb-2 text-sm font-medium uppercase tracking-widest text-teal-400">
            Mendoza vende online
          </p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Tu vitrina en minutos con <span className="text-teal-400">Mendoshop</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-400">
            Catálogo propio, fotos optimizadas, plantillas personalizables y pedidos directo al
            WhatsApp de cada emprendedor.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/registro" className="btn-primary px-6 py-3 text-base">
              Crear mi tienda gratis
            </Link>
            <Link
              href="#tiendas"
              className="rounded-xl border border-zinc-600 px-6 py-3 text-base hover:bg-zinc-800"
            >
              Ver tiendas
            </Link>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          {[
            {
              title: 'Link propio',
              text: 'Compartí mendoshop.com/tienda/tu-nombre en Instagram o con un QR.',
            },
            {
              title: 'Fotos livianas',
              text: 'Subimos WebP automático para no gastar datos ni almacenamiento de más.',
            },
            {
              title: 'WhatsApp',
              text: 'El carrito arma el mensaje con productos y total para tu número.',
            },
          ].map((f) => (
            <article key={f.title} className="card">
              <h2 className="font-semibold text-teal-300">{f.title}</h2>
              <p className="mt-2 text-sm text-zinc-400">{f.text}</p>
            </article>
          ))}
        </section>

        <section id="tiendas" className="mt-20">
          <h2 className="mb-6 text-2xl font-bold">Tiendas en Mendoshop</h2>
          <ShopDirectory shops={shops} />
        </section>
      </main>
      <footer className="border-t border-zinc-800 py-8 text-center text-sm text-zinc-500">
        Mendoshop · Vitrinas para emprendedores de Mendoza
      </footer>
    </div>
  )
}
