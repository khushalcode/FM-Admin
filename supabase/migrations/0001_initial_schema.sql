-- ============================================================================
-- Food Munch — Unified Food App (no grocery/food split — single module)
-- Run this in Supabase SQL Editor
-- ============================================================================

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
create extension if not exists "postgis" with schema extensions;
create extension if not exists "pg_trgm";

do $$ begin create type user_role as enum ('admin','customer','vendor','delivery'); exception when duplicate_object then null; end $$;
do $$ begin create type order_status as enum ('pending','accepted','preparing','ready','picked_up','on_the_way','delivered','cancelled','rejected'); exception when duplicate_object then null; end $$;
do $$ begin create type payment_method as enum ('cash','card','wallet','online'); exception when duplicate_object then null; end $$;
do $$ begin create type payment_status as enum ('pending','paid','failed','refunded'); exception when duplicate_object then null; end $$;
do $$ begin create type vehicle_type as enum ('bike','scooter','cycle','car'); exception when duplicate_object then null; end $$;
do $$ begin create type discount_type as enum ('percentage','fixed'); exception when duplicate_object then null; end $$;
do $$ begin create type banner_redirect as enum ('store','category','product','url','none'); exception when duplicate_object then null; end $$;
do $$ begin create type notification_type as enum ('order','promo','system','chat'); exception when duplicate_object then null; end $$;
do $$ begin create type wallet_tx_type as enum ('credit','debit'); exception when duplicate_object then null; end $$;
do $$ begin create type wallet_tx_source as enum ('order','refund','topup','payout','cashback','adjustment'); exception when duplicate_object then null; end $$;
do $$ begin create type disbursement_status as enum ('pending','approved','rejected','paid'); exception when duplicate_object then null; end $$;
do $$ begin create type payment_provider as enum ('razorpay','stripe','cash','wallet'); exception when duplicate_object then null; end $$;

-- USERS
create table if not exists users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null, phone text, full_name text not null,
  role user_role not null default 'customer',
  avatar_url text, is_active boolean not null default true,
  is_phone_verified boolean not null default false,
  is_email_verified boolean not null default false,
  fcm_token text, preferred_language text not null default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_users_email on users(email);
create index if not exists idx_users_role on users(role);

-- CUSTOMERS
create table if not exists customers (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade unique,
  total_orders int not null default 0, total_spent numeric(12,2) not null default 0,
  wallet_balance numeric(12,2) not null default 0, loyalty_points int not null default 0,
  is_blocked boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

-- VENDORS
create table if not exists vendors (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade unique,
  total_sales numeric(12,2) not null default 0, total_orders int not null default 0,
  wallet_balance numeric(12,2) not null default 0,
  rating numeric(3,2) not null default 0, is_approved boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

-- DELIVERY MEN
create table if not exists delivery_men (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade unique,
  vehicle_type vehicle_type not null default 'bike', vehicle_number text,
  is_online boolean not null default false, is_approved boolean not null default false,
  wallet_balance numeric(12,2) not null default 0,
  rating numeric(3,2) not null default 0, total_deliveries int not null default 0,
  total_earnings numeric(12,2) not null default 0, current_order_id uuid,
  location geography(point,4326), last_location_update timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists idx_dm_online on delivery_men(is_online) where is_online = true;
create index if not exists idx_dm_location on delivery_men using gist(location);

-- STORES (unified — no module_type, single food app)
create table if not exists stores (
  id uuid primary key default uuid_generate_v4(),
  name text not null, slug text unique not null,
  description text, logo_url text, cover_url text,
  address text not null, location geography(point,4326),
  phone text not null, email text,
  vendor_id uuid not null references vendors(id) on delete restrict,
  is_active boolean not null default true, is_open boolean not null default true,
  rating numeric(3,2) not null default 0, reviews_count int not null default 0,
  minimum_order numeric(10,2) not null default 0, delivery_fee numeric(10,2) not null default 0,
  delivery_time_minutes int not null default 30, commission_percentage numeric(5,2) not null default 10.00,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists idx_stores_vendor on stores(vendor_id);
create index if not exists idx_stores_active on stores(is_active) where is_active = true;
create index if not exists idx_stores_name_trgm on stores using gin(name gin_trgm_ops);

-- DELIVERY AREAS (by pincode)
create table if not exists delivery_areas (
  id uuid primary key default uuid_generate_v4(),
  store_id uuid not null references stores(id) on delete cascade,
  pincode text not null,
  area_name text,
  delivery_fee numeric(10,2) not null default 0,
  delivery_time_minutes int not null default 30,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (store_id, pincode)
);
create index if not exists idx_delivery_areas_pincode on delivery_areas(pincode);
create index if not exists idx_delivery_areas_store on delivery_areas(store_id);

-- CATEGORIES (unified — no module_type)
create table if not exists categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null, slug text unique not null,
  parent_id uuid references categories(id) on delete set null,
  icon_url text, position int not null default 0,
  is_active boolean not null default true,
  stores_count int not null default 0, items_count int not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

-- PRODUCTS (unified — no module_type)
create table if not exists products (
  id uuid primary key default uuid_generate_v4(),
  store_id uuid not null references stores(id) on delete cascade,
  category_id uuid not null references categories(id) on delete restrict,
  name text not null, slug text not null,
  description text, image_url text, images text[] default '{}',
  price numeric(10,2) not null, discount_price numeric(10,2),
  unit text not null, stock int not null default 0,
  low_stock_threshold int not null default 10,
  is_available boolean not null default true, is_featured boolean not null default false,
  rating numeric(3,2) not null default 0, reviews_count int not null default 0,
  tags text[] default '{}', is_veg boolean, prep_time_minutes int,
  brand text, barcode text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (store_id, slug)
);
create index if not exists idx_products_store on products(store_id);
create index if not exists idx_products_category on products(category_id);
create index if not exists idx_products_available on products(is_available) where is_available = true;
create index if not exists idx_products_name_trgm on products using gin(name gin_trgm_ops);

-- ADDRESSES
create table if not exists addresses (
  id uuid primary key default uuid_generate_v4(),
  customer_id uuid not null references customers(id) on delete cascade,
  label text not null, full_address text not null, landmark text,
  pincode text, latitude numeric(10,7), longitude numeric(10,7), phone text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists idx_addresses_customer on addresses(customer_id);

-- CART
create table if not exists cart_items (
  id uuid primary key default uuid_generate_v4(),
  customer_id uuid not null references customers(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  store_id uuid not null references stores(id) on delete cascade,
  quantity int not null default 1 check (quantity > 0),
  unit_price numeric(10,2) not null, addons jsonb default '[]', note text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (customer_id, product_id)
);

-- COUPONS
create table if not exists coupons (
  id uuid primary key default uuid_generate_v4(),
  code text unique not null, title text not null, description text,
  discount_type discount_type not null, discount_value numeric(10,2) not null,
  minimum_order numeric(10,2) not null default 0, maximum_discount numeric(10,2),
  usage_limit int not null default 1000, used_count int not null default 0,
  per_user_limit int not null default 1, start_date timestamptz not null,
  end_date timestamptz not null, is_active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

-- ORDERS
create table if not exists orders (
  id uuid primary key default uuid_generate_v4(),
  order_code text unique not null,
  customer_id uuid not null references customers(id) on delete restrict,
  store_id uuid not null references stores(id) on delete restrict,
  vendor_id uuid not null references vendors(id) on delete restrict,
  delivery_man_id uuid references delivery_men(id) on delete set null,
  item_count int not null default 0,
  subtotal numeric(12,2) not null default 0, delivery_fee numeric(10,2) not null default 0,
  discount numeric(10,2) not null default 0, tax numeric(10,2) not null default 0,
  total numeric(12,2) not null default 0, delivery_earnings numeric(10,2) not null default 0,
  payment_method payment_method not null default 'cash',
  payment_status payment_status not null default 'pending',
  status order_status not null default 'pending',
  delivery_address text not null, delivery_pincode text,
  delivery_latitude numeric(10,7), delivery_longitude numeric(10,7),
  note text, scheduled_at timestamptz,
  accepted_at timestamptz, picked_up_at timestamptz, delivered_at timestamptz,
  cancelled_at timestamptz, cancel_reason text,
  rating int check (rating between 1 and 5), rating_comment text,
  coupon_id uuid references coupons(id) on delete set null,
  serial_num serial,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists idx_orders_customer on orders(customer_id);
create index if not exists idx_orders_store on orders(store_id);
create index if not exists idx_orders_status on orders(status);
create index if not exists idx_orders_created on orders(created_at desc);

-- ORDER ITEMS
create table if not exists order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid not null references products(id) on delete restrict,
  name text not null, image_url text, unit text not null, price numeric(10,2) not null,
  quantity int not null check (quantity > 0),
  store_id uuid not null, store_name text not null, addons jsonb default '[]',
  created_at timestamptz not null default now()
);

-- ORDER STATUS HISTORY (audit trail)
create table if not exists order_status_history (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references orders(id) on delete cascade,
  status order_status not null, changed_by uuid references users(id) on delete set null,
  note text, created_at timestamptz not null default now()
);

-- WALLETS
create table if not exists wallets (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade unique,
  balance numeric(12,2) not null default 0, currency text not null default 'INR',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

-- WALLET TRANSACTIONS
create table if not exists wallet_transactions (
  id uuid primary key default uuid_generate_v4(),
  wallet_id uuid not null references wallets(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  type wallet_tx_type not null, source wallet_tx_source not null,
  amount numeric(12,2) not null, balance_after numeric(12,2) not null,
  description text, reference_id uuid,
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists idx_wallet_tx_user on wallet_transactions(user_id);

-- PAYMENTS
create table if not exists payments (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references orders(id) on delete cascade,
  customer_id uuid not null references customers(id) on delete cascade,
  provider payment_provider not null, provider_order_id text, provider_payment_id text,
  amount numeric(12,2) not null, currency text not null default 'INR',
  status payment_status not null default 'pending', method text, raw_response jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

-- OTP CODES
create table if not exists otp_codes (
  id uuid primary key default uuid_generate_v4(),
  phone text not null, code text not null, purpose text not null default 'login',
  attempts int not null default 0, is_used boolean not null default false,
  expires_at timestamptz not null, created_at timestamptz not null default now()
);

-- NOTIFICATIONS
create table if not exists notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade, user_role user_role,
  title text not null, body text not null, type notification_type not null,
  data jsonb default '{}', is_read boolean not null default false, read_at timestamptz,
  fcm_message_id text, created_at timestamptz not null default now()
);
create index if not exists idx_notifications_user on notifications(user_id);

-- BANNERS
create table if not exists banners (
  id uuid primary key default uuid_generate_v4(),
  title text not null, image_url text not null,
  redirect_type banner_redirect not null default 'none',
  redirect_id uuid, redirect_url text, position int not null default 0,
  is_active boolean not null default true, start_date timestamptz, end_date timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

-- REVIEWS
create table if not exists reviews (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references orders(id) on delete cascade,
  customer_id uuid not null references customers(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  store_id uuid not null references stores(id) on delete cascade,
  delivery_man_id uuid references delivery_men(id) on delete set null,
  rating int not null check (rating between 1 and 5), comment text, reply text,
  replied_at timestamptz, is_published boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

-- FAVOURITES
create table if not exists favourites (
  id uuid primary key default uuid_generate_v4(),
  customer_id uuid not null references customers(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  created_at timestamptz not null default now(), unique (customer_id, product_id)
);

-- DISBURSEMENTS
create table if not exists disbursements (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade, user_role user_role not null,
  amount numeric(12,2) not null, status disbursement_status not null default 'pending',
  method text, bank_account jsonb, utr text, requested_at timestamptz not null default now(),
  processed_at timestamptz, note text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

-- CHAT
create table if not exists chat_conversations (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references orders(id) on delete cascade, type text not null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists chat_messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references chat_conversations(id) on delete cascade,
  sender_id uuid not null references users(id) on delete cascade, message text not null,
  attachment_url text, is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- AUDIT LOG (admin actions)
create table if not exists audit_log (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);
create index if not exists idx_audit_user on audit_log(user_id);
create index if not exists idx_audit_entity on audit_log(entity_type, entity_id);
create index if not exists idx_audit_created on audit_log(created_at desc);

-- TRIGGERS
create or replace function trigger_set_timestamp() returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;
do $$ declare t text; begin for t in select unnest(array['users','customers','vendors','delivery_men','stores','categories','products','addresses','cart_items','coupons','orders','wallets','wallet_transactions','payments','notifications','banners','reviews','disbursements','chat_conversations']) loop execute format('drop trigger if exists set_timestamp_%I on %I; create trigger set_timestamp_%I before update on %I for each row execute function trigger_set_timestamp();', t, t, t, t); end loop; end $$;

create or replace function generate_order_code() returns trigger language plpgsql as $$ begin new.order_code = 'FM-' || to_char(now(), 'YYMMDD') || '-' || lpad(new.serial_num::text, 5, '0'); return new; end; $$;
drop trigger if exists trg_order_code on orders;
create trigger trg_order_code before insert on orders for each row execute function generate_order_code();

create or replace function handle_new_auth_user() returns trigger language plpgsql security definer set search_path = public as $$ begin insert into public.users (id, email, full_name, role, is_email_verified) values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)), coalesce((new.raw_user_meta_data->>'role')::user_role, 'customer'), coalesce(new.email_confirmed_at is not null, false)); return new; end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_auth_user();

create or replace function update_store_rating() returns trigger language plpgsql as $$ begin update stores set rating = coalesce((select avg(rating) from reviews where store_id = new.store_id), 0), reviews_count = (select count(*) from reviews where store_id = new.store_id) where id = new.store_id; return new; end; $$;
drop trigger if exists trg_update_store_rating on reviews;
create trigger trg_update_store_rating after insert on reviews for each row execute function update_store_rating();

create or replace function update_customer_totals() returns trigger language plpgsql as $$ begin if (new.status = 'delivered' and (old.status is null or old.status <> 'delivered')) then update customers set total_orders = total_orders + 1, total_spent = total_spent + new.total, loyalty_points = loyalty_points + floor(new.total / 100) where id = new.customer_id; end if; return new; end; $$;
drop trigger if exists trg_update_customer_totals on orders;
create trigger trg_update_customer_totals after update on orders for each row execute function update_customer_totals();

create or replace function update_vendor_totals() returns trigger language plpgsql as $$ begin if (new.status = 'delivered' and (old.status is null or old.status <> 'delivered')) then update vendors set total_orders = total_orders + 1, total_sales = total_sales + new.subtotal where id = new.vendor_id; end if; return new; end; $$;
drop trigger if exists trg_update_vendor_totals on orders;
create trigger trg_update_vendor_totals after update on orders for each row execute function update_vendor_totals();

create or replace function update_delivery_man_totals() returns trigger language plpgsql as $$ begin if (new.status = 'delivered' and (old.status is null or old.status <> 'delivered')) then if new.delivery_man_id is not null then update delivery_men set total_deliveries = total_deliveries + 1, total_earnings = total_earnings + new.delivery_earnings, current_order_id = null where id = new.delivery_man_id; end if; end if; return new; end; $$;
drop trigger if exists trg_update_delivery_man_totals on orders;
create trigger trg_update_delivery_man_totals after update on orders for each row execute function update_delivery_man_totals();

-- Helper functions
create or replace function decrement_stock(p_product_id uuid, p_quantity int) returns void language plpgsql as $$ begin update products set stock = stock - p_quantity where id = p_product_id; end; $$;
create or replace function increment_otp_attempts(p_phone text) returns void language plpgsql as $$ begin update otp_codes set attempts = attempts + 1 where phone = p_phone and is_used = false order by created_at desc limit 1; end; $$;
create or replace function update_delivery_location(p_dm_id uuid, p_lat float, p_lng float) returns void language plpgsql as $$ begin update delivery_men set location = st_setsrid(st_makepoint(p_lng, p_lat), 4326), last_location_update = now() where id = p_dm_id; end; $$;

-- Audit log helper
create or replace function log_audit(p_user_id uuid, p_action text, p_entity_type text, p_entity_id uuid, p_old jsonb, p_new jsonb) returns void language plpgsql as $$ begin insert into audit_log (user_id, action, entity_type, entity_id, old_values, new_values) values (p_user_id, p_action, p_entity_type, p_entity_id, p_old, p_new); end; $$;

-- RLS
alter table users enable row level security;
alter table customers enable row level security;
alter table vendors enable row level security;
alter table delivery_men enable row level security;
alter table stores enable row level security;
alter table delivery_areas enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table addresses enable row level security;
alter table cart_items enable row level security;
alter table coupons enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table wallets enable row level security;
alter table wallet_transactions enable row level security;
alter table payments enable row level security;
alter table otp_codes enable row level security;
alter table notifications enable row level security;
alter table banners enable row level security;
alter table reviews enable row level security;
alter table favourites enable row level security;
alter table disbursements enable row level security;
alter table chat_conversations enable row level security;
alter table chat_messages enable row level security;
alter table audit_log enable row level security;

create or replace function is_admin() returns boolean language sql stable security definer set search_path = public as $$ select exists (select 1 from users where id = auth.uid() and role = 'admin') $$;

drop policy if exists users_sel on users; create policy users_sel on users for select using (id = auth.uid() or is_admin());
drop policy if exists users_upd on users; create policy users_upd on users for update using (id = auth.uid() or is_admin());
drop policy if exists users_del on users; create policy users_del on users for delete using (is_admin());

drop policy if exists cust_sel on customers; create policy cust_sel on customers for select using (user_id = auth.uid() or is_admin());
drop policy if exists cust_ins on customers; create policy cust_ins on customers for insert with check (user_id = auth.uid() or is_admin());
drop policy if exists cust_upd on customers; create policy cust_upd on customers for update using (is_admin());
drop policy if exists cust_del on customers; create policy cust_del on customers for delete using (is_admin());

drop policy if exists ven_sel on vendors; create policy ven_sel on vendors for select using (user_id = auth.uid() or is_admin());
drop policy if exists ven_upd on vendors; create policy ven_upd on vendors for update using (is_admin());
drop policy if exists ven_del on vendors; create policy ven_del on vendors for delete using (is_admin());

drop policy if exists dm_sel on delivery_men; create policy dm_sel on delivery_men for select using (user_id = auth.uid() or is_admin());
drop policy if exists dm_upd on delivery_men; create policy dm_upd on delivery_men for update using (user_id = auth.uid() or is_admin());
drop policy if exists dm_del on delivery_men; create policy dm_del on delivery_men for delete using (is_admin());

drop policy if exists st_sel on stores; create policy st_sel on stores for select using (is_active = true or is_admin() or vendor_id in (select id from vendors where user_id = auth.uid()));
drop policy if exists st_mod on stores; create policy st_mod on stores for all using (is_admin() or vendor_id in (select id from vendors where user_id = auth.uid()));

drop policy if exists da_sel on delivery_areas; create policy da_sel on delivery_areas for select using (true);
drop policy if exists da_mod on delivery_areas; create policy da_mod on delivery_areas for all using (is_admin() or store_id in (select s.id from stores s join vendors v on v.id = s.vendor_id where v.user_id = auth.uid()));

drop policy if exists cat_sel on categories; create policy cat_sel on categories for select using (is_active = true or is_admin());
drop policy if exists cat_mod on categories; create policy cat_mod on categories for all using (is_admin());

drop policy if exists p_sel on products; create policy p_sel on products for select using (is_available = true or is_admin() or store_id in (select s.id from stores s join vendors v on v.id = s.vendor_id where v.user_id = auth.uid()));
drop policy if exists p_mod on products; create policy p_mod on products for all using (is_admin() or store_id in (select s.id from stores s join vendors v on v.id = s.vendor_id where v.user_id = auth.uid()));

drop policy if exists addr_pol on addresses; create policy addr_pol on addresses for all using (customer_id in (select id from customers where user_id = auth.uid()) or is_admin());
drop policy if exists cart_pol on cart_items; create policy cart_pol on cart_items for all using (customer_id in (select id from customers where user_id = auth.uid()));
drop policy if exists cp_sel on coupons; create policy cp_sel on coupons for select using (is_active = true or is_admin());
drop policy if exists cp_mod on coupons; create policy cp_mod on coupons for all using (is_admin());

drop policy if exists o_sel on orders; create policy o_sel on orders for select using (customer_id in (select id from customers where user_id = auth.uid()) or vendor_id in (select id from vendors where user_id = auth.uid()) or delivery_man_id in (select id from delivery_men where user_id = auth.uid()) or is_admin());
drop policy if exists o_ins on orders; create policy o_ins on orders for insert with check (customer_id in (select id from customers where user_id = auth.uid()) or is_admin());
drop policy if exists o_upd on orders; create policy o_upd on orders for update using (customer_id in (select id from customers where user_id = auth.uid()) or vendor_id in (select id from vendors where user_id = auth.uid()) or delivery_man_id in (select id from delivery_men where user_id = auth.uid()) or is_admin());
drop policy if exists o_del on orders; create policy o_del on orders for delete using (is_admin());

drop policy if exists oi_sel on order_items; create policy oi_sel on order_items for select using (order_id in (select id from orders where customer_id in (select id from customers where user_id = auth.uid()) or vendor_id in (select id from vendors where user_id = auth.uid()) or delivery_man_id in (select id from delivery_men where user_id = auth.uid()) or is_admin()));

drop policy if exists w_pol on wallets; create policy w_pol on wallets for all using (user_id = auth.uid() or is_admin());
drop policy if exists wt_sel on wallet_transactions; create policy wt_sel on wallet_transactions for select using (user_id = auth.uid() or is_admin());
drop policy if exists wt_ins on wallet_transactions; create policy wt_ins on wallet_transactions for insert with check (is_admin() or user_id = auth.uid());

drop policy if exists n_sel on notifications; create policy n_sel on notifications for select using (user_id = auth.uid() or is_admin());
drop policy if exists n_ins on notifications; create policy n_ins on notifications for insert with check (is_admin() or user_id = auth.uid());
drop policy if exists n_upd on notifications; create policy n_upd on notifications for update using (user_id = auth.uid() or is_admin());

drop policy if exists b_sel on banners; create policy b_sel on banners for select using (is_active = true or is_admin());
drop policy if exists b_mod on banners; create policy b_mod on banners for all using (is_admin());

drop policy if exists r_sel on reviews; create policy r_sel on reviews for select using (is_published = true or is_admin() or customer_id in (select id from customers where user_id = auth.uid()));
drop policy if exists r_ins on reviews; create policy r_ins on reviews for insert with check (customer_id in (select id from customers where user_id = auth.uid()));
drop policy if exists r_upd on reviews; create policy r_upd on reviews for update using (is_admin());

drop policy if exists fav_pol on favourites; create policy fav_pol on favourites for all using (customer_id in (select id from customers where user_id = auth.uid()));
drop policy if exists otp_pol on otp_codes; create policy otp_pol on otp_codes for all using (auth.role() = 'service_role');
drop policy if exists pay_sel on payments; create policy pay_sel on payments for select using (customer_id in (select id from customers where user_id = auth.uid()) or is_admin());
drop policy if exists dis_pol on disbursements; create policy dis_pol on disbursements for all using (user_id = auth.uid() or is_admin());
drop policy if exists audit_sel on audit_log; create policy audit_sel on audit_log for select using (is_admin());

-- STORAGE BUCKETS
insert into storage.buckets (id, name, public) values
  ('product_images','product_images',true),('store_logos','store_logos',true),
  ('store_covers','store_covers',true),('banner_images','banner_images',true),
  ('user_avatars','user_avatars',true),('category_icons','category_icons',true),
  ('chat_attachments','chat_attachments',false),('review_images','review_images',true),
  ('documents','documents',false) on conflict (id) do nothing;

-- REALTIME
alter publication supabase_realtime add table orders;
alter publication supabase_realtime add table order_items;
alter publication supabase_realtime add table order_status_history;
alter publication supabase_realtime add table notifications;
alter publication supabase_realtime add table chat_messages;
alter publication supabase_realtime add table delivery_men;
alter publication supabase_realtime add table cart_items;
alter publication supabase_realtime add table wallet_transactions;
