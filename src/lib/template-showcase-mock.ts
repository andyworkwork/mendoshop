import type { StoreTemplate } from '@/lib/store-templates'

export type TemplateShowcaseMock = {
  shopName: string
  tagline: string
  products: { name: string; price: number }[]
}

const MOCKS: Record<string, TemplateShowcaseMock> = {
  'accesorios-de-celular': {
    shopName: 'Tech Case MDZ',
    tagline: 'Fundas y cargadores',
    products: [
      { name: 'Funda iPhone', price: 15000 },
      { name: 'Cable USB-C', price: 8500 },
    ],
  },
  'alimento-de-mascota': {
    shopName: 'Mascotas Felices',
    tagline: 'Alimento y snacks',
    products: [
      { name: 'Alimento 15 kg', price: 42000 },
      { name: 'Snacks mix', price: 6500 },
    ],
  },
  bijuteria: {
    shopName: 'Lumina Mendoza',
    tagline: 'Acero quirúrgico',
    products: [
      { name: 'Arito dorado', price: 8000 },
      { name: 'Collar minimal', price: 12000 },
    ],
  },
  deportivos: {
    shopName: 'Sport Norte',
    tagline: 'Indumentaria deportiva',
    products: [
      { name: 'Remera dry-fit', price: 18500 },
      { name: 'Short running', price: 14000 },
    ],
  },
  'flores-de-limpiapipas': {
    shopName: 'Arte & Color',
    tagline: 'Manualidades',
    products: [
      { name: 'Ramo artesanal', price: 9500 },
      { name: 'Kit limpiapipas', price: 5500 },
    ],
  },
  manicura: {
    shopName: 'Nails Studio',
    tagline: 'Belleza y uñas',
    products: [
      { name: 'Esmalte gel', price: 7200 },
      { name: 'Set decoración', price: 11000 },
    ],
  },
  plantas: {
    shopName: 'Verde Hogar',
    tagline: 'Plantas y macetas',
    products: [
      { name: 'Monstera', price: 22000 },
      { name: 'Maceta cerámica', price: 8900 },
    ],
  },
  ropa: {
    shopName: 'Moda Urbana',
    tagline: 'Nueva temporada',
    products: [
      { name: 'Jean wide', price: 35000 },
      { name: 'Remera básica', price: 16000 },
    ],
  },
}

export function getTemplateShowcaseMock(template: StoreTemplate): TemplateShowcaseMock {
  return (
    MOCKS[template.id] ?? {
      shopName: `Mi ${template.name}`,
      tagline: template.description,
      products: [
        { name: 'Producto 1', price: 9900 },
        { name: 'Producto 2', price: 14900 },
      ],
    }
  )
}
