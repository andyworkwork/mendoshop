-- Meta (Facebook + Instagram) para publicación automática desde Marketing admin.

create table if not exists public.marketing_meta_connections (
  id uuid primary key default gen_random_uuid(),
  facebook_page_id text not null unique,
  facebook_page_name text not null,
  instagram_user_id text,
  instagram_username text,
  page_access_token text not null,
  token_expires_at timestamptz,
  connected_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.marketing_meta_oauth_pending (
  id uuid primary key default gen_random_uuid(),
  pages jsonb not null,
  connected_by text not null,
  expires_at timestamptz not null default (now() + interval '15 minutes')
);

create index marketing_meta_oauth_pending_expires_idx
  on public.marketing_meta_oauth_pending (expires_at);

alter table public.marketing_posts
  add column if not exists meta_facebook_post_id text,
  add column if not exists meta_instagram_post_id text,
  add column if not exists last_publish_error text,
  add column if not exists last_published_at timestamptz;

create trigger marketing_meta_connections_updated_at_trg
before update on public.marketing_meta_connections
for each row execute function public.shops_updated_at();

alter table public.marketing_meta_connections enable row level security;
alter table public.marketing_meta_oauth_pending enable row level security;

create policy marketing_meta_connections_admin on public.marketing_meta_connections
  for all to authenticated
  using (public.current_user_is_platform_admin())
  with check (public.current_user_is_platform_admin());

create policy marketing_meta_oauth_pending_admin on public.marketing_meta_oauth_pending
  for all to authenticated
  using (public.current_user_is_platform_admin())
  with check (public.current_user_is_platform_admin());
