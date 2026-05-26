import Image from 'next/image'
import Link from 'next/link'
import { Suspense } from 'react'
import { MendoshopPageBackground } from '@/components/mendoshop-page-background'
import { PromoCtaButtons } from '@/components/promo-cta-buttons'
import { PromoStarRating } from '@/components/promo-star-rating'
import { PromoStickyCta } from '@/components/promo-sticky-cta'
import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'
import { formatMoneyArs } from '@/lib/format'
import { PLAN_LIMITS, PLAN_PRICES_ARS, planMarketingFeatures } from '@/lib/plans'
import { PROMO_FAQ, PROMO_HERO_SHOWCASE, PROMO_TESTIMONIALS, PROMO_TRUST_POINTS } from '@/lib/promo-landing'

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

      <main className="relative z-10 pb-28 sm:pb-24">
        {/* Hero */}
        <section className="mx-auto max-w-5xl px-4 pb-12 pt-10 sm:pt-14">
          <div className="inline-flex items-center rounded-full border border-brand/40 bg-brand/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand">
            7 días gratis · Sin tarjeta
          </div>
          <h1 className="hero-text-shadow mt-5 max-w-3xl text-3xl font-bold leading-tight sm:text-5xl">
            Tu tienda online lista en minutos.{' '}
            <span className="text-brand">Vendé por WhatsApp</span> con un catálogo profesional.
          </h1>
          <p className="hero-text-shadow mt-5 max-w-2xl text-lg leading-relaxed text-zinc-200 sm:text-xl">
            Subí fotos, armá categorías y compartí un link en Instagram, TikTok o Facebook. Ideal para
            emprendedores de Mendoza y toda Argentina.
          </p>

          <div className="mt-8">
            <PromoCtaButtons
              utmSource={params.utm_source}
              utmMedium={params.utm_medium}
              utmCampaign={params.utm_campaign}
              size="large"
            />
          </div>

          <ul className="mt-8 flex flex-wrap gap-2">
            {PROMO_TRUST_POINTS.map((point) => (
              <li
                key={point}
                className="rounded-full border border-zinc-700/80 bg-zinc-900/50 px-3 py-1.5 text-xs font-medium text-zinc-200"
              >
                ✓ {point}
              </li>
            ))}
          </ul>
        </section>

        {/* Showcase */}
        <section className="border-y border-white/5 bg-black/25 py-12">
          <div className="mx-auto max-w-5xl px-4">
            <h2 className="text-center text-sm font-semibold uppercase tracking-widest text-brand">
              Ejemplos reales de vitrinas
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-center text-sm text-zinc-400">
              Plantillas para distintos rubros. Tu tienda puede verse así de prolija desde el día uno.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {PROMO_HERO_SHOWCASE.map((item) => (
                <figure
                  key={item.src}
                  className="group overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40"
                >
                  <div className="relative aspect-[4/3]">
                    <Image
                      src={item.src}
                      alt={`Ejemplo de tienda Mendoshop — ${item.label}`}
                      fill
                      className="object-cover transition duration-300 group-hover:scale-105"
                      sizes="(max-width: 640px) 50vw, 33vw"
                    />
                  </div>
                  <figcaption className="px-3 py-2 text-xs font-medium text-zinc-300">{item.label}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* Steps */}
        <section className="mx-auto max-w-5xl px-4 py-14">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">Empezá en 3 pasos</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              {
                step: '1',
                title: 'Creá tu cuenta',
                text: 'Elegí el nombre y el link de tu tienda. En menos de 2 minutos.',
              },
              {
                step: '2',
                title: 'Cargá tu catálogo',
                text: 'Fotos, precios y categorías desde tu panel. Sin diseñador.',
              },
              {
                step: '3',
                title: 'Compartí y vendé',
                text: 'Pegá tu link en bio o stories. Los pedidos llegan por WhatsApp.',
              },
            ].map((item) => (
              <article key={item.step} className="card space-y-3">
                <p className="text-3xl font-bold text-brand">{item.step}</p>
                <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                <p className="text-sm leading-relaxed text-zinc-400">{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Testimonials */}
        <section className="border-y border-white/5 bg-zinc-950/40 py-14">
          <div className="mx-auto max-w-5xl px-4">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">Lo que dicen quienes probaron Mendoshop</h2>
            <p className="mt-2 max-w-2xl text-sm text-zinc-400">
              Emprendedores de Mendoza que armaron su catálogo y empezaron a vender por WhatsApp.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {PROMO_TESTIMONIALS.map((item) => {
                const initials = item.name
                  .split(' ')
                  .map((part) => part[0])
                  .join('')
                  .slice(0, 2)
                return (
                  <figure
                    key={item.name}
                    className="flex h-full flex-col rounded-xl border border-zinc-800 bg-zinc-900/50 p-5"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/20 text-sm font-semibold text-brand"
                        aria-hidden
                      >
                        {initials}
                      </span>
                      <figcaption>
                        <p className="font-medium text-white">{item.name}</p>
                        <p className="text-xs text-zinc-500">
                          {item.rubro} · {item.city}
                        </p>
                      </figcaption>
                    </div>
                    <PromoStarRating rating={item.rating} />
                    <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-zinc-300">
                      &ldquo;{item.quote}&rdquo;
                    </blockquote>
                  </figure>
                )
              })}
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="mx-auto max-w-5xl px-4 pb-14">
          <div className="card grid gap-8 lg:grid-cols-2">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white">Qué incluye la prueba gratis</h2>
              <ul className="space-y-2">
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
                <li className="flex gap-2 text-sm text-zinc-300">
                  <span className="text-brand">✓</span>
                  Plantillas y colores personalizables
                </li>
              </ul>
            </div>
            <div className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-950/50 p-5">
              <h3 className="font-semibold text-white">Después de la prueba</h3>
              <p className="text-sm text-zinc-400">
                Planes mensuales sin sorpresas. Pagás solo si querés seguir online.
              </p>
              <ul className="space-y-2 text-sm text-zinc-300">
                <li>
                  <span className="font-medium text-white">Básico</span> — {formatMoneyArs(PLAN_PRICES_ARS.basic)} / mes
                </li>
                <li>
                  <span className="font-medium text-white">Pro</span> — {formatMoneyArs(PLAN_PRICES_ARS.pro)} / mes
                  (más productos, estadísticas y visibilidad)
                </li>
              </ul>
              <Link href="/precios" className="inline-block text-sm text-brand hover:underline">
                Ver detalle de planes →
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="mx-auto max-w-3xl px-4 pb-14">
          <h2 className="text-2xl font-bold text-white">Preguntas frecuentes</h2>
          <div className="mt-6 space-y-3">
            {PROMO_FAQ.map((item) => (
              <details key={item.q} className="group rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
                <summary className="cursor-pointer list-none font-medium text-zinc-100 marker:content-none [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center justify-between gap-3">
                    {item.q}
                    <span className="text-brand transition group-open:rotate-45">+</span>
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-zinc-400">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="mx-auto max-w-5xl px-4 pb-8">
          <div className="rounded-2xl border border-brand/30 bg-gradient-to-br from-brand/15 via-zinc-900/80 to-zinc-950 p-8 text-center sm:p-12">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Empezá hoy. Tu catálogo online te espera.
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-zinc-300">
              7 días gratis para probar Mendoshop con tu rubro real. Sin tarjeta, sin compromiso.
            </p>
            <div className="mt-8 flex justify-center">
              <PromoCtaButtons
                utmSource={params.utm_source}
                utmMedium={params.utm_medium}
                utmCampaign={params.utm_campaign}
                size="large"
              />
            </div>
          </div>
        </section>
      </main>

      <Suspense fallback={null}>
        <PromoStickyCta />
      </Suspense>

      <div className="relative z-10">
        <SiteFooter />
      </div>
    </div>
  )
}
