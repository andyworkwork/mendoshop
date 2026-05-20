import type { ShopPlan } from '@/types/shop'

/** Productos que se pueden pagar con Mercado Pago (no todos cambian el plan de la tienda). */
export type PlanCheckoutProduct = 'basic' | 'pro' | 'test_andy'

export type CheckoutProductMeta = {
  name: string
  summary: string
  priceArs: number
  daysAdded: number
  features: string[]
  /** Si al pagar también se actualiza shops.plan */
  shopPlanOnPay: ShopPlan | null
}

export const CHECKOUT_PRODUCTS: Record<PlanCheckoutProduct, CheckoutProductMeta> = {
  basic: {
    name: 'Básico',
    summary: 'Tu tienda online con lo esencial para vender por WhatsApp.',
    priceArs: 16_000,
    daysAdded: 30,
    shopPlanOnPay: 'basic',
    features: ['30 productos', '30 días de tienda', 'Soporte técnico', 'Link para tus redes sociales'],
  },
  pro: {
    name: 'Pro',
    summary: 'Más catálogo, visibilidad y herramientas para crecer.',
    priceArs: 27_000,
    daysAdded: 30,
    shopPlanOnPay: 'pro',
    features: [
      '+50 productos (hasta 80 en total)',
      '30 días de tienda',
      'Todas tus redes sociales y más',
      'Prioridad de publicidad en la página',
      'Contador de visitas',
      'Personalización exclusiva',
    ],
  },
  test_andy: {
    name: 'Plan test Andy',
    summary: 'Prueba de pago real en Mercado Pago (solo administradores).',
    priceArs: 1,
    daysAdded: 1,
    shopPlanOnPay: null,
    features: [
      'Cobro de $1 para probar Mercado Pago en producción',
      'Suma 1 día a tu vigencia actual',
      'No cambia tu plan Básico / Pro / Prueba',
    ],
  },
}

export function checkoutProductLabel(product: PlanCheckoutProduct): string {
  return CHECKOUT_PRODUCTS[product].name
}

export function isPlanCheckoutProduct(value: string): value is PlanCheckoutProduct {
  return value in CHECKOUT_PRODUCTS
}
