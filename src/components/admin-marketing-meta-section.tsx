'use client'

import { useTransition } from 'react'
import { disconnectMetaAdmin } from '@/app/actions/admin-marketing'
import type { MetaConnectionPublic } from '@/lib/meta-graph'

export function AdminMarketingMetaSection({
  metaConfigured,
  metaConnection,
  onFlash,
}: {
  metaConfigured: boolean
  metaConnection: MetaConnectionPublic | null
  onFlash: (ok: string | null, err?: string | null) => void
}) {
  const [pending, startTransition] = useTransition()

  function handleDisconnect() {
    if (!confirm('¿Desconectar Facebook e Instagram?')) return
    startTransition(async () => {
      const res = await disconnectMetaAdmin()
      if ('error' in res) {
        onFlash(null, res.error)
        return
      }
      onFlash('Cuentas desconectadas.')
      window.location.reload()
    })
  }

  return (
    <section className="card space-y-4">
      <h2 className="text-lg font-semibold text-white">Facebook e Instagram (Meta)</h2>

      {!metaConfigured ? (
        <div className="space-y-3 text-sm text-zinc-400">
          <p>Faltan variables de entorno para conectar Meta:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <code className="text-zinc-300">META_APP_ID</code>
            </li>
            <li>
              <code className="text-zinc-300">META_APP_SECRET</code>
            </li>
            <li>
              <code className="text-zinc-300">META_REDIRECT_URI</code> (opcional, default: /api/marketing/meta/callback)
            </li>
          </ul>
          <p>
            Creá la app en{' '}
            <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">
              developers.facebook.com
            </a>{' '}
            y configurá la URL de privacidad: <code className="text-zinc-300">/privacidad</code>
          </p>
        </div>
      ) : metaConnection ? (
        <div className="space-y-4">
          <div className="rounded-lg border border-emerald-800/40 bg-emerald-950/20 p-4 text-sm">
            <p className="font-medium text-emerald-200">Conectado</p>
            <p className="mt-1 text-zinc-300">Página: {metaConnection.facebook_page_name}</p>
            <p className="text-zinc-400">
              Instagram:{' '}
              {metaConnection.instagram_username
                ? `@${metaConnection.instagram_username}`
                : 'No vinculado (conectá IG Business a la Página en Meta)'}
            </p>
            <p className="mt-2 text-xs text-zinc-500">Conectado por {metaConnection.connected_by}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href="/api/marketing/meta/connect" className="btn-secondary-outline text-sm">
              Reconectar
            </a>
            <button type="button" className="text-sm text-red-400 hover:text-red-300" disabled={pending} onClick={handleDisconnect}>
              Desconectar
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-zinc-400">
            Conectá la Página de Facebook de Mendoshop y su Instagram Business para publicar desde Publicaciones.
          </p>
          <a href="/api/marketing/meta/connect" className="btn-primary inline-block text-sm">
            Conectar Facebook e Instagram
          </a>
        </div>
      )}

      <div className="border-t border-zinc-800 pt-4 text-xs text-zinc-500 space-y-2">
        <p>
          <strong className="text-zinc-400">Requisitos:</strong> Página de Facebook, Instagram Business/Creator
          vinculado a esa página, permisos aprobados en App Review para producción.
        </p>
        <p>
          <strong className="text-zinc-400">TikTok:</strong> sigue siendo manual (copiar caption). Meta publica en FB e IG
          automáticamente.
        </p>
        <p>
          <strong className="text-zinc-400">Programadas:</strong> un cron cada 5 min publica posts con estado
          &quot;Programado&quot; cuando llega la fecha.
        </p>
      </div>
    </section>
  )
}
