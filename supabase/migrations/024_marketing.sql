-- Marketing: biblioteca de assets, plantillas, publicaciones y campañas (solo admin).

create table if not exists public.marketing_assets (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  asset_type text not null check (asset_type in ('image', 'video')),
  storage_path text,
  external_url text,
  rubro text,
  city text,
  shop_id uuid references public.shops(id) on delete set null,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint marketing_assets_has_source check (storage_path is not null or external_url is not null)
);

create index marketing_assets_created_idx on public.marketing_assets (created_at desc);

create table if not exists public.marketing_post_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  body text not null,
  suggested_platforms text[] not null default '{}',
  hashtags text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.marketing_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  post_type text not null default 'photo'
    check (post_type in ('photo', 'carousel', 'video', 'story')),
  platforms text[] not null default '{}',
  status text not null default 'draft'
    check (status in ('draft', 'reviewed', 'scheduled', 'published')),
  caption text not null default '',
  template_id uuid references public.marketing_post_templates(id) on delete set null,
  asset_ids uuid[] not null default '{}',
  scheduled_at timestamptz,
  published_at timestamptz,
  utm_source text,
  utm_medium text default 'social',
  utm_campaign text,
  link_path text not null default '/promo',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index marketing_posts_status_idx on public.marketing_posts (status, scheduled_at desc nulls last);
create index marketing_posts_scheduled_idx on public.marketing_posts (scheduled_at desc nulls last)
  where scheduled_at is not null;

create table if not exists public.marketing_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  offer_text text not null default '7 días gratis',
  landing_path text not null default '/promo',
  utm_campaign text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger marketing_assets_updated_at_trg
before update on public.marketing_assets
for each row execute function public.shops_updated_at();

create trigger marketing_post_templates_updated_at_trg
before update on public.marketing_post_templates
for each row execute function public.shops_updated_at();

create trigger marketing_posts_updated_at_trg
before update on public.marketing_posts
for each row execute function public.shops_updated_at();

create trigger marketing_campaigns_updated_at_trg
before update on public.marketing_campaigns
for each row execute function public.shops_updated_at();

alter table public.marketing_assets enable row level security;
alter table public.marketing_post_templates enable row level security;
alter table public.marketing_posts enable row level security;
alter table public.marketing_campaigns enable row level security;

create policy marketing_assets_admin on public.marketing_assets
  for all to authenticated
  using (public.current_user_is_platform_admin())
  with check (public.current_user_is_platform_admin());

create policy marketing_templates_admin on public.marketing_post_templates
  for all to authenticated
  using (public.current_user_is_platform_admin())
  with check (public.current_user_is_platform_admin());

create policy marketing_posts_admin on public.marketing_posts
  for all to authenticated
  using (public.current_user_is_platform_admin())
  with check (public.current_user_is_platform_admin());

create policy marketing_campaigns_admin on public.marketing_campaigns
  for all to authenticated
  using (public.current_user_is_platform_admin())
  with check (public.current_user_is_platform_admin());

create policy marketing_campaigns_public_read on public.marketing_campaigns
  for select using (active = true);

-- Imágenes en shop-images/marketing/{assetId}/...
create policy marketing_storage_admin on storage.objects
  for all to authenticated
  using (
    bucket_id = 'shop-images'
    and (storage.foldername(name))[1] = 'marketing'
    and public.current_user_is_platform_admin()
  )
  with check (
    bucket_id = 'shop-images'
    and (storage.foldername(name))[1] = 'marketing'
    and public.current_user_is_platform_admin()
  );

insert into public.marketing_post_templates (name, description, body, suggested_platforms, hashtags, is_default)
values
  (
    'Oferta 7 días gratis',
    'Post directo con CTA a la landing promocional.',
    E'🚀 Creá tu tienda online en minutos\n\n✅ {BENEFICIO}\n✅ Catálogo con fotos\n✅ Pedidos por WhatsApp\n\n👉 {LINK}\n\n{RUBRO} · {CIUDAD}',
    array['instagram', 'facebook', 'tiktok'],
    '#mendoshop #tiendaonline #emprendedores #whatsapp #7diasgratis',
    true
  ),
  (
    'Antes y después',
    'Mostrá el resultado de una tienda real.',
    E'Antes: catálogo en PDF o solo WhatsApp.\nDespués: vitrina online profesional 🛍️\n\n{RUBRO} en {CIUDAD} ya vende con Mendoshop.\n\nProbá {BENEFICIO}: {LINK}',
    array['instagram', 'facebook'],
    '#antesydespues #tiendaonline #emprendimiento',
    true
  ),
  (
    'Tutorial rápido',
    'Contenido educativo de 3 pasos.',
    E'3 pasos para tener tu tienda online hoy:\n\n1️⃣ Registrate en Mendoshop\n2️⃣ Subí fotos y precios\n3️⃣ Compartí tu link y vendé por WhatsApp\n\n{BENEFICIO} → {LINK}',
    array['tiktok', 'instagram'],
    '#tutorial #tiendaonline #whatsapp #emprendedores',
    true
  ),
  (
    'Testimonial',
    'Caso de éxito breve.',
    E'"{RUBRO} en {CIUDAD} ya tiene su tienda online con Mendoshop."\n\nCatálogo, fotos y pedidos por WhatsApp en un solo lugar.\n\nEmpezá con {BENEFICIO}: {LINK}',
    array['facebook', 'instagram'],
    '#testimonial #casoreal #mendoshop',
    true
  )
on conflict do nothing;

insert into public.marketing_campaigns (name, slug, offer_text, landing_path, utm_campaign)
values
  ('7 días gratis', '7dias-gratis', '7 días gratis', '/promo', '7dias_gratis'),
  ('Lanzamiento redes', 'lanzamiento-redes', '7 días gratis sin tarjeta', '/promo', 'lanzamiento_redes')
on conflict (slug) do nothing;
