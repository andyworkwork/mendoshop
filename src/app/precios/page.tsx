import Link from 'next/link'
import { MendoshopPageBackground } from '@/components/mendoshop-page-background'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { CHECKOUT_PRODUCTS } from '@/lib/plan-checkout'
import { PLAN_LIMITS, planLabel } from '@/lib/plans'
import { formatMoneyArs } from '@/lib/format'
export default function PreciosPage() {
  return (
    <div className="relative min-h-screen mendoshop-page-bg">
      <MendoshopPageBackground />
      <div className="relative z-10">
        <SiteHeader />
      </div>
      <main className="relative z-10 mx-auto max-w-4xl px-4 py-12 pb-24">
        <h1 className="hero-text-shadow text-3xl font-bold">Planes y precios</h1>
        <p className="mt-3 text-lg text-zinc-200">
          Tu tienda online con catálogo, fotos y pedidos por WhatsApp. Empezá con 7 días gratis.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {(['basic', 'pro'] as const).map((key) => {
            const meta = CHECKOUT_PRODUCTS[key]
            const limits = PLAN_LIMITS[key]
            return (
              <article key={key} className="card border-brand/30 space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-brand">{meta.name}</h2>
                  <p className="text-sm text-zinc-400">{meta.summary}</p>
                </div>
                <p className="text-3xl font-bold text-white">
                  {formatMoneyArs(meta.priceArs)}
                  <span className="text-base font-normal text-zinc-400"> / {meta.daysAdded} días</span>
                </p>
                <ul className="space-y-2 text-sm text-zinc-300">
                  {meta.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <span className="text-brand">✓</span>
                      {f}
                    </li>
                  ))}
                  <li className="flex gap-2">
                    <span className="text-brand">✓</span>
                    Hasta {limits.maxProducts} productos
                  </li>
                  {limits.viewCount && (
                    <li className="flex gap-2">
                      <span className="text-brand">✓</span>
                      Estadísticas de visitas y productos más consultados
                    </li>
                  )}
                </ul>
                <Link href="/registro" className="btn-primary inline-block w-full text-center">
                  Crear mi tienda
                </Link>
              </article>
            )
          })}
        </div>

        <section className="card mt-10 space-y-3">
          <h2 className="text-lg font-semibold">Prueba gratis</h2>
          <p className="text-sm text-zinc-400">
            {planLabel('free_trial')}: {PLAN_LIMITS.free_trial.maxProducts} productos, 7 días, 2 productos
            destacados en grilla (sin carrusel), sin tarjeta. Ideal para cargar tu catálogo y probar antes de
            pagar.
          </p>
        </section>

        <section className="mt-10 space-y-4">
          <h2 className="text-xl font-bold">¿Para quién es?</h2>
          <p className="text-zinc-200 leading-relaxed">
            Para <span className="font-semibold text-white">cualquier tipo de tienda o emprendimiento</span>{' '}
            que quiera mostrar productos o servicios online y cerrar pedidos por WhatsApp: indumentaria,
            gastronomía, belleza, ferretería, regalería, tecnología y lo que vendas. Armás tu catálogo con
            categorías, fotos y plantillas a tu medida; no hace falta encajar en un rubro fijo.
          </p>
          <p className="text-sm text-zinc-400">Algunos ejemplos de cómo lo usan distintos negocios:</p>
          <ul className="grid gap-3 sm:grid-cols-3 text-sm text-zinc-300">
            <li className="rounded-xl border border-zinc-700/80 bg-zinc-900/40 p-4">
              <strong className="text-white">Ropa y accesorios</strong>
              <p className="mt-1 text-zinc-400">
                Detalle por producto (talle, material) y fotos en la vitrina, entre otros rubros similares.
              </p>
            </li>
            <li className="rounded-xl border border-zinc-700/80 bg-zinc-900/40 p-4">
              <strong className="text-white">Comida y repostería</strong>
              <p className="mt-1 text-zinc-400">
                Pedidos por WhatsApp con carrito claro; también sirve para bebidas, boxes y delivery local.
              </p>
            </li>
            <li className="rounded-xl border border-zinc-700/80 bg-zinc-900/40 p-4">
              <strong className="text-white">Servicios y manicura</strong>
              <p className="mt-1 text-zinc-400">
                Link en bio, QR en el local y redes en el pie; igual de útil para talleres, clases o turnos.
              </p>
            </li>
          </ul>
        </section>

        <section className="card mt-10 space-y-4">
          <h2 className="text-lg font-semibold">Preguntas frecuentes</h2>
          <dl className="space-y-4 text-sm">
            <div>
              <dt className="font-medium text-white">¿Necesito Mercado Pago?</dt>
              <dd className="text-zinc-400 mt-1">
                No para vender: tus clientes te escriben por WhatsApp. MP sirve para renovar el plan de la
                tienda desde el panel.
              </dd>
            </div>
            <div>
              <dt className="font-medium text-white">¿Puedo cambiar de plan?</dt>
              <dd className="text-zinc-400 mt-1">
                Sí. En Dashboard → Cuenta podés pagar Básico o Pro y se suman días a tu vigencia.
              </dd>
            </div>
            <div>
              <dt className="font-medium text-white">¿Qué pasa si vence el plan?</dt>
              <dd className="text-zinc-400 mt-1">
                La tienda puede dejar de mostrarse al público hasta que renueves. Te avisamos antes en el
                panel.
              </dd>
            </div>
            <div>
              <dt className="font-medium text-white">¿Dónde pongo el link?</dt>
              <dd className="text-zinc-400 mt-1">
                En Instagram, TikTok, estados de WhatsApp y QR en tu local. En el panel tenés la sección
                Mis redes con todo listo para copiar.
              </dd>
            </div>
          </dl>
        </section>

        <p className="mt-10 text-center">
          <Link href="/registro" className="btn-primary px-8 py-3">
            Empezar gratis
          </Link>
        </p>
      </main>
      <SiteFooter />
    </div>
  )
}
