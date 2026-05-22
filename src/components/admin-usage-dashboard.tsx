import { formatBytes, usagePercent } from '@/lib/bytes'
import {
  SUPABASE_FREE_QUOTAS,
  VERCEL_HOBBY_BANDWIDTH_BYTES,
  type InfraUsageReport,
} from '@/lib/infra-usage'

function UsageMeter({
  label,
  usedBytes,
  quotaBytes,
  hint,
}: {
  label: string
  usedBytes: number
  quotaBytes: number
  hint?: string
}) {
  const pct = usagePercent(usedBytes, quotaBytes)
  const bar =
    pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-400' : 'bg-emerald-500'

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-zinc-200">{label}</span>
        <span className="text-sm text-zinc-400">
          {formatBytes(usedBytes)} / {formatBytes(quotaBytes)}{' '}
          <span className="text-zinc-500">({pct}%)</span>
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
        <div className={`h-full rounded-full transition-all ${bar}`} style={{ width: `${pct}%` }} />
      </div>
      {hint ? <p className="text-xs text-zinc-500">{hint}</p> : null}
    </div>
  )
}

function StatCard({
  title,
  value,
  sub,
}: {
  title: string
  value: string
  sub?: string
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{title}</p>
      <p className="mt-1 text-lg font-semibold text-white">{value}</p>
      {sub ? <p className="mt-0.5 text-xs text-zinc-500">{sub}</p> : null}
    </div>
  )
}

export function AdminUsageDashboard({ report }: { report: InfraUsageReport }) {
  const { db } = report
  const storagePct = usagePercent(db.storageBytes, SUPABASE_FREE_QUOTAS.storageBytes)
  const dbPct = usagePercent(db.dbBytes, SUPABASE_FREE_QUOTAS.databaseBytes)

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-white sm:text-lg">Resumen Supabase (medido)</h2>
        <p className="text-sm text-zinc-400">
          Referencia del plan Free. Actualizado:{' '}
          {new Date(db.capturedAt).toLocaleString('es-AR', {
            dateStyle: 'short',
            timeStyle: 'short',
          })}
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Base de datos" value={formatBytes(db.dbBytes)} sub={`${dbPct}% del cupo 500 MB`} />
          <StatCard
            title="Storage (imágenes)"
            value={formatBytes(db.storageBytes)}
            sub={`${db.storageFiles} archivos · ${storagePct}% del cupo 1 GB`}
          />
          <StatCard title="Tiendas" value={String(db.shopsCount)} />
          <StatCard
            title="Productos activos"
            value={String(db.activeProductsCount)}
            sub={`${db.productsCount} en total`}
          />
        </div>
        <div className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <UsageMeter
            label="Almacenamiento en disco (Postgres)"
            usedBytes={db.dbBytes}
            quotaBytes={SUPABASE_FREE_QUOTAS.databaseBytes}
            hint="Tablas, índices y datos de la app."
          />
          <UsageMeter
            label="Almacenamiento en Storage (shop-images)"
            usedBytes={db.storageBytes}
            quotaBytes={SUPABASE_FREE_QUOTAS.storageBytes}
            hint="Banners y fotos de productos (main + thumb)."
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-white sm:text-lg">Egress y ancho de banda</h2>
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100/90">
          El tráfico saliente (egress) en <strong>GB/MB del ciclo</strong> solo lo muestra el panel de
          Supabase y Vercel. Acá enlazamos esos reportes; en la app medimos tamaños en disco y pedidos
          API (proxy de actividad).
        </p>
        <div className="flex flex-wrap gap-2">
          <a
            href={report.supabaseDashboardUsageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary text-sm"
          >
            Uso en Supabase (egress, caché, Auth…)
          </a>
          <a
            href={report.vercelDashboardUsageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-zinc-600 px-4 py-2 text-sm font-semibold text-zinc-200 hover:border-zinc-500 hover:bg-zinc-800"
          >
            Uso en Vercel (bandwidth)
          </a>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <StatCard
            title="Cupo egress Supabase (Free)"
            value={formatBytes(SUPABASE_FREE_QUOTAS.egressBytes)}
            sub="10 GB/mes · ver consumo en el enlace de arriba"
          />
          <StatCard
            title="Cupo bandwidth Vercel (Hobby)"
            value={formatBytes(VERCEL_HOBBY_BANDWIDTH_BYTES)}
            sub="Referencia ~100 GB/mes"
          />
        </div>
      </section>

      {report.disk ? (
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-white sm:text-lg">Disco del servidor (API Supabase)</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard title="Usado" value={formatBytes(report.disk.fsUsedBytes)} />
            <StatCard title="Tamaño volumen" value={formatBytes(report.disk.fsSizeBytes)} />
            <StatCard title="Libre" value={formatBytes(report.disk.fsAvailBytes)} />
          </div>
        </section>
      ) : null}

      {report.apiCountsLast24h ? (
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-white sm:text-lg">Pedidos API (último día)</h2>
          <p className="text-sm text-zinc-500">
            No son MB de egress; sirven para ver si la vitrina dispara muchos pedidos a Storage/REST.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Storage"
              value={report.apiCountsLast24h.totalStorageRequests.toLocaleString('es-AR')}
            />
            <StatCard
              title="REST (PostgREST)"
              value={report.apiCountsLast24h.totalRestRequests.toLocaleString('es-AR')}
            />
            <StatCard
              title="Auth"
              value={report.apiCountsLast24h.totalAuthRequests.toLocaleString('es-AR')}
            />
            <StatCard
              title="Realtime"
              value={report.apiCountsLast24h.totalRealtimeRequests.toLocaleString('es-AR')}
            />
          </div>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-white sm:text-lg">Actividad de la app</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <StatCard
            title="Vistas de tiendas (total)"
            value={db.totalShopViews.toLocaleString('es-AR')}
            sub="Solo planes Pro incrementan contador."
          />
          <StatCard title="Categorías" value={String(db.categoriesCount)} />
        </div>
      </section>

      <section className="space-y-2 rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
        <h2 className="text-sm font-semibold text-zinc-300">Notas</h2>
        <ul className="list-inside list-disc space-y-1 text-sm text-zinc-500">
          {report.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
          <li>{report.vercelBilling.message}</li>
          {!report.managementApiConfigured ? (
            <li>
              Proyecto: <span className="font-mono text-zinc-400">{report.projectRef || '—'}</span>
            </li>
          ) : null}
        </ul>
      </section>
    </div>
  )
}
