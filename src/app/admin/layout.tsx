import { AdminShell } from '@/components/admin-shell'
import { getAuthUserEmail, requirePlatformAdmin } from '@/lib/admin'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requirePlatformAdmin()
  const email = (await getAuthUserEmail()) ?? 'admin'

  return <AdminShell adminEmail={email}>{children}</AdminShell>
}
