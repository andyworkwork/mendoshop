-- record_shop_view_daily solo desde el servidor (service_role).
revoke all on function public.record_shop_view_daily(uuid) from public;
revoke all on function public.record_shop_view_daily(uuid) from anon, authenticated;
grant execute on function public.record_shop_view_daily(uuid) to service_role;
