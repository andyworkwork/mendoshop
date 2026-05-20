-- Producto de checkout test_andy ($1, +1 día) y montos con decimales
alter table public.shop_plan_payments
  drop constraint if exists shop_plan_payments_plan_check;

alter table public.shop_plan_payments
  alter column plan type text using plan::text;

alter table public.shop_plan_payments
  add constraint shop_plan_payments_plan_check
  check (plan in ('basic', 'pro', 'test_andy'));

alter table public.shop_plan_payments
  alter column amount_ars type numeric(12, 2) using amount_ars::numeric;

-- Permite registros de cambio de plan sin sumar días (days_added = 0)
alter table public.shop_plan_grants
  drop constraint if exists shop_plan_grants_days_added_check;

alter table public.shop_plan_grants
  add constraint shop_plan_grants_days_added_check
  check (days_added >= 0 and days_added <= 365);
