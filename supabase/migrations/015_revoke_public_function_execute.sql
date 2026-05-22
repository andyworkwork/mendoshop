-- En Postgres el rol PUBLIC (0) hereda EXECUTE; hay que revocar explícitamente.
revoke all on function public.consume_rate_limit(text, int, int) from public;
revoke all on function public.current_user_is_platform_admin() from public;
revoke all on function public.user_shop_ids() from public;
revoke all on function public.user_can_edit_shop(uuid) from public;
revoke all on function public.increment_shop_views(uuid) from public;
revoke all on function public.shop_is_publicly_visible(uuid) from public;

revoke all on function public.consume_rate_limit(text, int, int) from anon, authenticated;
revoke all on function public.current_user_is_platform_admin() from anon;
revoke all on function public.user_shop_ids() from anon;
revoke all on function public.user_can_edit_shop(uuid) from anon;
revoke all on function public.increment_shop_views(uuid) from anon, authenticated;

grant execute on function public.consume_rate_limit(text, int, int) to service_role;
grant execute on function public.increment_shop_views(uuid) to service_role;
grant execute on function public.shop_is_publicly_visible(uuid) to anon, authenticated;
grant execute on function public.user_can_edit_shop(uuid) to authenticated;
grant execute on function public.user_shop_ids() to authenticated;
grant execute on function public.current_user_is_platform_admin() to authenticated;
