-- Permite que un admin de plataforma lea su fila en platform_admins (para checks en la app)
create policy platform_admins_read_own on public.platform_admins
  for select
  to authenticated
  using (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));

-- El admin puede crear tiendas aunque no sea el dueño inicial en shop_members
create policy shops_admin_insert on public.shops
  for insert
  to authenticated
  with check (public.current_user_is_platform_admin());

-- Registro de tu email como admin maestro (editá antes de ejecutar):
-- insert into public.platform_admins (email) values ('tu@email.com') on conflict do nothing;
