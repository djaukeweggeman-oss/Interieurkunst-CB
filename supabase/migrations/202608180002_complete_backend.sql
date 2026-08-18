begin;

-- Bring the first webshop migration forward without discarding existing rows.
alter table public.categories rename column active to is_active;
alter table public.categories add column if not exists description text not null default '';

alter table public.products drop constraint if exists products_status_check;
alter table public.products drop constraint if exists products_vat_rate_check;
alter table public.products drop constraint if exists products_shipping_method_check;
alter table public.products rename column vat_rate to vat_percentage;
alter table public.products rename column year to year_created;
alter table public.products rename column shipping_cents to shipping_cost_cents;
alter table public.products rename column featured to is_featured;
alter table public.products add column if not exists short_description text not null default '';
alter table public.products add column if not exists width_cm numeric(8,2);
alter table public.products add column if not exists height_cm numeric(8,2);
alter table public.products add column if not exists depth_cm numeric(8,2);
alter table public.products add column if not exists weight_grams integer;
alter table public.products add column if not exists is_portfolio_item boolean not null default false;
alter table public.products add column if not exists can_be_shipped boolean not null default false;
alter table public.products add column if not exists can_be_picked_up boolean not null default true;
alter table public.products add column if not exists delivery_in_consultation boolean not null default true;
alter table public.products add column if not exists stock_quantity integer not null default 1;
alter table public.products add column if not exists published_at timestamptz;

alter table public.products alter column status drop default;
update public.products set status = 'draft' where status = 'hidden';
update public.products
set is_portfolio_item = true,
    stock_quantity = 0
where status = 'sold';
update public.products
set can_be_shipped = shipping_method = 'shipping',
    can_be_picked_up = shipping_method in ('pickup', 'consultation'),
    delivery_in_consultation = shipping_method = 'consultation',
    published_at = case when published then coalesce(published_at, created_at) else null end;
update public.products
set status = 'draft', published_at = null
where status in ('available', 'reserved')
  and (price_cents is null or vat_percentage is null or stock_quantity < 1);
alter table public.products alter column status set default 'draft';
alter table public.products
  add constraint products_status_check check (status in ('draft', 'available', 'reserved', 'sold', 'archived')),
  add constraint products_vat_percentage_check check (vat_percentage is null or vat_percentage in (9, 21)),
  add constraint products_price_check check (price_cents is null or price_cents >= 0),
  add constraint products_shipping_cost_check check (shipping_cost_cents is null or shipping_cost_cents >= 0),
  add constraint products_stock_check check (stock_quantity >= 0),
  add constraint products_dimensions_check check (
    (width_cm is null or width_cm > 0) and
    (height_cm is null or height_cm > 0) and
    (depth_cm is null or depth_cm > 0) and
    (weight_grams is null or weight_grams > 0)
  ),
  add constraint products_orderable_check check (
    status not in ('available', 'reserved') or
    (price_cents is not null and vat_percentage is not null and stock_quantity > 0)
  );
alter table public.products drop column published;
alter table public.products drop column shipping_method;

alter table public.product_images
  add constraint product_images_dimensions_check check (
    (width is null or width > 0) and (height is null or height > 0)
  );

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role text not null check (role in ('admin', 'editor')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.profiles (id, role)
select user_id, 'admin' from public.admin_users
on conflict (id) do nothing;

alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders drop constraint if exists orders_delivery_method_check;
alter table public.orders add column if not exists billing_address jsonb;
alter table public.orders add column if not exists shipping_address jsonb;
alter table public.orders add column if not exists currency text not null default 'EUR';
alter table public.orders add column if not exists customer_note text;
alter table public.orders add column if not exists completed_at timestamptz;
alter table public.orders add column if not exists cancelled_at timestamptz;
alter table public.orders add column if not exists refunded_at timestamptz;
alter table public.orders add column if not exists failure_reason text;

update public.orders set status = 'cancelled' where status = 'canceled';
update public.orders set payment_status = 'cancelled' where payment_status = 'canceled';
update public.orders set payment_status = 'pending' where payment_status = 'authorized';
update public.orders
set shipping_address = case
  when address is null and postal_code is null and city is null then null
  else jsonb_strip_nulls(jsonb_build_object(
    'address_line', address,
    'postal_code', postal_code,
    'city', city,
    'country_code', 'NL'
  ))
end;
alter table public.orders
  add constraint orders_status_check check (status in ('pending', 'awaiting_payment', 'paid', 'processing', 'shipped', 'completed', 'cancelled', 'refunded')),
  add constraint orders_payment_status_check check (payment_status in ('open', 'pending', 'paid', 'failed', 'expired', 'cancelled', 'refunded')),
  add constraint orders_delivery_method_check check (delivery_method in ('pickup', 'shipping', 'consultation')),
  add constraint orders_amounts_check check (
    subtotal_cents >= 0 and shipping_cents >= 0 and total_cents = subtotal_cents + shipping_cents
  ),
  add constraint orders_currency_check check (currency = 'EUR'),
  add constraint orders_billing_address_check check (billing_address is null or jsonb_typeof(billing_address) = 'object'),
  add constraint orders_shipping_address_check check (shipping_address is null or jsonb_typeof(shipping_address) = 'object');
alter table public.orders drop column address;
alter table public.orders drop column postal_code;
alter table public.orders drop column city;

alter table public.order_items rename column price_cents to unit_price_cents;
alter table public.order_items rename column vat_rate to vat_percentage;
alter table public.order_items add column if not exists product_slug text;
alter table public.order_items add column if not exists vat_amount_cents integer;
alter table public.order_items add column if not exists total_cents integer;
alter table public.order_items add column if not exists created_at timestamptz not null default now();
update public.order_items oi
set product_slug = p.slug,
    vat_amount_cents = round((oi.unit_price_cents * oi.vat_percentage) / (100 + oi.vat_percentage)),
    total_cents = oi.unit_price_cents * oi.quantity
from public.products p
where p.id = oi.product_id;
alter table public.order_items alter column product_slug set not null;
alter table public.order_items alter column vat_amount_cents set not null;
alter table public.order_items alter column total_cents set not null;
alter table public.order_items
  add constraint order_items_amounts_check check (
    quantity > 0 and unit_price_cents >= 0 and vat_amount_cents >= 0 and total_cents = unit_price_cents * quantity
  );

alter table public.reservations add column if not exists status text not null default 'active';
update public.reservations
set status = case
  when converted_at is not null then 'converted'
  when released_at is not null then 'released'
  when expires_at <= now() then 'expired'
  else 'active'
end;
alter table public.reservations
  add constraint reservations_status_check check (status in ('active', 'converted', 'expired', 'released'));
drop index if exists public.one_open_reservation_per_product;
create unique index one_active_reservation_per_product
  on public.reservations(product_id) where status = 'active';
drop index if exists public.reservations_expiry_idx;
create index reservations_expiry_idx
  on public.reservations(expires_at) where status = 'active';

alter table public.commission_requests drop constraint if exists commission_requests_status_check;
alter table public.commission_requests rename column type to commission_type;
alter table public.commission_requests rename column size to preferred_size;
alter table public.commission_requests rename column style to preferred_style;
alter table public.commission_requests add column if not exists preferred_colours text;
alter table public.commission_requests add column if not exists reference_image_path text;
alter table public.commission_requests add column if not exists admin_notes text;
alter table public.commission_requests add column if not exists submission_hash text;
alter table public.commission_requests add column if not exists updated_at timestamptz not null default now();
update public.commission_requests set status = 'completed' where status = 'closed';
alter table public.commission_requests
  add constraint commission_requests_status_check check (status in ('new', 'contacted', 'in_discussion', 'accepted', 'declined', 'completed'));
create unique index commission_requests_submission_hash_idx
  on public.commission_requests(submission_hash) where submission_hash is not null;

alter table public.contact_messages rename to contact_requests;
alter table public.contact_requests add column if not exists phone text;
alter table public.contact_requests add column if not exists admin_notes text;
alter table public.contact_requests add column if not exists submission_hash text;
alter table public.contact_requests add column if not exists updated_at timestamptz not null default now();
create unique index contact_requests_submission_hash_idx
  on public.contact_requests(submission_hash) where submission_hash is not null;

alter table public.site_settings add column if not exists is_public boolean not null default false;

create table public.request_rate_limits (
  scope text not null,
  key_hash text not null,
  window_started_at timestamptz not null default now(),
  hit_count integer not null default 1 check (hit_count > 0),
  updated_at timestamptz not null default now(),
  primary key (scope, key_hash)
);

create table public.payment_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  mollie_payment_id text not null,
  payment_status text not null,
  event_key text not null unique,
  processed_at timestamptz not null default now()
);

create table public.email_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null check (event_type in (
    'order_received', 'payment_confirmed', 'order_shipped',
    'new_order_admin', 'new_contact_request', 'new_commission_request'
  )),
  recipient text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed', 'disabled')),
  provider_message_id text,
  last_error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'categories', 'products', 'orders', 'commission_requests',
    'contact_requests', 'site_settings', 'profiles', 'request_rate_limits'
  ] loop
    execute format('drop trigger if exists set_updated_at on public.%I', table_name);
    execute format(
      'create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()',
      table_name
    );
  end loop;
end;
$$;

create index if not exists products_category_idx on public.products(category_id);
create index if not exists products_status_idx on public.products(status);
create index if not exists products_publication_idx on public.products(published_at desc) where published_at is not null;
create index if not exists products_featured_idx on public.products(is_featured) where is_featured;
create index if not exists product_images_product_sort_idx on public.product_images(product_id, sort_order);
create index if not exists orders_status_idx on public.orders(status, created_at desc);
create index if not exists orders_payment_status_idx on public.orders(payment_status, created_at desc);
create index if not exists orders_customer_email_idx on public.orders(lower(customer_email));
create index if not exists commission_requests_status_idx on public.commission_requests(status, created_at desc);
create index if not exists contact_requests_status_idx on public.contact_requests(status, created_at desc);

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'editor')
  )
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  )
$$;

revoke all on function public.is_staff() from public;
revoke all on function public.is_admin() from public;
grant execute on function public.is_staff() to authenticated;
grant execute on function public.is_admin() to authenticated;

-- Replace policies inherited from the first migration.
drop policy if exists "Public reads active categories" on public.categories;
drop policy if exists "Public reads published products" on public.products;
drop policy if exists "Public reads images of published products" on public.product_images;
drop policy if exists "Admins manage categories" on public.categories;
drop policy if exists "Admins manage products" on public.products;
drop policy if exists "Admins manage product images" on public.product_images;
drop policy if exists "Admins view their membership" on public.admin_users;
drop policy if exists "Admins manage orders" on public.orders;
drop policy if exists "Admins manage order items" on public.order_items;
drop policy if exists "Admins manage reservations" on public.reservations;
drop policy if exists "Admins manage commission requests" on public.commission_requests;
drop policy if exists "Admins manage contact messages" on public.contact_requests;
drop policy if exists "Admins manage settings" on public.site_settings;

alter table public.profiles enable row level security;
alter table public.request_rate_limits enable row level security;
alter table public.payment_events enable row level security;
alter table public.email_events enable row level security;

create policy "Public reads active categories"
  on public.categories for select to anon, authenticated using (is_active);
create policy "Public reads visible products"
  on public.products for select to anon, authenticated
  using (published_at is not null and archived_at is null and status in ('available', 'reserved', 'sold'));
create policy "Public reads visible product images"
  on public.product_images for select to anon, authenticated
  using (exists (
    select 1 from public.products p
    where p.id = product_id
      and p.published_at is not null
      and p.archived_at is null
      and p.status in ('available', 'reserved', 'sold')
  ));
create policy "Public reads public settings"
  on public.site_settings for select to anon, authenticated using (is_public);
create policy "Staff manages categories"
  on public.categories for all to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "Staff manages products"
  on public.products for all to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "Staff manages product images"
  on public.product_images for all to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "Users read own profile"
  on public.profiles for select to authenticated using (id = auth.uid());
create policy "Admins manage profiles"
  on public.profiles for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Staff manages orders"
  on public.orders for all to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "Staff manages order items"
  on public.order_items for all to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "Staff manages reservations"
  on public.reservations for all to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "Staff manages commission requests"
  on public.commission_requests for all to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "Staff manages contact requests"
  on public.contact_requests for all to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "Admins manage settings"
  on public.site_settings for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins read payment events"
  on public.payment_events for select to authenticated using ((select public.is_admin()));
create policy "Admins read email events"
  on public.email_events for select to authenticated using ((select public.is_admin()));

revoke all on public.orders, public.order_items, public.reservations,
  public.commission_requests, public.contact_requests, public.profiles,
  public.request_rate_limits, public.payment_events, public.email_events from anon;

create or replace function public.check_rate_limit(
  p_scope text,
  p_key_hash text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean language plpgsql security definer set search_path = public
as $$
declare allowed boolean;
begin
  if length(p_scope) < 1 or length(p_key_hash) < 16 or p_limit < 1 or p_window_seconds < 1 then
    raise exception 'invalid rate limit input';
  end if;

  delete from public.request_rate_limits
  where updated_at < now() - interval '7 days';

  insert into public.request_rate_limits(scope, key_hash, window_started_at, hit_count)
  values (p_scope, p_key_hash, now(), 1)
  on conflict (scope, key_hash) do update
  set hit_count = case
        when public.request_rate_limits.window_started_at <= now() - make_interval(secs => p_window_seconds)
          then 1
        else public.request_rate_limits.hit_count + 1
      end,
      window_started_at = case
        when public.request_rate_limits.window_started_at <= now() - make_interval(secs => p_window_seconds)
          then now()
        else public.request_rate_limits.window_started_at
      end,
      updated_at = now()
  returning hit_count <= p_limit into allowed;

  return allowed;
end;
$$;

create or replace function public.release_expired_reservations()
returns integer language plpgsql security definer set search_path = public
as $$
declare released_count integer;
begin
  with expired as (
    update public.reservations
    set status = 'expired', released_at = coalesce(released_at, now())
    where status = 'active' and expires_at <= now()
    returning product_id, order_id
  ), released_products as (
    update public.products p
    set status = 'available', updated_at = now()
    where p.status = 'reserved'
      and exists (select 1 from expired e where e.product_id = p.id)
      and not exists (
        select 1 from public.reservations active
        where active.product_id = p.id and active.status = 'active'
      )
    returning p.id
  )
  select count(*) into released_count from expired;

  update public.orders o
  set status = 'cancelled', payment_status = 'expired', cancelled_at = coalesce(cancelled_at, now())
  where o.status = 'awaiting_payment'
    and exists (
      select 1 from public.reservations r
      where r.order_id = o.id and r.status = 'expired'
    );

  return released_count;
end;
$$;

drop function if exists public.reserve_products_for_checkout(uuid[], jsonb, text);
create function public.reserve_products_for_checkout(
  p_product_ids uuid[],
  p_customer jsonb,
  p_delivery_method text
)
returns table(
  order_id uuid,
  public_token uuid,
  subtotal_cents integer,
  shipping_cents integer,
  total_cents integer,
  order_number text
)
language plpgsql security definer set search_path = public
as $$
declare
  v_order_id uuid := gen_random_uuid();
  v_public_token uuid := gen_random_uuid();
  v_order_number text := 'CB-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.order_number_seq')::text, 6, '0');
  v_subtotal integer;
  v_shipping integer := 0;
  v_count integer;
  v_distinct_count integer;
  v_reservation_minutes integer := 15;
  v_expires timestamptz;
  v_shipping_address jsonb;
begin
  perform public.release_expired_reservations();

  select count(distinct product_id) into v_distinct_count
  from unnest(p_product_ids) as product_ids(product_id);
  if coalesce(array_length(p_product_ids, 1), 0) = 0
     or array_length(p_product_ids, 1) > 10
     or v_distinct_count <> array_length(p_product_ids, 1)
     or p_delivery_method not in ('pickup', 'shipping', 'consultation') then
    raise exception 'invalid checkout';
  end if;

  if jsonb_typeof(p_customer) <> 'object'
     or length(trim(coalesce(p_customer->>'name', ''))) < 2
     or length(trim(coalesce(p_customer->>'email', ''))) < 3
     or length(trim(coalesce(p_customer->>'phone', ''))) < 6 then
    raise exception 'invalid customer';
  end if;

  v_shipping_address := p_customer->'shipping_address';
  if p_delivery_method = 'shipping' and (
    jsonb_typeof(v_shipping_address) <> 'object'
    or length(trim(coalesce(v_shipping_address->>'address_line', ''))) < 3
    or length(trim(coalesce(v_shipping_address->>'postal_code', ''))) < 4
    or length(trim(coalesce(v_shipping_address->>'city', ''))) < 2
  ) then
    raise exception 'invalid shipping address';
  end if;

  select greatest(1, least(60, coalesce((value->>'minutes')::integer, 15)))
  into v_reservation_minutes
  from public.site_settings
  where key = 'checkout.reservation' limit 1;
  v_reservation_minutes := coalesce(v_reservation_minutes, 15);
  v_expires := now() + make_interval(mins => v_reservation_minutes);

  perform 1 from public.products where id = any(p_product_ids) order by id for update;

  select count(*), coalesce(sum(price_cents), 0),
    case when p_delivery_method = 'shipping' then coalesce(sum(shipping_cost_cents), 0) else 0 end
  into v_count, v_subtotal, v_shipping
  from public.products
  where id = any(p_product_ids)
    and published_at is not null
    and archived_at is null
    and status = 'available'
    and stock_quantity = 1
    and price_cents is not null
    and vat_percentage is not null
    and (
      (p_delivery_method = 'shipping' and can_be_shipped) or
      (p_delivery_method = 'pickup' and can_be_picked_up) or
      (p_delivery_method = 'consultation' and delivery_in_consultation)
    );

  if v_count <> array_length(p_product_ids, 1) then
    raise exception 'product unavailable';
  end if;

  insert into public.orders(
    id, public_token, order_number, status, payment_status,
    customer_name, customer_email, customer_phone,
    billing_address, shipping_address, delivery_method,
    subtotal_cents, shipping_cents, total_cents, currency,
    customer_note, reservation_expires_at
  ) values (
    v_order_id, v_public_token, v_order_number, 'awaiting_payment', 'open',
    trim(p_customer->>'name'), lower(trim(p_customer->>'email')), trim(p_customer->>'phone'),
    p_customer->'billing_address', v_shipping_address, p_delivery_method,
    v_subtotal, v_shipping, v_subtotal + v_shipping, 'EUR',
    nullif(trim(p_customer->>'note'), ''), v_expires
  );

  insert into public.order_items(
    order_id, product_id, product_name, product_slug, quantity,
    unit_price_cents, vat_percentage, vat_amount_cents, total_cents
  )
  select v_order_id, id, name, slug, 1, price_cents, vat_percentage,
    round((price_cents * vat_percentage) / (100 + vat_percentage)), price_cents
  from public.products where id = any(p_product_ids);

  insert into public.reservations(product_id, order_id, status, expires_at)
  select id, v_order_id, 'active', v_expires
  from public.products where id = any(p_product_ids);

  update public.products
  set status = 'reserved', updated_at = now()
  where id = any(p_product_ids);

  return query select v_order_id, v_public_token, v_subtotal, v_shipping,
    v_subtotal + v_shipping, v_order_number;
end;
$$;

create or replace function public.release_order_reservation(p_order_id uuid)
returns void language plpgsql security definer set search_path = public
as $$
begin
  update public.reservations
  set status = 'released', released_at = coalesce(released_at, now())
  where order_id = p_order_id and status = 'active';

  update public.products p
  set status = 'available', updated_at = now()
  where p.status = 'reserved'
    and exists (
      select 1 from public.order_items oi
      where oi.order_id = p_order_id and oi.product_id = p.id
    )
    and not exists (
      select 1 from public.reservations r
      where r.product_id = p.id and r.status = 'active'
    );

  update public.orders
  set status = 'cancelled', payment_status = case when payment_status = 'open' then 'cancelled' else payment_status end,
      cancelled_at = coalesce(cancelled_at, now())
  where id = p_order_id and status = 'awaiting_payment';
end;
$$;

drop function if exists public.process_mollie_payment(uuid, text, text);
create function public.process_mollie_payment(
  p_order_id uuid,
  p_payment_id text,
  p_status text
)
returns boolean language plpgsql security definer set search_path = public
as $$
declare
  v_current_payment_status text;
  v_existing_payment_id text;
  v_normalized_status text;
begin
  v_normalized_status := case when p_status = 'canceled' then 'cancelled' else p_status end;
  if v_normalized_status not in ('open', 'pending', 'paid', 'failed', 'expired', 'cancelled', 'refunded') then
    raise exception 'unsupported payment status';
  end if;

  select payment_status, mollie_payment_id
  into v_current_payment_status, v_existing_payment_id
  from public.orders where id = p_order_id for update;
  if not found then raise exception 'order not found'; end if;
  if v_existing_payment_id is not null and v_existing_payment_id <> p_payment_id then
    raise exception 'payment mismatch';
  end if;

  insert into public.payment_events(order_id, mollie_payment_id, payment_status, event_key)
  values (p_order_id, p_payment_id, v_normalized_status, p_payment_id || ':' || v_normalized_status)
  on conflict (event_key) do nothing;
  if not found then return false; end if;

  if v_current_payment_status = 'paid' and v_normalized_status <> 'refunded' then
    return false;
  end if;

  update public.orders
  set mollie_payment_id = p_payment_id,
      payment_status = v_normalized_status,
      updated_at = now()
  where id = p_order_id;

  if v_normalized_status = 'paid' then
    update public.orders
    set status = 'paid', paid_at = coalesce(paid_at, now()), failure_reason = null
    where id = p_order_id;
    update public.reservations
    set status = 'converted', converted_at = coalesce(converted_at, now())
    where order_id = p_order_id and status = 'active';
    update public.products p
    set status = 'sold', stock_quantity = 0, updated_at = now()
    where exists (
      select 1 from public.order_items oi
      where oi.order_id = p_order_id and oi.product_id = p.id
    );
  elsif v_normalized_status = 'refunded' then
    update public.orders
    set status = 'refunded', refunded_at = coalesce(refunded_at, now())
    where id = p_order_id;
  elsif v_normalized_status in ('failed', 'expired', 'cancelled') then
    update public.orders
    set failure_reason = v_normalized_status
    where id = p_order_id;
    perform public.release_order_reservation(p_order_id);
    update public.orders
    set payment_status = v_normalized_status
    where id = p_order_id;
  end if;

  return true;
end;
$$;

revoke all on function public.check_rate_limit(text, text, integer, integer) from public, anon, authenticated;
revoke all on function public.release_expired_reservations() from public, anon, authenticated;
revoke all on function public.reserve_products_for_checkout(uuid[], jsonb, text) from public, anon, authenticated;
revoke all on function public.release_order_reservation(uuid) from public, anon, authenticated;
revoke all on function public.process_mollie_payment(uuid, text, text) from public, anon, authenticated;
grant execute on function public.check_rate_limit(text, text, integer, integer) to service_role;
grant execute on function public.release_expired_reservations() to service_role;
grant execute on function public.reserve_products_for_checkout(uuid[], jsonb, text) to service_role;
grant execute on function public.release_order_reservation(uuid) to service_role;
grant execute on function public.process_mollie_payment(uuid, text, text) to service_role;

-- Storage: public product imagery and private commission references.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('product-images', 'product-images', false, 10485760, array['image/jpeg','image/png','image/webp']),
  ('commission-uploads', 'commission-uploads', false, 10485760, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Staff upload product images" on storage.objects;
drop policy if exists "Public read published product images" on storage.objects;
drop policy if exists "Staff read product images" on storage.objects;
drop policy if exists "Staff update product images" on storage.objects;
drop policy if exists "Staff delete product images" on storage.objects;
drop policy if exists "Staff read commission uploads" on storage.objects;
drop policy if exists "Staff delete commission uploads" on storage.objects;

create policy "Public read published product images"
  on storage.objects for select to anon, authenticated
  using (
    bucket_id = 'product-images' and exists (
      select 1
      from public.product_images pi
      join public.products p on p.id = pi.product_id
      where pi.storage_path = storage.objects.name
        and p.published_at is not null
        and p.archived_at is null
        and p.status in ('available', 'reserved', 'sold')
    )
  );
create policy "Staff read product images"
  on storage.objects for select to authenticated
  using (bucket_id = 'product-images' and (select public.is_staff()));
create policy "Staff upload product images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and (select public.is_staff()));
create policy "Staff update product images"
  on storage.objects for update to authenticated
  using (bucket_id = 'product-images' and (select public.is_staff()))
  with check (bucket_id = 'product-images' and (select public.is_staff()));
create policy "Staff delete product images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and (select public.is_staff()));
create policy "Staff read commission uploads"
  on storage.objects for select to authenticated
  using (bucket_id = 'commission-uploads' and (select public.is_staff()));
create policy "Staff delete commission uploads"
  on storage.objects for delete to authenticated
  using (bucket_id = 'commission-uploads' and (select public.is_staff()));

-- The legacy bucket is no longer used and must not remain world-readable.
update storage.buckets set public = false where id = 'artworks';

insert into public.site_settings(key, value, is_public) values
  ('business.public', '{"business_name":"Interieurkunst CB","artist_name":"Carolien Ballast"}'::jsonb, true),
  ('contact.public', '{"email":"caroliennm@hotmail.com","phone":"06-1369 2365"}'::jsonb, true),
  ('delivery.public', '{"pickup":"In overleg","shipping":"Per werk ingesteld"}'::jsonb, true),
  ('social.public', '{}'::jsonb, true),
  ('seo.public', '{}'::jsonb, true),
  ('checkout.reservation', '{"minutes":15}'::jsonb, false)
on conflict (key) do nothing;

commit;
