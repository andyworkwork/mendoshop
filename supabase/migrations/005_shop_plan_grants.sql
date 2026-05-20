-- Extensiones de plan otorgadas por admin (notificación en cuenta del comercio)
create table public.shop_plan_grants (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops (id) on delete cascade,
  days_added int not null check (days_added > 0 and days_added <= 365),
  reason text not null check (char_length(trim(reason)) >= 3),
  created_at timestamptz not null default now(),
  seen_at timestamptz
);

create index shop_plan_grants_shop_idx on public.shop_plan_grants (shop_id, created_at desc);

alter table public.shop_plan_grants enable row level security;

create policy shop_plan_grants_member_read on public.shop_plan_grants
  for select
  to authenticated
  using (public.user_can_edit_shop(shop_id));

create policy shop_plan_grants_member_seen on public.shop_plan_grants
  for update
  to authenticated
  using (public.user_can_edit_shop(shop_id))
  with check (public.user_can_edit_shop(shop_id));

-- Admin puede actualizar cualquier tienda (plan_until, featured, etc.)
create policy shops_admin_update on public.shops
  for update
  to authenticated
  using (public.current_user_is_platform_admin())
  with check (public.current_user_is_platform_admin());

create policy shops_admin_select on public.shops
  for select
  to authenticated
  using (public.current_user_is_platform_admin());
