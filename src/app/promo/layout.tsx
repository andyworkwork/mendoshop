import { promoLandingMetadata } from '@/lib/promo-landing'

export const metadata = promoLandingMetadata()

export default function PromoLayout({ children }: { children: React.ReactNode }) {
  return children
}
