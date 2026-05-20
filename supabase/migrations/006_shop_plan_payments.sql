-- Pagos de planes vía Mercado Pago (Checkout Pro)
create type public.shop_plan_payment_status as enum ('pending', 'approved', 'rejected', 'cancelled');

create table public.shop_plan_payments (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops (id) on delete cascade,
  plan public.shop_plan not null check (plan in ('basic', 'pro')),
  amount_ars integer not null check (amount_ars > 0),
  days_added integer not null default 30 check (days_added > 0 and days_added <= 365),
  mp_preference_id text,
  mp_payment_id text,
  status public.shop_plan_payment_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shop_plan_payments_mp_payment_id_key unique (mp_payment_id)
);

create index shop_plan_payments_shop_idx on public.shop_plan_payments (shop_id, created_at desc);
create index shop_plan_payments_preference_idx on public.shop_plan_payments (mp_preference_id)
  where mp_preference_id is not null;

alter table public.shop_plan_payments enable row level security;

create policy shop_plan_payments_member_read on public.shop_plan_payments
  for select
  to authenticated
  using (public.user_can_edit_shop(shop_id));
