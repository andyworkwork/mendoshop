-- Web personal opcional en el pie de la tienda
alter table public.shops
  add column if not exists website_url text;
