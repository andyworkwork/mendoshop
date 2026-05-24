-- Tiendas elegidas por admin para el carrusel de la home (orden explícito).
create table public.home_carousel_shops (
  shop_id uuid primary key references public.shops (id) on delete cascade,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now()
);

create index home_carousel_shops_order_idx on public.home_carousel_shops (sort_order);

alter table public.home_carousel_shops enable row level security;

create policy home_carousel_shops_admin on public.home_carousel_shops
  for all
  to authenticated
  using (public.current_user_is_platform_admin())
  with check (public.current_user_is_platform_admin());
