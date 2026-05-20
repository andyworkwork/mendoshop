'use client'

import { useTransition } from 'react'
import { updateShopAdmin } from '@/app/actions/admin'
import { shopPublicUrl } from '@/lib/publicUrl'
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

export function AdminShopsTable({ shops }: { shops: AdminShopRow[] }) {
  const [pending, startTransition] = useTransition()

  function toggle(shopId: string, field: 'active' | 'featured', value: boolean) {
    startTransition(async () => {
      await updateShopAdmin(shopId, { [field]: value })
    })
  }

  if (shops.length === 0) {
    return <p className="text-sm text-zinc-400">Todavía no hay tiendas.</p>
  }

  return (
    <div className="card overflow-x-auto p-0">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-zinc-700 text-zinc-400">
          <tr>
            <th className="px-4 py-3 font-medium">Tienda</th>
            <th className="px-4 py-3 font-medium">Plan</th>
            <th className="px-4 py-3 font-medium">Estado</th>
            <th className="px-4 py-3 font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {shops.map((s) => (
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
                {s.category_label && (
                  <p className="text-xs text-zinc-500">{s.category_label}</p>
                )}
              </td>
              <td className="px-4 py-3 text-zinc-300">
                {s.plan}
                {s.plan_until && (
                  <p className="text-xs text-zinc-500">
                    hasta {new Date(s.plan_until).toLocaleDateString('es-AR')}
                  </p>
                )}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-xs ${
                    s.active ? 'bg-green-900/50 text-green-300' : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {s.active ? 'Activa' : 'Pausada'}
                </span>
                {s.featured && (
                  <span className="ml-1 inline-block rounded-full bg-amber-900/40 px-2 py-0.5 text-xs text-amber-200">
                    Destacada
                  </span>
                )}
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => toggle(s.id, 'active', !s.active)}
                    className="rounded-lg border border-zinc-600 px-2 py-1 text-xs hover:bg-zinc-800"
                  >
                    {s.active ? 'Pausar' : 'Activar'}
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => toggle(s.id, 'featured', !s.featured)}
                    className="rounded-lg border border-zinc-600 px-2 py-1 text-xs hover:bg-zinc-800"
                  >
                    {s.featured ? 'Quitar destacado' : 'Destacar'}
                  </button>
                  <a
                    href={shopPublicUrl(s.slug)}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border border-zinc-600 px-2 py-1 text-xs hover:bg-zinc-800"
                  >
                    Ver tienda
                  </a>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
