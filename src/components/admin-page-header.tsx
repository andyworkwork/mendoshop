import { AdminSubNav } from '@/components/admin-sub-nav'

export function AdminPageHeader({
  description = 'Panel de administración Mendoshop.',
  hideTitle = false,
}: {
  description?: string
  hideTitle?: boolean
}) {
  return (
    <div className="space-y-6">
      {!hideTitle && (
        <div>
          <h1 className="text-xl font-bold text-white sm:text-2xl">Administración Mendoshop</h1>
          <p className="mt-1 text-sm text-zinc-400 sm:text-base">{description}</p>
        </div>
      )}
      <AdminSubNav />
    </div>
  )
}
