-- Icono del botón "Categorías" en el selector de orden (independiente de cada categoría).
alter table public.shops
  add column if not exists category_view_icon text;

comment on column public.shops.category_view_icon is 'Slug de icono para el segmento Categorías en la vitrina.';

-- Productos que estaban en sub-subcategoría pasan a la subcategoría padre.
update public.products
set subsubcategoria_id = null
where subsubcategoria_id is not null;
