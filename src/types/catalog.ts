export type ProductRow = {
  id: string
  subcategory_id: string
  subsubcategoria_id: string | null
  name: string
  description: string | null
  price: number
  stock_quantity: number
  image_path: string | null
  image_gallery: string[]
  active: boolean
  sort_order: number
}

export type SubsubcategoriaRow = {
  id: string
  name: string
  sort_order: number
  products: ProductRow[]
}

export type SubcategoryRow = {
  id: string
  name: string
  sort_order: number
  subsubcategorias: SubsubcategoriaRow[]
  products: ProductRow[]
}

export type CategoryRow = {
  id: string
  name: string
  sort_order: number
  /** Slug de icono en vitrina (coffee, shirt, ring, …). */
  icon: string | null
  subcategories: SubcategoryRow[]
}
