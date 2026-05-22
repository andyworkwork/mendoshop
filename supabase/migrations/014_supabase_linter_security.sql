-- search_path fijo en trigger de updated_at
create or replace function public.shops_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Storage: quitar listado público del bucket; lectura por URL pública del bucket sigue funcionando.
drop policy if exists shop_images_public_read on storage.objects;

create policy shop_images_member_read on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'shop-images'
    and (storage.foldername(name))[1] is not null
    and public.user_can_edit_shop(((storage.foldername(name))[1])::uuid)
  );

-- RPC helpers: anon solo necesita shop_is_publicly_visible (catálogo público).
revoke execute on function public.current_user_is_platform_admin() from anon;
revoke execute on function public.user_shop_ids() from anon;
revoke execute on function public.user_can_edit_shop(uuid) from anon;

-- increment_shop_views ya restringido en 013; idempotente por si acaso.
revoke execute on function public.increment_shop_views(uuid) from anon, authenticated;

grant execute on function public.increment_shop_views(uuid) to service_role;
grant execute on function public.shop_is_publicly_visible(uuid) to anon, authenticated;
grant execute on function public.user_can_edit_shop(uuid) to authenticated;
grant execute on function public.user_shop_ids() to authenticated;
grant execute on function public.current_user_is_platform_admin() to authenticated;
