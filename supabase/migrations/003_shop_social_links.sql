-- Redes sociales opcionales en el pie de la vitrina
alter table public.shops
  add column if not exists instagram_url text,
  add column if not exists tiktok_url text,
  add column if not exists social_whatsapp_visible boolean not null default false;
