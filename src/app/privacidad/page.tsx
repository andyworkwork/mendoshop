import Link from 'next/link'
import { MendoshopPageBackground } from '@/components/mendoshop-page-background'
import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'
import { appBaseUrl } from '@/lib/app-url'

export default function PrivacidadPage() {
  const contactUrl = `${appBaseUrl()}/`

  return (
    <div className="relative min-h-screen mendoshop-page-bg">
      <MendoshopPageBackground />
      <div className="relative z-10">
        <SiteHeader />
      </div>
      <main className="relative z-10 mx-auto max-w-3xl px-4 py-12 pb-24">
        <h1 className="text-3xl font-bold text-white">Política de privacidad</h1>
        <p className="mt-2 text-sm text-zinc-400">Última actualización: mayo 2026</p>

        <div className="prose prose-invert mt-8 max-w-none space-y-6 text-zinc-300">
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">1. Responsable</h2>
            <p>
              Mendoshop (&quot;nosotros&quot;) opera la plataforma de tiendas online disponible en{' '}
              <Link href="/" className="text-brand hover:underline">
                {contactUrl.replace(/\/$/, '')}
              </Link>
              .
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">2. Datos que recopilamos</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>Datos de cuenta: email, nombre de tienda, teléfono WhatsApp.</li>
              <li>Contenido de la tienda: productos, fotos, descripciones.</li>
              <li>Datos técnicos: logs de acceso, cookies de sesión.</li>
              <li>Integraciones opcionales: tokens de Mercado Pago y Meta (Facebook/Instagram) solo si las activás.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">3. Uso de los datos</h2>
            <p>Usamos los datos para operar el servicio, procesar pagos, publicar contenido en redes si lo autorizás, y mejorar la plataforma.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">4. Integración con Meta (Facebook / Instagram)</h2>
            <p>
              Si conectás tus cuentas desde el panel de administración, guardamos tokens de acceso de forma segura
              únicamente para publicar contenido que vos programás. Podés desconectar la integración en cualquier
              momento.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">5. Conservación y seguridad</h2>
            <p>
              Los datos se almacenan en Supabase con acceso restringido. No vendemos tus datos personales a terceros.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">6. Contacto</h2>
            <p>
              Para consultas sobre privacidad, escribinos por WhatsApp desde la página principal o a través del panel
              de tu tienda.
            </p>
          </section>
        </div>
      </main>
      <div className="relative z-10">
        <SiteFooter />
      </div>
    </div>
  )
}
