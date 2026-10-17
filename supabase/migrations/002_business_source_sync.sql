-- MR ALL IN Store: metadata for idempotent Business stock publishing.
-- Additive only: existing Store products and admin-managed promo fields are preserved.
-- Run once in the SAME Supabase project used by the Store and Business cloud snapshot.
alter table public.products
  add column if not exists business_source_id text,
  add column if not exists business_sync_at timestamptz;

create unique index if not exists products_business_source_id_uidx
  on public.products (business_source_id)
  where business_source_id is not null;

comment on column public.products.business_source_id is
  'Stable source identity for a product published from MR ALL IN Business. Null for Store-managed products.';
comment on column public.products.business_sync_at is
  'Last timestamp the product stock/price/status was published from Business.';
