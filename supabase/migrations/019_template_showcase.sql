-- Vitrinas del carrusel de la home (editables por admin).
create table if not exists public.template_showcase (
  template_id text primary key,
  shop_name text,
  tagline text,
  banner_path text,
  product_1_name text,
  product_1_price numeric check (product_1_price is null or product_1_price >= 0),
  product_1_image_path text,
  product_2_name text,
  product_2_price numeric check (product_2_price is null or product_2_price >= 0),
  product_2_image_path text,
  updated_at timestamptz not null default now()
);

create trigger template_showcase_updated_at_trg
before update on public.template_showcase
for each row execute function public.shops_updated_at();

alter table public.template_showcase enable row level security;

create policy template_showcase_public_read on public.template_showcase
  for select
  using (true);

create policy template_showcase_admin_write on public.template_showcase
  for all
  to authenticated
  using (public.current_user_is_platform_admin())
  with check (public.current_user_is_platform_admin());

-- Imágenes en shop-images/template-showcase/{id}/...
create policy template_showcase_storage_admin on storage.objects
  for all
  to authenticated
  using (
    bucket_id = 'shop-images'
    and (storage.foldername(name))[1] = 'template-showcase'
    and public.current_user_is_platform_admin()
  )
  with check (
    bucket_id = 'shop-images'
    and (storage.foldername(name))[1] = 'template-showcase'
    and public.current_user_is_platform_admin()
  );
