-- Icono opcional por categoría (slug, ej. coffee, shirt, ring).
alter table public.categories
  add column if not exists icon text;

comment on column public.categories.icon is 'Slug de icono para la vitrina (ver category-icons.ts).';
