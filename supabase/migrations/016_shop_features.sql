-- Detalle extendido del producto (modal en vitrina) y métricas.
alter table public.products
  add column if not exists product_details text,
  add column if not exists detail_view_count integer not null default 0;

create table if not exists public.shop_view_daily (
  shop_id uuid not null references public.shops (id) on delete cascade,
  view_date date not null,
  views integer not null default 0 check (views >= 0),
  primary key (shop_id, view_date)
);

create index if not exists shop_view_daily_shop_date_idx on public.shop_view_daily (shop_id, view_date desc);

alter table public.shops
  add column if not exists referred_by_slug text;

create or replace function public.record_shop_view_daily(p_shop_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  d date := (timezone('America/Argentina/Mendoza', now()))::date;
begin
  insert into public.shop_view_daily (shop_id, view_date, views)
  values (p_shop_id, d, 1)
  on conflict (shop_id, view_date)
  do update set views = shop_view_daily.views + 1;
end;
$$;

revoke all on function public.record_shop_view_daily(uuid) from public;
grant execute on function public.record_shop_view_daily(uuid) to service_role;

alter table public.shop_view_daily enable row level security;

create policy shop_view_daily_deny on public.shop_view_daily
  for all using (false);
