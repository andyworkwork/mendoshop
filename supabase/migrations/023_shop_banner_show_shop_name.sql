-- Opción en editar tienda: ocultar el nombre superpuesto en el banner.
alter table public.shops
  add column if not exists banner_show_shop_name boolean not null default true;
