import type { ShopPlanGrant } from '@/types/plan-grant'

export function ShopPlanGrantNotices({ grants }: { grants: ShopPlanGrant[] }) {
  if (grants.length === 0) return null

  return (
    <section className="space-y-3" aria-label="Notificaciones del administrador">
      {grants.map((g) => (
        <article
          key={g.id}
          className="rounded-xl border border-brand/40 bg-brand/10 px-4 py-3 text-sm"
        >
          <p className="font-medium text-brand">
            El administrador te ha otorgado{' '}
            {g.days_added === 1 ? '1 día' : `${g.days_added} días`}
          </p>
          <p className="mt-2 text-zinc-300">{g.reason}</p>
        </article>
      ))}
    </section>
  )
}
