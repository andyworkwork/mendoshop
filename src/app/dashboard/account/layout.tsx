import { AccountSubnav } from '@/components/account-subnav'

export default function DashboardAccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Cuenta</h1>
        <p className="mt-1 text-sm text-zinc-400">Plan de tu tienda y acceso al panel.</p>
      </div>
      <AccountSubnav />
      {children}
    </div>
  )
}
