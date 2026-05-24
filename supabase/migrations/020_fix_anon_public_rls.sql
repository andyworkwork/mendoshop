-- Tras 014/015, anon ya no puede ejecutar user_can_edit_shop ni current_user_is_platform_admin.
-- Políticas "FOR ALL" o SELECT sin TO authenticated fallaban al evaluarse para visitantes.

-- shops
drop policy if exists shops_member_read on public.shops;
drop policy if exists shops_member_update on public.shops;

create policy shops_member_read on public.shops
  for select
  to authenticated
  using (public.user_can_edit_shop(id));

create policy shops_member_update on public.shops
  for update
  to authenticated
  using (public.user_can_edit_shop(id))
  with check (public.user_can_edit_shop(id));

-- shop_members
drop policy if exists shop_members_self on public.shop_members;
drop policy if exists shop_members_insert on public.shop_members;

create policy shop_members_self on public.shop_members
  for select
  to authenticated
  using (user_id = auth.uid() or public.current_user_is_platform_admin());

create policy shop_members_insert on public.shop_members
  for insert
  to authenticated
  with check (user_id = auth.uid() or public.current_user_is_platform_admin());

-- categories
drop policy if exists categories_edit on public.categories;

create policy categories_member_insert on public.categories
  for insert
  to authenticated
  with check (public.user_can_edit_shop(shop_id));

create policy categories_member_update on public.categories
  for update
  to authenticated
  using (public.user_can_edit_shop(shop_id))
  with check (public.user_can_edit_shop(shop_id));

create policy categories_member_delete on public.categories
  for delete
  to authenticated
  using (public.user_can_edit_shop(shop_id));

-- subcategories
drop policy if exists subcategories_edit on public.subcategories;

create policy subcategories_member_insert on public.subcategories
  for insert
  to authenticated
  with check (public.user_can_edit_shop(shop_id));

create policy subcategories_member_update on public.subcategories
  for update
  to authenticated
  using (public.user_can_edit_shop(shop_id))
  with check (public.user_can_edit_shop(shop_id));

create policy subcategories_member_delete on public.subcategories
  for delete
  to authenticated
  using (public.user_can_edit_shop(shop_id));

-- subsubcategorias (legacy)
drop policy if exists subsub_edit on public.subsubcategorias;

create policy subsub_member_insert on public.subsubcategorias
  for insert
  to authenticated
  with check (public.user_can_edit_shop(shop_id));

create policy subsub_member_update on public.subsubcategorias
  for update
  to authenticated
  using (public.user_can_edit_shop(shop_id))
  with check (public.user_can_edit_shop(shop_id));

create policy subsub_member_delete on public.subsubcategorias
  for delete
  to authenticated
  using (public.user_can_edit_shop(shop_id));

-- products
drop policy if exists products_member_read on public.products;

create policy products_member_read on public.products
  for select
  to authenticated
  using (public.user_can_edit_shop(shop_id));

drop policy if exists products_edit on public.products;
drop policy if exists products_update on public.products;
drop policy if exists products_delete on public.products;

create policy products_edit on public.products
  for insert
  to authenticated
  with check (public.user_can_edit_shop(shop_id));

create policy products_update on public.products
  for update
  to authenticated
  using (public.user_can_edit_shop(shop_id))
  with check (public.user_can_edit_shop(shop_id));

create policy products_delete on public.products
  for delete
  to authenticated
  using (public.user_can_edit_shop(shop_id));
