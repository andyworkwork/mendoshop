-- Lectura pública del bucket (URLs y transformaciones); subida sigue restringida a dueños.
drop policy if exists shop_images_public_read on storage.objects;

create policy shop_images_public_read on storage.objects
  for select
  to public
  using (bucket_id = 'shop-images');
