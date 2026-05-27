-- Productos directamente bajo categorías (sin subcategorías ni sub-subcategorías).

alter table public.products
  add column if not exists category_id uuid references public.categories (id) on delete cascade;

update public.products p
set category_id = s.category_id
from public.subcategories s
where p.subcategory_id = s.id
  and p.category_id is null;

delete from public.products where category_id is null;

alter table public.products
  drop column if exists subsubcategoria_id,
  drop column if exists subcategory_id;

alter table public.products
  alter column category_id set not null;

create index if not exists products_category_idx on public.products (shop_id, category_id);

drop table if exists public.subsubcategorias cascade;
drop table if exists public.subcategories cascade;
