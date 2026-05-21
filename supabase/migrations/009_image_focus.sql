-- Encuadre de imágenes (object-position en %): 50 = centro.
alter table public.shops
  add column if not exists banner_focus_x smallint not null default 50,
  add column if not exists banner_focus_y smallint not null default 50;

alter table public.products
  add column if not exists image_focus_x smallint not null default 50,
  add column if not exists image_focus_y smallint not null default 50;

alter table public.shops
  add constraint shops_banner_focus_x_range check (banner_focus_x between 0 and 100),
  add constraint shops_banner_focus_y_range check (banner_focus_y between 0 and 100);

alter table public.products
  add constraint products_image_focus_x_range check (image_focus_x between 0 and 100),
  add constraint products_image_focus_y_range check (image_focus_y between 0 and 100);
