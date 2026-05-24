'use client'

import Link from 'next/link'

export function RegisterPendingEmail({ email }: { email: string }) {
  return (
    <div className="card mx-auto max-w-lg space-y-4 text-center">
      <h1 className="text-xl font-bold">Revisá tu correo</h1>
      <p className="text-sm text-zinc-300">
        Te enviamos un enlace a <span className="font-medium text-white">{email}</span> para confirmar tu
        cuenta.
      </p>
      <p className="text-sm text-zinc-400">
        Después de confirmar vas a poder terminar de crear tu tienda. Si el correo no llega, revisá spam o
        esperá unos minutos.
      </p>
      <p className="text-sm text-zinc-500">
        ¿Ya confirmaste?{' '}
        <Link href="/login?next=/registro/completar" className="text-brand-accent underline">
          Entrá con tu email y contraseña
        </Link>
      </p>
    </div>
  )
}
