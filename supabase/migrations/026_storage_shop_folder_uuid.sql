-- Evitar cast a uuid del primer segmento cuando es "marketing", "template-showcase", etc.
create or replace function public.storage_object_shop_id(object_name text)
returns uuid
language plpgsql
stable
set search_path = public
as $$
declare
  seg text;
begin
  seg := (storage.foldername(object_name))[1];
  if seg is null then
    return null;
  end if;
  if seg !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return null;
  end if;
  return seg::uuid;
exception
  when invalid_text_representation then
    return null;
end;
$$;

drop policy if exists shop_images_member_upload on storage.objects;
create policy shop_images_member_upload on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'shop-images'
    and auth.uid() is not null
    and public.storage_object_shop_id(name) is not null
    and public.user_can_edit_shop(public.storage_object_shop_id(name))
  );

drop policy if exists shop_images_member_update on storage.objects;
create policy shop_images_member_update on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'shop-images'
    and public.storage_object_shop_id(name) is not null
    and public.user_can_edit_shop(public.storage_object_shop_id(name))
  );

drop policy if exists shop_images_member_delete on storage.objects;
create policy shop_images_member_delete on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'shop-images'
    and public.storage_object_shop_id(name) is not null
    and public.user_can_edit_shop(public.storage_object_shop_id(name))
  );

drop policy if exists shop_images_member_read on storage.objects;
create policy shop_images_member_read on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'shop-images'
    and public.storage_object_shop_id(name) is not null
    and public.user_can_edit_shop(public.storage_object_shop_id(name))
  );
