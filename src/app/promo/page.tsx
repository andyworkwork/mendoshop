import Link from 'next/link'
import { MendoshopPageBackground } from '@/components/mendoshop-page-background'
import { PromoCtaButtons } from '@/components/promo-cta-buttons'
import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'
import { PLAN_LIMITS, planMarketingFeatures } from '@/lib/plans'

type Props = {
  searchParams: Promise<{
    utm_source?: string
    utm_medium?: string
    utm_campaign?: string
  }>
}

export default async function PromoPage({ searchParams }: Props) {
  const params = await searchParams

  return (
    <div className="relative min-h-screen mendoshop-page-bg">
      <MendoshopPageBackground />
      <div className="relative z-10">
        <SiteHeader />
      </div>
      <main className="relative z-10 mx-auto max-w-4xl px-4 py-12 pb-24">
        <div className="inline-flex items-center rounded-full border border-brand/40 bg-brand/10 px-3 py-1 text-xs font-medium text-brand">
          Oferta especial
        </div>
        <h1 className="hero-text-shadow mt-4 text-3xl font-bold sm:text-4xl">
          Creá tu tienda online con <span className="text-brand">7 días gratis</span>
        </h1>
        <p className="mt-4 text-lg text-zinc-200">
          Catálogo con fotos, categorías y pedidos por WhatsApp. Sin tarjeta para empezar.
        </p>

        <PromoCtaButtons
          utmSource={params.utm_source}
          utmMedium={params.utm_medium}
          utmCampaign={params.utm_campaign}
        />

        <section className="mt-12 grid gap-4 sm:grid-cols-3">
          {[
            { step: '1', title: 'Registrate', text: 'Nombre, email y link de tu tienda en minutos.' },
            { step: '2', title: 'Cargá productos', text: 'Fotos, precios y categorías desde tu panel.' },
            { step: '3', title: 'Compartí y vendé', text: 'Enviá tu link y recibí pedidos por WhatsApp.' },
          ].map((item) => (
            <article key={item.step} className="card space-y-2">
              <p className="text-2xl font-bold text-brand">{item.step}</p>
              <h2 className="font-semibold text-white">{item.title}</h2>
              <p className="text-sm text-zinc-400">{item.text}</p>
            </article>
          ))}
        </section>

        <section className="card mt-10 space-y-4">
          <h2 className="text-xl font-bold text-white">Qué incluye la prueba gratis</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {planMarketingFeatures('free_trial').map((f) => (
              <li key={f} className="flex gap-2 text-sm text-zinc-300">
                <span className="text-brand">✓</span>
                {f}
              </li>
            ))}
            <li className="flex gap-2 text-sm text-zinc-300">
              <span className="text-brand">✓</span>
              Hasta {PLAN_LIMITS.free_trial.maxProducts} productos
            </li>
          </ul>
        </section>

        <section className="mt-10 space-y-3">
          <h2 className="text-xl font-bold text-white">Ideal para cualquier rubro</h2>
          <p className="text-zinc-300">
            Indumentaria, gastronomía, belleza, ferretería, tecnología y más. Si vendés por WhatsApp, Mendoshop
            te da una vitrina profesional.
          </p>
        </section>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/precios" className="btn-secondary-outline">
            Ver planes y precios
          </Link>
        </div>
      </main>
      <div className="relative z-10">
        <SiteFooter />
      </div>
    </div>
  )
}
