'use client'

import {
  RegistrationCard,
  RegistrationFooterLink,
  RegistrationHeader,
} from '@/components/registration-friendly-ui'

export function RegisterPendingEmail({ email }: { email: string }) {
  return (
    <RegistrationCard>
      <RegistrationHeader title="Revisá tu correo" subtitle="Ya casi terminamos" />
      <div className="registration-card-body space-y-4 text-center">
        <p className="text-sm text-zinc-300">
          Te enviamos un enlace a <span className="font-medium text-white">{email}</span> para confirmar tu
          cuenta.
        </p>
        <p className="text-sm text-zinc-400">
          Cuando hagas clic en el enlace, creamos tu tienda automáticamente con los datos que ya cargaste. Si
          no llega el correo, revisá spam o esperá unos minutos.
        </p>
      </div>
      <RegistrationFooterLink
        text="¿Ya confirmaste?"
        linkText="Ingresar acá"
        href="/login?next=/registro/completar"
      />
    </RegistrationCard>
  )
}
