create extension if not exists pgcrypto;

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id),
  name text not null,
  slug text not null unique,
  description text not null default '',
  price_cents integer check (price_cents is null or price_cents >= 0),
  vat_rate numeric(5,2) check (vat_rate is null or vat_rate in (9, 21)),
  status text not null default 'hidden' check (status in ('available', 'reserved', 'sold', 'hidden')),
  dimensions text,
  material text,
  technique text,
  year integer check (year is null or year between 1900 and 2200),
  shipping_method text not null default 'consultation' check (shipping_method in ('pickup', 'shipping', 'consultation')),
  shipping_cents integer check (shipping_cents is null or shipping_cents >= 0),
  featured boolean not null default false,
  published boolean not null default false,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  storage_path text not null unique,
  alt_text text not null default '',
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  width integer,
  height integer,
  created_at timestamptz not null default now()
);

create unique index product_one_primary_image on public.product_images(product_id) where is_primary;

create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  public_token uuid not null unique default gen_random_uuid(),
  order_number text not null unique,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  address text,
  postal_code text,
  city text,
  delivery_method text not null check (delivery_method in ('pickup', 'shipping', 'consultation')),
  subtotal_cents integer not null check (subtotal_cents >= 0),
  shipping_cents integer not null default 0 check (shipping_cents >= 0),
  total_cents integer not null check (total_cents >= 0),
  status text not null default 'awaiting_payment' check (status in ('awaiting_payment', 'paid', 'processing', 'shipped', 'completed', 'canceled')),
  payment_status text not null default 'open',
  mollie_payment_id text unique,
  reservation_expires_at timestamptz,
  paid_at timestamptz,
  processed_at timestamptz,
  shipped_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  product_name text not null,
  price_cents integer not null check (price_cents >= 0),
  vat_rate numeric(5,2) not null check (vat_rate in (9, 21)),
  quantity integer not null default 1 check (quantity = 1),
  unique(order_id, product_id)
);

create table public.reservations (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id),
  order_id uuid not null references public.orders(id) on delete cascade,
  expires_at timestamptz not null,
  released_at timestamptz,
  converted_at timestamptz,
  created_at timestamptz not null default now(),
  check (not (released_at is not null and converted_at is not null))
);

create unique index one_open_reservation_per_product on public.reservations(product_id) where released_at is null and converted_at is null;
create index reservations_expiry_idx on public.reservations(expires_at) where released_at is null and converted_at is null;

create table public.commission_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  type text not null,
  size text,
  style text,
  desired_date date,
  message text not null,
  status text not null default 'new' check (status in ('new', 'contacted', 'accepted', 'closed')),
  created_at timestamptz not null default now()
);

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  status text not null default 'new' check (status in ('new', 'read', 'replied', 'closed')),
  created_at timestamptz not null default now()
);

create table public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.admin_users where user_id = auth.uid()) $$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.admin_users enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.reservations enable row level security;
alter table public.commission_requests enable row level security;
alter table public.contact_messages enable row level security;
alter table public.site_settings enable row level security;

create policy "Public reads active categories" on public.categories for select to anon, authenticated using (active);
create policy "Public reads published products" on public.products for select to anon, authenticated using (published and status <> 'hidden' and archived_at is null);
create policy "Public reads images of published products" on public.product_images for select to anon, authenticated using (exists (select 1 from public.products p where p.id = product_id and p.published and p.status <> 'hidden' and p.archived_at is null));
create policy "Admins manage categories" on public.categories for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins manage products" on public.products for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins manage product images" on public.product_images for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins view their membership" on public.admin_users for select to authenticated using (user_id = auth.uid());
create policy "Admins manage orders" on public.orders for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins manage order items" on public.order_items for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins manage reservations" on public.reservations for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins manage commission requests" on public.commission_requests for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins manage contact messages" on public.contact_messages for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins manage settings" on public.site_settings for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

revoke all on public.orders, public.order_items, public.reservations, public.commission_requests, public.contact_messages, public.admin_users, public.site_settings from anon;

create sequence if not exists public.order_number_seq;

create or replace function public.reserve_products_for_checkout(p_product_ids uuid[], p_customer jsonb, p_delivery_method text)
returns table(order_id uuid, public_token uuid, total_cents integer, order_number text)
language plpgsql security definer set search_path = public
as $$
declare
  v_order_id uuid := gen_random_uuid();
  v_public_token uuid := gen_random_uuid();
  v_order_number text := 'CB-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.order_number_seq')::text, 5, '0');
  v_subtotal integer;
  v_count integer;
  v_expires timestamptz := now() + interval '15 minutes';
begin
  if coalesce(array_length(p_product_ids, 1), 0) = 0 or p_delivery_method not in ('pickup', 'shipping', 'consultation') then raise exception 'invalid checkout'; end if;
  update public.reservations r set released_at = now() where r.expires_at <= now() and r.released_at is null and r.converted_at is null;
  update public.products p set status = 'available', updated_at = now() where p.status = 'reserved' and not exists (select 1 from public.reservations r where r.product_id = p.id and r.released_at is null and r.converted_at is null and r.expires_at > now());
  perform 1 from public.products where id = any(p_product_ids) order by id for update;
  select count(*), sum(price_cents) into v_count, v_subtotal from public.products where id = any(p_product_ids) and published and archived_at is null and status = 'available' and price_cents is not null and vat_rate is not null;
  if v_count <> array_length(p_product_ids, 1) then raise exception 'product unavailable'; end if;
  insert into public.orders(id, public_token, order_number, customer_name, customer_email, customer_phone, address, postal_code, city, delivery_method, subtotal_cents, shipping_cents, total_cents, reservation_expires_at)
  values(v_order_id, v_public_token, v_order_number, p_customer->>'name', p_customer->>'email', p_customer->>'phone', nullif(p_customer->>'address',''), nullif(p_customer->>'postal_code',''), nullif(p_customer->>'city',''), p_delivery_method, v_subtotal, 0, v_subtotal, v_expires);
  insert into public.order_items(order_id, product_id, product_name, price_cents, vat_rate) select v_order_id, id, name, price_cents, vat_rate from public.products where id = any(p_product_ids);
  insert into public.reservations(product_id, order_id, expires_at) select id, v_order_id, v_expires from public.products where id = any(p_product_ids);
  update public.products set status = 'reserved', updated_at = now() where id = any(p_product_ids);
  return query select v_order_id, v_public_token, v_subtotal, v_order_number;
end $$;

create or replace function public.release_order_reservation(p_order_id uuid)
returns void language plpgsql security definer set search_path = public
as $$
begin
  update public.reservations set released_at = coalesce(released_at, now()) where order_id = p_order_id and converted_at is null;
  update public.products p set status = 'available', updated_at = now() where exists (select 1 from public.order_items oi where oi.order_id = p_order_id and oi.product_id = p.id) and p.status = 'reserved';
  update public.orders set status = 'canceled', updated_at = now() where id = p_order_id and status = 'awaiting_payment';
end $$;

create or replace function public.process_mollie_payment(p_order_id uuid, p_payment_id text, p_status text)
returns void language plpgsql security definer set search_path = public
as $$
declare v_current text;
begin
  select payment_status into v_current from public.orders where id = p_order_id for update;
  if not found then raise exception 'order not found'; end if;
  if v_current = 'paid' then return; end if;
  update public.orders set mollie_payment_id = p_payment_id, payment_status = p_status, updated_at = now() where id = p_order_id;
  if p_status = 'paid' then
    update public.orders set status = 'paid', paid_at = now() where id = p_order_id;
    update public.reservations set converted_at = now() where order_id = p_order_id and released_at is null and converted_at is null;
    update public.products p set status = 'sold', updated_at = now() where exists (select 1 from public.order_items oi where oi.order_id = p_order_id and oi.product_id = p.id);
  elsif p_status in ('failed', 'canceled', 'expired') then
    perform public.release_order_reservation(p_order_id);
  end if;
end $$;

revoke all on function public.reserve_products_for_checkout(uuid[], jsonb, text) from public, anon, authenticated;
revoke all on function public.release_order_reservation(uuid) from public, anon, authenticated;
revoke all on function public.process_mollie_payment(uuid, text, text) from public, anon, authenticated;
grant execute on function public.reserve_products_for_checkout(uuid[], jsonb, text) to service_role;
grant execute on function public.release_order_reservation(uuid) to service_role;
grant execute on function public.process_mollie_payment(uuid, text, text) to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('artworks', 'artworks', true, 10485760, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "Admins upload artwork images" on storage.objects for insert to authenticated with check (bucket_id = 'artworks' and (select public.is_admin()));
create policy "Admins update artwork images" on storage.objects for update to authenticated using (bucket_id = 'artworks' and (select public.is_admin())) with check (bucket_id = 'artworks' and (select public.is_admin()));
create policy "Admins delete artwork images" on storage.objects for delete to authenticated using (bucket_id = 'artworks' and (select public.is_admin()));

insert into public.categories(name, slug, sort_order) values ('Schilderijen', 'schilderijen', 10), ('Potten', 'potten', 20), ('Objecten', 'objecten', 30) on conflict (slug) do nothing;

