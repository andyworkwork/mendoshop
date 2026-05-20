import { PlanPurchaseButton } from '@/components/plan-purchase-button'
import { formatMoneyArs } from '@/lib/format'
import type { PaidShopPlan } from '@/lib/plan-payments'
import {
  formatPlanUntil,
  isShopSubscriptionActive,
  PLAN_CATALOG,
  PLAN_LIMITS,
  planDaysRemaining,
  planLabel,
} from '@/lib/plans'
import {
  planPurchaseButtonLabel,
  planPurchaseWhatsAppUrl,
  supportWhatsAppUrl,
} from '@/lib/platform-contact'
import type { ShopRow } from '@/types/shop'

export function ShopAccountPanel({
  shop,
  mercadoPagoEnabled,
}: {
  shop: ShopRow
  mercadoPagoEnabled: boolean
}) {
  const active = isShopSubscriptionActive(shop.plan_until)
  const daysLeft = planDaysRemaining(shop.plan_until)
  const untilLabel = formatPlanUntil(shop.plan_until)
  const waUrl = supportWhatsAppUrl(shop)
  const isCurrentPlan = (id: ShopRow['plan']) => shop.plan === id

  return (
    <div className="space-y-6 max-w-2xl">
      <section className="card space-y-4">
        <h2 className="font-semibold">Tu plan actual</h2>
        <div className="flex flex-wrap items-baseline gap-2">
          <p className="text-2xl font-bold text-brand">{planLabel(shop.plan)}</p>
          {!active && (
            <span className="rounded-full bg-red-950/60 px-2.5 py-0.5 text-xs font-medium text-red-300">
              Vencido
            </span>
          )}
          {active && daysLeft !== null && daysLeft <= 7 && (
            <span className="rounded-full bg-amber-950/60 px-2.5 py-0.5 text-xs font-medium text-amber-200">
              Por vencer
            </span>
          )}
        </div>
        {untilLabel ? (
          <p className="text-sm text-zinc-400">
            Vigencia hasta el <span className="text-zinc-200">{untilLabel}</span>
            {daysLeft !== null && (
              <>
                {' '}
                ·{' '}
                <span className={daysLeft === 0 ? 'text-red-400' : 'text-brand'}>
                  {daysLeft === 0
                    ? 'Sin días restantes'
                    : daysLeft === 1
                      ? '1 día restante'
                      : `${daysLeft} días restantes`}
                </span>
              </>
            )}
          </p>
        ) : (
          <p className="text-sm text-zinc-400">Sin fecha de vencimiento configurada.</p>
        )}
        <p className="text-sm text-zinc-400">
          Hasta <span className="text-zinc-200">{PLAN_LIMITS[shop.plan].maxProducts} productos</span> en
          tu catálogo.
        </p>
        <div
          className={`rounded-xl border p-4 text-sm ${
            active
              ? 'border-zinc-700 bg-zinc-900/40 text-zinc-400'
              : 'border-red-900/50 bg-red-950/20 text-red-200/90'
          }`}
        >
          <p className="mb-2 font-medium text-zinc-200">¿Qué pasa cuando se acaban los días?</p>
          {active ? (
            <ul className="list-inside list-disc space-y-1 text-zinc-400">
              <li>
                Hasta la fecha de vigencia tu tienda pública sigue visible y podés editar el catálogo.
              </li>
              <li>
                Cuando vence, el link de la tienda deja de mostrarse a los visitantes.
              </li>
              <li>Seguís pudiendo entrar al panel para renovar o pasar a Básico / Pro.</li>
              <li>Tus productos y fotos se guardan; al renovar, la tienda vuelve a publicarse.</li>
            </ul>
          ) : (
            <ul className="list-inside list-disc space-y-1">
              <li>Tu link público ya no muestra la tienda a los clientes.</li>
              <li>El panel sigue abierto: podés ver catálogo y escribirnos para renovar.</li>
              <li>Al extender el plan o pasar a Básico / Pro, la tienda se activa de nuevo.</li>
            </ul>
          )}
        </div>
      </section>

      <section className="card space-y-4">
        <h2 className="font-semibold">Planes disponibles</h2>
        <p className="text-sm text-zinc-400">
          Los límites se aplican a tu catálogo.{' '}
          {mercadoPagoEnabled
            ? 'Podés pagar con Mercado Pago o escribirnos por WhatsApp.'
            : 'Para activar un plan, usá el botón de cada tarjeta (WhatsApp) o escribinos.'}
        </p>
        <ul className="space-y-3">
          {PLAN_CATALOG.map((p) => (
            <li
              key={p.id}
              className={`flex flex-col gap-2 rounded-xl border p-4 ${
                isCurrentPlan(p.id)
                  ? 'border-brand bg-brand/5 ring-1 ring-brand/40'
                  : 'border-zinc-800 bg-zinc-900/40'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                <p className="min-w-0 font-semibold">{p.name}</p>
                <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                  {p.priceArs != null ? (
                    <span className="text-lg font-bold text-brand">{formatMoneyArs(p.priceArs)}</span>
                  ) : (
                    <span className="text-sm font-medium text-zinc-300">Gratis</span>
                  )}
                  {isCurrentPlan(p.id) && (
                    <span className="text-xs font-medium text-brand">Plan actual</span>
                  )}
                </div>
              </div>
              <p className="text-sm text-zinc-400">{p.summary}</p>
              <ul className="list-outside list-disc space-y-1 pl-5 text-sm text-zinc-500">
                {p.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              {p.id !== 'free_trial' && (() => {
                const paidPlan = p.id as PaidShopPlan
                const label = planPurchaseButtonLabel(paidPlan, shop.plan)
                if (!label) return null
                return (
                  <PlanPurchaseButton
                    plan={paidPlan}
                    label={mercadoPagoEnabled ? `${label} con Mercado Pago` : label}
                    mercadoPagoEnabled={mercadoPagoEnabled}
                    whatsAppHref={planPurchaseWhatsAppUrl(shop, paidPlan)}
                  />
                )
              })()}
            </li>
          ))}
        </ul>
      </section>

      <section className="card space-y-3">
        <h2 className="font-semibold">Contacto y renovación</h2>
        <p className="text-sm text-zinc-400">
          ¿Necesitás más días de prueba, pasar a Básico o Pro, o tenés una consulta? Escribime por WhatsApp y
          te ayudo con tu cuenta.
        </p>
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-accent inline-flex w-full items-center justify-center gap-2 py-3 sm:w-auto sm:min-w-[240px]"
        >
          <WhatsAppIcon />
          Escribir por WhatsApp
        </a>
        <p className="text-xs text-zinc-500">
          Se abre un mensaje con el nombre de tu tienda y tu plan para agilizar el trámite.
        </p>
      </section>
    </div>
  )
}

function WhatsAppIcon() {
  return (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}
