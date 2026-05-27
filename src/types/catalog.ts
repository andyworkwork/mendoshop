export type ProductRow = {
  id: string
  category_id: string
  name: string
  description: string | null
  /** Texto largo para el modal de detalle (talle, material, etc.). */
  product_details: string | null
  detail_view_count: number
  price: number
  stock_quantity: number
  image_path: string | null
  image_focus_x: number
  image_focus_y: number
  image_gallery: string[]
  active: boolean
  sort_order: number
}

export type CategoryRow = {
  id: string
  name: string
  sort_order: number
  /** Slug de icono en vitrina (coffee, shirt, ring, …). */
  icon: string | null
  products: ProductRow[]
}
