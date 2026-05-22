-- Carritos compartidos: token de acceso en URL (además del UUID).
alter table public.shared_carts
  add column if not exists access_token text;

update public.shared_carts
set access_token = encode(gen_random_bytes(16), 'hex')
where access_token is null;

alter table public.shared_carts
  alter column access_token set not null,
  alter column access_token set default encode(gen_random_bytes(16), 'hex');

create unique index if not exists shared_carts_access_token_idx on public.shared_carts (access_token);

-- Rate limit server-side (service_role).
create table if not exists public.api_rate_buckets (
  bucket_key text not null,
  window_start timestamptz not null,
  hits int not null default 1,
  primary key (bucket_key, window_start)
);

create index if not exists api_rate_buckets_prune_idx on public.api_rate_buckets (window_start);

create or replace function public.consume_rate_limit(
  p_bucket text,
  p_max_hits int,
  p_window_seconds int
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_window timestamptz;
  v_hits int;
begin
  if p_bucket is null or length(trim(p_bucket)) = 0 or p_max_hits < 1 or p_window_seconds < 1 then
    return false;
  end if;

  v_window := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
  );

  delete from public.api_rate_buckets
  where window_start < now() - interval '2 days';

  insert into public.api_rate_buckets (bucket_key, window_start, hits)
  values (p_bucket, v_window, 1)
  on conflict (bucket_key, window_start)
  do update set hits = api_rate_buckets.hits + 1
  returning hits into v_hits;

  return v_hits <= p_max_hits;
end;
$$;

revoke all on function public.consume_rate_limit(text, int, int) from public;
revoke all on table public.api_rate_buckets from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text, int, int) to service_role;
grant all on table public.api_rate_buckets to service_role;

-- Vistas: solo service_role (la app registra con rate limit).
revoke execute on function public.increment_shop_views(uuid) from anon, authenticated;
grant execute on function public.increment_shop_views(uuid) to service_role;
