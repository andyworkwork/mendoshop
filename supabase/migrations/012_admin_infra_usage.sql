-- Métricas de infraestructura solo vía service_role (panel admin Gasto).
create or replace function public.admin_infra_usage_stats()
returns jsonb
language plpgsql
security definer
set search_path = public, storage, pg_catalog
as $$
begin
  return jsonb_build_object(
    'db_bytes', pg_database_size(current_database()),
    'storage_bytes', coalesce(
      (select sum((metadata->>'size')::bigint) from storage.objects where bucket_id = 'shop-images'),
      0
    ),
    'storage_files', coalesce(
      (select count(*)::int from storage.objects where bucket_id = 'shop-images'),
      0
    ),
    'shops_count', (select count(*)::int from public.shops),
    'products_count', (select count(*)::int from public.products),
    'active_products_count', (
      select count(*)::int from public.products where active = true
    ),
    'categories_count', (select count(*)::int from public.categories),
    'total_shop_views', coalesce((select sum(view_count)::bigint from public.shops), 0),
    'captured_at', now()
  );
end;
$$;

revoke all on function public.admin_infra_usage_stats() from public;
revoke all on function public.admin_infra_usage_stats() from anon, authenticated;
grant execute on function public.admin_infra_usage_stats() to service_role;
