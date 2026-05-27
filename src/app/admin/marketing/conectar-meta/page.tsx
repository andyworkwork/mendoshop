import Link from 'next/link'
import { getMetaOAuthPendingAdmin } from '@/app/actions/admin-marketing'
import { AdminPageHeader } from '@/components/admin-page-header'
import { MetaPagePicker } from '@/components/meta-page-picker'

type Props = {
  searchParams: Promise<{ pending?: string }>
}

export default async function ConectarMetaPage({ searchParams }: Props) {
  const { pending } = await searchParams
  if (!pending) {
    return (
      <div className="space-y-6">
        <AdminPageHeader hideTitle description="Elegí qué Página de Facebook conectar con Mendoshop." />
        <p className="text-sm text-red-400">Falta el identificador de la sesión de conexión.</p>
        <Link href="/admin/marketing" className="text-sm text-brand hover:underline">
          Volver a Marketing
        </Link>
      </div>
    )
  }

  const result = await getMetaOAuthPendingAdmin(pending)

  return (
    <div className="space-y-6">
      <AdminPageHeader
        hideTitle
        description="Elegí la Página de Facebook (y su Instagram vinculado) para publicar desde Mendoshop."
      />
      {'error' in result ? (
        <>
          <p className="text-sm text-red-400" role="alert">
            {result.error}
          </p>
          <Link href="/admin/marketing" className="text-sm text-brand hover:underline">
            Volver a Marketing
          </Link>
        </>
      ) : (
        <MetaPagePicker pendingId={pending} pages={result.pages} />
      )}
    </div>
  )
}
