-- Plan Pro: hasta 4 productos destacados (la app limita a 2 en Básico/Prueba).
alter table public.shops
  drop constraint if exists shops_featured_product_ids_max;

alter table public.shops
  add constraint shops_featured_product_ids_max
  check (cardinality(featured_product_ids) <= 4);
