-- Mendoshop — multi-tenant marketplace
-- Ejecutar en Supabase SQL Editor o: npm run migrate (con DATABASE_URL)

create extension if not exists "pgcrypto";

-- Planes: free_trial | basic | pro
create type public.shop_plan as enum ('free_trial', 'basic', 'pro');

create table public.shops (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  whatsapp_e164 text not null,
  logo_path text,
  banner_path text,
  plan public.shop_plan not null default 'free_trial',
  plan_until timestamptz,
  active boolean not null default true,
  featured boolean not null default false,
  category_label text,
  theme jsonb not null default '{"templateId":"minimal","primary":"#0d9488","accent":"#f59e0b","background":"gradient"}'::jsonb,
  seo_title text,
  seo_description text,
  view_count bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shops_slug_format check (slug ~ '^[a-z0-9]([a-z0-9-]{0,48}[a-z0-9])?$'),
  constraint shops_whatsapp_digits check (whatsapp_e164 ~ '^[0-9]{10,15}$')
);

create index shops_active_slug_idx on public.shops (active, slug);
create index shops_featured_idx on public.shops (featured) where active = true;

create table public.shop_members (
  shop_id uuid not null references public.shops (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'editor')),
  created_at timestamptz not null default now(),
  primary key (shop_id, user_id)
);

create index shop_members_user_idx on public.shop_members (user_id);

create table public.platform_admins (
  email text primary key
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops (id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index categories_shop_idx on public.categories (shop_id, sort_order);

create table public.subcategories (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index subcategories_shop_idx on public.subcategories (shop_id, category_id);

create table public.subsubcategorias (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops (id) on delete cascade,
  subcategory_id uuid not null references public.subcategories (id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops (id) on delete cascade,
  subcategory_id uuid not null references public.subcategories (id) on delete cascade,
  subsubcategoria_id uuid references public.subsubcategorias (id) on delete set null,
  name text not null,
  description text,
  price numeric(12, 2) not null check (price >= 0),
  stock_quantity int not null default 0 check (stock_quantity >= 0),
  image_path text,
  image_gallery jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_shop_idx on public.products (shop_id, active);

create table public.shared_carts (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops (id) on delete cascade,
  items jsonb not null default '[]'::jsonb,
  expires_at timestamptz not null default (now() + interval '30 days'),
  created_at timestamptz not null default now()
);

create index shared_carts_shop_idx on public.shared_carts (shop_id);

-- Storage bucket (imágenes por tienda: shop_id/product_id/file)
insert into storage.buckets (id, name, public)
values ('shop-images', 'shop-images', true)
on conflict (id) do nothing;

-- Helpers
create or replace function public.user_shop_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select shop_id from public.shop_members where user_id = auth.uid();
$$;

create or replace function public.current_user_is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.platform_admins pa
    where lower(pa.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

create or replace function public.user_can_edit_shop(p_shop_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.shop_members sm
    where sm.shop_id = p_shop_id and sm.user_id = auth.uid()
  ) or public.current_user_is_platform_admin();
$$;

create or replace function public.shop_is_publicly_visible(p_shop_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.shops s
    where s.id = p_shop_id
      and s.active = true
      and (s.plan_until is null or s.plan_until > now())
  );
$$;

create or replace function public.increment_shop_views(p_shop_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.shop_is_publicly_visible(p_shop_id) then
    update public.shops set view_count = view_count + 1 where id = p_shop_id;
  end if;
end;
$$;

create or replace function public.shops_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger shops_updated_at_trg
before update on public.shops
for each row execute function public.shops_updated_at();

create trigger products_updated_at_trg
before update on public.products
for each row execute function public.shops_updated_at();

-- RLS
alter table public.shops enable row level security;
alter table public.shop_members enable row level security;
alter table public.platform_admins enable row level security;
alter table public.categories enable row level security;
alter table public.subcategories enable row level security;
alter table public.subsubcategorias enable row level security;
alter table public.products enable row level security;
alter table public.shared_carts enable row level security;

-- shops: público lee activas; miembros leen/editan la suya
create policy shops_public_read on public.shops
  for select using (
    active = true and (plan_until is null or plan_until > now())
  );

create policy shops_member_read on public.shops
  for select using (public.user_can_edit_shop(id));

create policy shops_member_update on public.shops
  for update using (public.user_can_edit_shop(id));

create policy shops_insert_auth on public.shops
  for insert with check (auth.uid() is not null);

-- shop_members
create policy shop_members_self on public.shop_members
  for select using (user_id = auth.uid() or public.current_user_is_platform_admin());

create policy shop_members_insert on public.shop_members
  for insert with check (user_id = auth.uid() or public.current_user_is_platform_admin());

-- catalog: lectura pública si tienda visible; escritura si miembro
create policy categories_public on public.categories
  for select using (public.shop_is_publicly_visible(shop_id));

create policy categories_edit on public.categories
  for all using (public.user_can_edit_shop(shop_id));

create policy subcategories_public on public.subcategories
  for select using (public.shop_is_publicly_visible(shop_id));

create policy subcategories_edit on public.subcategories
  for all using (public.user_can_edit_shop(shop_id));

create policy subsub_public on public.subsubcategorias
  for select using (public.shop_is_publicly_visible(shop_id));

create policy subsub_edit on public.subsubcategorias
  for all using (public.user_can_edit_shop(shop_id));

create policy products_public on public.products
  for select using (public.shop_is_publicly_visible(shop_id) and active = true);

create policy products_member_read on public.products
  for select using (public.user_can_edit_shop(shop_id));

create policy products_edit on public.products
  for insert with check (public.user_can_edit_shop(shop_id));

create policy products_update on public.products
  for update using (public.user_can_edit_shop(shop_id));

create policy products_delete on public.products
  for delete using (public.user_can_edit_shop(shop_id));

-- shared_carts: solo service role en práctica; deny anon
create policy shared_carts_deny on public.shared_carts
  for all using (false);

-- Storage policies
create policy shop_images_public_read on storage.objects
  for select using (bucket_id = 'shop-images');

create policy shop_images_member_upload on storage.objects
  for insert with check (
    bucket_id = 'shop-images'
    and auth.uid() is not null
    and (storage.foldername(name))[1] is not null
    and public.user_can_edit_shop(((storage.foldername(name))[1])::uuid)
  );

create policy shop_images_member_update on storage.objects
  for update using (
    bucket_id = 'shop-images'
    and public.user_can_edit_shop(((storage.foldername(name))[1])::uuid)
  );

create policy shop_images_member_delete on storage.objects
  for delete using (
    bucket_id = 'shop-images'
    and public.user_can_edit_shop(((storage.foldername(name))[1])::uuid)
  );

grant usage on schema public to anon, authenticated;
grant select on public.shops to anon, authenticated;
grant select on public.categories, public.subcategories, public.subsubcategorias, public.products to anon, authenticated;
grant all on public.shops to authenticated;
grant all on public.shop_members to authenticated;
grant all on public.categories, public.subcategories, public.subsubcategorias, public.products to authenticated;
grant execute on function public.increment_shop_views(uuid) to anon, authenticated;

-- Platform admin inicial (editar email)
-- insert into public.platform_admins (email) values ('tu@email.com');
