-- Productos destacados en la vitrina (máximo 2, elegidos por el dueño).
alter table public.shops
  add column if not exists featured_product_ids uuid[] not null default '{}';

alter table public.shops
  drop constraint if exists shops_featured_product_ids_max;

alter table public.shops
  add constraint shops_featured_product_ids_max
  check (cardinality(featured_product_ids) <= 2);
