import { createServiceClient } from '@/lib/supabase/service'

/** Cuotas típicas del plan Free de Supabase (referencia para barras de uso). */
export const SUPABASE_FREE_QUOTAS = {
  databaseBytes: 500 * 1024 * 1024,
  storageBytes: 1024 * 1024 * 1024,
  /** Ancho de banda total del ciclo (5 GB caché + 5 GB sin caché en documentación actual). */
  egressBytes: 10 * 1024 * 1024 * 1024,
} as const

/** Cuota de ancho de banda del plan Hobby de Vercel (referencia). */
export const VERCEL_HOBBY_BANDWIDTH_BYTES = 100 * 1024 * 1024 * 1024

export type InfraUsageFromDb = {
  dbBytes: number
  storageBytes: number
  storageFiles: number
  shopsCount: number
  productsCount: number
  activeProductsCount: number
  categoriesCount: number
  totalShopViews: number
  capturedAt: string
}

export type SupabaseMgmtDisk = {
  fsUsedBytes: number
  fsSizeBytes: number
  fsAvailBytes: number
  timestamp: string
}

export type SupabaseMgmtApiCounts = {
  timestamp: string
  totalAuthRequests: number
  totalRealtimeRequests: number
  totalRestRequests: number
  totalStorageRequests: number
}

export type VercelBillingHint = {
  configured: boolean
  message: string
}

export type InfraUsageReport = {
  projectRef: string
  supabaseDashboardUsageUrl: string
  vercelDashboardUsageUrl: string
  db: InfraUsageFromDb
  disk: SupabaseMgmtDisk | null
  apiCountsLast24h: SupabaseMgmtApiCounts | null
  managementApiConfigured: boolean
  vercelBilling: VercelBillingHint
  notes: string[]
}

function projectRefFromEnv(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const m = url.match(/https:\/\/([^.]+)\.supabase\.co/)
  return m?.[1] ?? ''
}

function mapDbStats(raw: Record<string, unknown>): InfraUsageFromDb {
  return {
    dbBytes: Number(raw.db_bytes ?? 0),
    storageBytes: Number(raw.storage_bytes ?? 0),
    storageFiles: Number(raw.storage_files ?? 0),
    shopsCount: Number(raw.shops_count ?? 0),
    productsCount: Number(raw.products_count ?? 0),
    activeProductsCount: Number(raw.active_products_count ?? 0),
    categoriesCount: Number(raw.categories_count ?? 0),
    totalShopViews: Number(raw.total_shop_views ?? 0),
    capturedAt: String(raw.captured_at ?? new Date().toISOString()),
  }
}

export async function fetchInfraUsageFromDb(): Promise<InfraUsageFromDb | { error: string }> {
  const service = createServiceClient()
  const { data, error } = await service.rpc('admin_infra_usage_stats')
  if (error) {
    return {
      error:
        error.message.includes('admin_infra_usage_stats')
          ? 'Falta aplicar la migración 012_admin_infra_usage.sql en Supabase.'
          : error.message,
    }
  }
  if (!data || typeof data !== 'object') {
    return { error: 'No se pudieron leer las métricas de infraestructura.' }
  }
  return mapDbStats(data as Record<string, unknown>)
}

async function fetchSupabaseManagement<T>(
  path: string,
): Promise<{ data: T } | { error: string }> {
  const token = process.env.SUPABASE_ACCESS_TOKEN?.trim()
  if (!token) return { error: 'SUPABASE_ACCESS_TOKEN no configurado' }

  const ref = projectRefFromEnv()
  if (!ref) return { error: 'NEXT_PUBLIC_SUPABASE_URL inválida' }

  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 300 },
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    return { error: `Supabase API ${res.status}: ${text.slice(0, 200)}` }
  }

  return { data: (await res.json()) as T }
}

export async function fetchSupabaseDiskUtil(): Promise<SupabaseMgmtDisk | null> {
  const result = await fetchSupabaseManagement<{
    timestamp?: string
    metrics?: { fs_used_bytes?: number; fs_size_bytes?: number; fs_avail_bytes?: number }
  }>('/config/disk/util')

  if ('error' in result || !result.data.metrics) return null

  const m = result.data.metrics
  return {
    timestamp: result.data.timestamp ?? new Date().toISOString(),
    fsUsedBytes: Number(m.fs_used_bytes ?? 0),
    fsSizeBytes: Number(m.fs_size_bytes ?? 0),
    fsAvailBytes: Number(m.fs_avail_bytes ?? 0),
  }
}

export async function fetchSupabaseApiCounts(): Promise<SupabaseMgmtApiCounts | null> {
  const result = await fetchSupabaseManagement<{
    result?: Array<{
      timestamp?: string
      total_auth_requests?: number
      total_realtime_requests?: number
      total_rest_requests?: number
      total_storage_requests?: number
    }>
  }>('/analytics/endpoints/usage.api-counts?interval=1d')

  if ('error' in result) return null
  const rows = result.data.result ?? []
  const latest = rows[rows.length - 1]
  if (!latest) return null

  return {
    timestamp: latest.timestamp ?? new Date().toISOString(),
    totalAuthRequests: Number(latest.total_auth_requests ?? 0),
    totalRealtimeRequests: Number(latest.total_realtime_requests ?? 0),
    totalRestRequests: Number(latest.total_rest_requests ?? 0),
    totalStorageRequests: Number(latest.total_storage_requests ?? 0),
  }
}

export async function fetchVercelBillingHint(): Promise<VercelBillingHint> {
  const token = process.env.VERCEL_ACCESS_TOKEN?.trim()
  if (!token) {
    return {
      configured: false,
      message:
        'Agregá VERCEL_ACCESS_TOKEN en .env.local para intentar leer cargos por API (opcional).',
    }
  }
  return {
    configured: true,
    message:
      'Token configurado. El egress de Vercel se consulta en el panel de facturación (enlace abajo).',
  }
}

export async function buildInfraUsageReport(): Promise<InfraUsageReport | { error: string }> {
  const dbResult = await fetchInfraUsageFromDb()
  if ('error' in dbResult) return dbResult

  const ref = projectRefFromEnv()
  const managementApiConfigured = Boolean(process.env.SUPABASE_ACCESS_TOKEN?.trim())

  const [disk, apiCountsLast24h, vercelBilling] = await Promise.all([
    managementApiConfigured ? fetchSupabaseDiskUtil() : Promise.resolve(null),
    managementApiConfigured ? fetchSupabaseApiCounts() : Promise.resolve(null),
    fetchVercelBillingHint(),
  ])

  const notes = [
    'Base de datos y Storage (bucket shop-images) se miden en vivo desde el proyecto.',
    'El egress mensual (GB salientes) no está en la API pública de Supabase: ver el enlace “Uso en Supabase”.',
    'Las optimizaciones de la vitrina (thumbs, lazy, Ver más) reducen pedidos a Storage, no el tamaño en disco.',
  ]
  if (!managementApiConfigured) {
    notes.push(
      'Opcional: SUPABASE_ACCESS_TOKEN (PAT en supabase.com/dashboard/account/tokens) habilita disco del servidor y conteo de pedidos API.',
    )
  }

  return {
    projectRef: ref,
    supabaseDashboardUsageUrl: ref
      ? `https://supabase.com/dashboard/project/${ref}/settings/billing/usage`
      : 'https://supabase.com/dashboard',
    vercelDashboardUsageUrl: 'https://vercel.com/andywork-s-projects',
    db: dbResult,
    disk,
    apiCountsLast24h,
    managementApiConfigured,
    vercelBilling,
    notes,
  }
}
