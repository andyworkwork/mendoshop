'use client'

import { useMemo, useState, useTransition } from 'react'
import { updateShopAdmin } from '@/app/actions/admin'
import { AdminAddPlanDaysDialog } from '@/components/admin-add-plan-days-dialog'
import { AdminEditShopPlanDialog } from '@/components/admin-edit-shop-plan-dialog'
import { AdminChangeShopUrlDialog } from '@/components/admin-change-shop-url-dialog'
import { AdminShopPlanHistoryDialog } from '@/components/admin-shop-plan-history-dialog'
import { shopPublicUrl } from '@/lib/publicUrl'
import {
  formatPlanUntil,
  isShopSubscriptionActive,
  planDaysRemaining,
  planLabel,
} from '@/lib/plans'
import type { ShopPlan } from '@/types/shop'

export type AdminShopRow = {
  id: string
  slug: string
  name: string
  plan: ShopPlan
  plan_until: string | null
  active: boolean
  featured: boolean
  whatsapp_e164: string
  category_label: string | null
  created_at: string
}

function AdminPlanCell({ shop }: { shop: AdminShopRow }) {
  const daysLeft = planDaysRemaining(shop.plan_until)
  const untilLabel = formatPlanUntil(shop.plan_until)
  const active = isShopSubscriptionActive(shop.plan_until)

  return (
    <div className="space-y-0.5">
      <p className="font-medium text-zinc-200">{planLabel(shop.plan)}</p>
      {untilLabel ? (
        <>
          <p
            className={`text-xs font-medium ${
              !active ? 'text-red-400' : daysLeft !== null && daysLeft <= 7 ? 'text-amber-300' : 'text-brand'
            }`}
          >
            {daysLeft === null
              ? '—'
              : daysLeft === 0
                ? 'Sin días restantes'
                : daysLeft === 1
                  ? '1 día restante'
                  : `${daysLeft} días restantes`}
          </p>
          <p className="text-xs text-zinc-500">hasta {untilLabel}</p>
        </>
      ) : (
        <p className="text-xs text-zinc-500">Sin vencimiento</p>
      )}
    </div>
  )
}

function ShopAdminActions({
  shop,
  pending,
  onToggle,
  onAddDays,
  onChangePlan,
  onHistory,
  onChangeUrl,
}: {
  shop: AdminShopRow
  pending: boolean
  onToggle: (shopId: string, field: 'active' | 'featured', value: boolean) => void
  onAddDays: () => void
  onChangePlan: () => void
  onHistory: () => void
  onChangeUrl: () => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={onChangePlan}
        className="rounded-lg border border-zinc-600 px-2.5 py-1.5 text-xs hover:bg-zinc-800"
      >
        Plan
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={onAddDays}
        className="rounded-lg border border-brand/50 bg-brand/10 px-2.5 py-1.5 text-xs text-brand hover:bg-brand/20"
      >
        + Días
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={onHistory}
        className="rounded-lg border border-zinc-600 px-2.5 py-1.5 text-xs hover:bg-zinc-800"
      >
        Historial
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={onChangeUrl}
        className="rounded-lg border border-zinc-600 px-2.5 py-1.5 text-xs hover:bg-zinc-800"
        title="Cambiar el link público /tienda/..."
      >
        URL
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => onToggle(shop.id, 'active', !shop.active)}
        className="rounded-lg border border-zinc-600 px-2.5 py-1.5 text-xs hover:bg-zinc-800"
        title="Pausar oculta la tienda al público; activar la vuelve a mostrar."
      >
        {shop.active ? 'Pausar' : 'Activar'}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => onToggle(shop.id, 'featured', !shop.featured)}
        className="rounded-lg border border-zinc-600 px-2.5 py-1.5 text-xs hover:bg-zinc-800"
        title="Destacada: prioridad en el listado de la página principal de Mendoshop."
      >
        {shop.featured ? 'Quitar destacado' : 'Destacar'}
      </button>
      <a
        href={shopPublicUrl(shop.slug)}
        target="_blank"
        rel="noreferrer"
        className="rounded-lg border border-zinc-600 px-2.5 py-1.5 text-xs hover:bg-zinc-800"
      >
        Ver tienda
      </a>
    </div>
  )
}

function ShopStatusBadges({ shop }: { shop: AdminShopRow }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <span
        className={`inline-block rounded-full px-2 py-0.5 text-xs ${
          shop.active ? 'bg-green-900/50 text-green-300' : 'bg-zinc-800 text-zinc-400'
        }`}
      >
        {shop.active ? 'Activa' : 'Pausada'}
      </span>
      {shop.featured && (
        <span
          className="inline-block rounded-full bg-amber-900/40 px-2 py-0.5 text-xs text-amber-200"
          title="Aparece antes en mendoshop.com (listado de tiendas)."
        >
          Destacada
        </span>
      )}
    </div>
  )
}

function shopSearchHaystack(shop: AdminShopRow): string {
  return [
    shop.name,
    shop.slug,
    shop.category_label ?? '',
    shop.whatsapp_e164,
    planLabel(shop.plan),
    shop.active ? 'activa' : 'pausada',
    shop.featured ? 'destacada' : '',
  ]
    .join(' ')
    .toLowerCase()
}

export function AdminShopsTable({ shops }: { shops: AdminShopRow[] }) {
  const [pending, startTransition] = useTransition()
  const [query, setQuery] = useState('')
  const [addDaysShop, setAddDaysShop] = useState<AdminShopRow | null>(null)
  const [editPlanShop, setEditPlanShop] = useState<AdminShopRow | null>(null)
  const [historyShop, setHistoryShop] = useState<AdminShopRow | null>(null)
  const [urlShop, setUrlShop] = useState<AdminShopRow | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return shops
    return shops.filter((s) => shopSearchHaystack(s).includes(q))
  }, [shops, query])

  function toggle(shopId: string, field: 'active' | 'featured', value: boolean) {
    startTransition(async () => {
      await updateShopAdmin(shopId, { [field]: value })
    })
  }

  if (shops.length === 0) {
    return <p className="text-sm text-zinc-400">Todavía no hay tiendas.</p>
  }

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <label className="block w-full max-w-md text-sm">
          <span className="text-zinc-400">Buscar tienda</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nombre, link, rubro, plan, WhatsApp…"
            className="input mt-1 w-full"
            autoComplete="off"
          />
        </label>
        <p className="shrink-0 text-sm text-zinc-500">
          {query.trim() ? (
            <>
              <span className="text-zinc-300">{filtered.length}</span> de {shops.length}
            </>
          ) : (
            <>{shops.length} tienda{shops.length === 1 ? '' : 's'}</>
          )}
        </p>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-zinc-400">Ninguna tienda coincide con «{query.trim()}».</p>
      ) : (
        <>
      <AdminAddPlanDaysDialog
        shopId={addDaysShop?.id ?? ''}
        shopName={addDaysShop?.name ?? ''}
        open={addDaysShop !== null}
        onClose={() => setAddDaysShop(null)}
      />
      <AdminEditShopPlanDialog
        shopId={editPlanShop?.id ?? ''}
        shopName={editPlanShop?.name ?? ''}
        currentPlan={editPlanShop?.plan ?? 'free_trial'}
        open={editPlanShop !== null}
        onClose={() => setEditPlanShop(null)}
      />
      <AdminShopPlanHistoryDialog
        shopId={historyShop?.id ?? ''}
        shopName={historyShop?.name ?? ''}
        open={historyShop !== null}
        onClose={() => setHistoryShop(null)}
      />
      <AdminChangeShopUrlDialog
        shopId={urlShop?.id ?? ''}
        shopName={urlShop?.name ?? ''}
        currentSlug={urlShop?.slug ?? ''}
        open={urlShop !== null}
        onClose={() => setUrlShop(null)}
      />

      <ul className="space-y-3 md:hidden">
        {filtered.map((s) => (
          <li key={s.id} className="card space-y-3">
            <div className="min-w-0">
              <p className="font-medium text-white">{s.name}</p>
              <a
                href={shopPublicUrl(s.slug)}
                target="_blank"
                rel="noreferrer"
                className="mt-0.5 inline-block break-all text-xs text-brand-accent hover:underline"
              >
                /tienda/{s.slug}
              </a>
              {s.category_label && <p className="mt-1 text-xs text-zinc-500">{s.category_label}</p>}
            </div>
            <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
              <dt className="text-zinc-500">Plan</dt>
              <dd>
                <AdminPlanCell shop={s} />
              </dd>
              <dt className="text-zinc-500">Estado</dt>
              <dd>
                <ShopStatusBadges shop={s} />
              </dd>
            </dl>
            <ShopAdminActions
              shop={s}
              pending={pending}
              onToggle={toggle}
              onAddDays={() => setAddDaysShop(s)}
              onChangePlan={() => setEditPlanShop(s)}
              onHistory={() => setHistoryShop(s)}
              onChangeUrl={() => setUrlShop(s)}
            />
          </li>
        ))}
      </ul>

      <div className="card hidden overflow-x-auto p-0 md:block">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-zinc-700 text-zinc-400">
            <tr>
              <th className="px-4 py-3 font-medium">Tienda</th>
              <th className="px-4 py-3 font-medium">Plan y vigencia</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id} className="border-b border-zinc-800/80 last:border-0">
                <td className="px-4 py-3">
                  <p className="font-medium text-white">{s.name}</p>
                  <a
                    href={shopPublicUrl(s.slug)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-brand-accent hover:underline"
                  >
                    /tienda/{s.slug}
                  </a>
                  {s.category_label && <p className="text-xs text-zinc-500">{s.category_label}</p>}
                </td>
                <td className="px-4 py-3">
                  <AdminPlanCell shop={s} />
                </td>
                <td className="px-4 py-3">
                  <ShopStatusBadges shop={s} />
                </td>
                <td className="px-4 py-3">
                  <ShopAdminActions
                    shop={s}
                    pending={pending}
                    onToggle={toggle}
                    onAddDays={() => setAddDaysShop(s)}
                    onChangePlan={() => setEditPlanShop(s)}
                    onHistory={() => setHistoryShop(s)}
                    onChangeUrl={() => setUrlShop(s)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
        </>
      )}
    </>
  )
}
