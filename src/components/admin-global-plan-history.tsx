import Link from 'next/link'
import type { GlobalPlanLogEntry } from '@/app/actions/admin'
import { shopPublicUrl } from '@/lib/publicUrl'

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function statusLabel(status: string | null) {
  if (!status) return null
  switch (status) {
    case 'approved':
      return 'Aprobado'
    case 'pending':
      return 'Pendiente'
    case 'rejected':
      return 'Rechazado'
    case 'cancelled':
      return 'Cancelado'
    default:
      return status
  }
}

function statusClass(status: string | null) {
  if (!status) return ''
  switch (status) {
    case 'approved':
      return 'text-emerald-400'
    case 'pending':
      return 'text-amber-300'
    case 'rejected':
      return 'text-red-400'
    default:
      return 'text-zinc-500'
  }
}

export function AdminGlobalPlanHistory({ entries }: { entries: GlobalPlanLogEntry[] }) {
  const watchCount = entries.filter((e) => e.watch).length

  if (entries.length === 0) {
    return <p className="text-sm text-zinc-400">Todavía no hay movimientos de planes ni pagos.</p>
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-400">
        Últimos {entries.length} eventos de todas las tiendas (días otorgados, cambios de plan e intentos de
        pago con Mercado Pago).
        {watchCount > 0 && (
          <span className="text-amber-300">
            {' '}
            {watchCount} marcado{watchCount === 1 ? '' : 's'} para revisar.
          </span>
        )}
      </p>

      <ul className="space-y-2 md:hidden">
        {entries.map((e) => (
          <li
            key={e.id}
            className={`card space-y-2 text-sm ${e.watch ? 'border-amber-800/50 bg-amber-950/20' : ''}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  e.kind === 'payment'
                    ? 'bg-sky-950/50 text-sky-300'
                    : 'bg-zinc-800 text-zinc-300'
                }`}
              >
                {e.kind === 'payment' ? 'Pago' : 'Días / plan'}
              </span>
              {e.status && (
                <span className={`text-xs font-medium ${statusClass(e.status)}`}>
                  {statusLabel(e.status)}
                </span>
              )}
            </div>
            <p className="font-medium text-white">{e.title}</p>
            <p className="text-zinc-400">{e.detail}</p>
            <p>
              <Link
                href={shopPublicUrl(e.shop_slug)}
                target="_blank"
                rel="noreferrer"
                className="text-brand-accent hover:underline"
              >
                {e.shop_name}
              </Link>
              <span className="text-xs text-zinc-500"> · {formatWhen(e.created_at)}</span>
            </p>
          </li>
        ))}
      </ul>

      <div className="card hidden overflow-x-auto p-0 md:block">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-zinc-700 text-zinc-400">
            <tr>
              <th className="px-4 py-3 font-medium">Fecha</th>
              <th className="px-4 py-3 font-medium">Tienda</th>
              <th className="px-4 py-3 font-medium">Tipo</th>
              <th className="px-4 py-3 font-medium">Evento</th>
              <th className="px-4 py-3 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr
                key={e.id}
                className={`border-b border-zinc-800/80 last:border-0 ${
                  e.watch ? 'bg-amber-950/15' : ''
                }`}
              >
                <td className="whitespace-nowrap px-4 py-3 text-xs text-zinc-500">
                  {formatWhen(e.created_at)}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={shopPublicUrl(e.shop_slug)}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-brand-accent hover:underline"
                  >
                    {e.shop_name}
                  </Link>
                  <p className="text-xs text-zinc-500">/tienda/{e.shop_slug}</p>
                </td>
                <td className="px-4 py-3 text-zinc-300">
                  {e.kind === 'payment' ? 'Mercado Pago' : 'Grant / admin'}
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-zinc-200">{e.title}</p>
                  <p className="text-xs text-zinc-500">{e.detail}</p>
                </td>
                <td className={`px-4 py-3 text-xs font-medium ${statusClass(e.status)}`}>
                  {statusLabel(e.status) ?? '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
