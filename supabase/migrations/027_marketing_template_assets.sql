-- Plantillas de post con imágenes/videos de la biblioteca (publicación manual).
alter table public.marketing_post_templates
  add column if not exists asset_ids uuid[] not null default '{}';

create index if not exists marketing_post_templates_asset_ids_idx
  on public.marketing_post_templates using gin (asset_ids);
