-- ============================================================================
-- FM-Admin + FA-User — Unified Supabase SQL File (Drop + Recreate, Test-Ready)
-- Version: 3.0  |  Date: 2026-10-15
--
-- This is a SELF-CONTAINED, IDEMPOTENT single SQL file used by BOTH apps:
--   • FM-Admin (Next.js admin console)  → reads/writes all 53 tables
--   • FA-User (Expo React Native app)  → reads stores/products/categories/orders,
--     writes orders/cart/reviews/wallet_transactions/addresses
--
-- Both apps point to the SAME Supabase project (https://dhmeyycjosacuwgtdhfo.supabase.co)
-- and share ONE database. The admin controls all data; the user app consumes it.
--
-- This file:
--   1. Drops all existing tables, enums, functions, triggers (CASCADE)
--   2. Recreates the complete schema (53 tables, 20 enums)
--      - Same table/column names as v1 (drop-in compatible)
--      - Adds `firebase_uid` column to users (FA-User app looks up users by Firebase UID)
--      - All image columns are NOT NULL (mandatory image uploads enforced in admin)
--   3. Inserts working seed data with real Unsplash image URLs
--   4. Sets up RLS policies, triggers, indexes, helper functions
--
-- USAGE (test from scratch):
--   a) Create a fresh Supabase project (or use an existing one)
--   b) Open Supabase SQL Editor → paste this entire file → Run
--   c) All tables, RLS, triggers, and seed data will be created fresh
--   d) The final SELECT at the bottom prints row counts to verify
--
-- For production: drop the "DROP / CLEAN SLATE" section at the top and run only
-- the CREATE / SEED sections (they use "if not exists" so they're idempotent).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. EXTENSIONS
-- ----------------------------------------------------------------------------
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
create extension if not exists "postgis" with schema extensions;
create extension if not exists "pg_trgm";

-- ----------------------------------------------------------------------------
-- 1. CLEAN SLATE — drop everything in reverse dependency order
--    (safe to run on a fresh Supabase project — drops simply no-op)
-- ----------------------------------------------------------------------------

-- Drop SwitchEats extension tables (0003)
drop table if exists pos_orders cascade;
drop table if exists delivery_partner_earnings cascade;
drop table if exists food_approval_queue cascade;
drop table if exists delivery_partner_reviews cascade;
drop table if exists restaurant_reviews cascade;
drop table if exists restaurant_complaints cascade;
drop table if exists pages_social_media cascade;
drop table if exists business_settings cascade;
drop table if exists feature_settings cascade;
drop table if exists broadcast_notifications cascade;
drop table if exists delivery_support_tickets cascade;
drop table if exists order_reassignment_requests cascade;
drop table if exists safety_emergency_reports cascade;
drop table if exists contact_messages cascade;
drop table if exists earning_addon_history cascade;
drop table if exists earning_addons cascade;
drop table if exists delivery_bonus_history cascade;
drop table if exists delivery_bonus cascade;
drop table if exists restaurant_withdrawals cascade;
drop table if exists delivery_withdrawals cascade;
drop table if exists support_tickets cascade;
drop table if exists subscription_bills cascade;
drop table if exists subscription_plans cascade;
drop table if exists employee_roles cascade;
drop table if exists employees cascade;
drop table if exists addons cascade;
drop table if exists zones cascade;

-- Drop base tables (0001)
drop table if exists chat_messages cascade;
drop table if exists chat_conversations cascade;
drop table if exists audit_log cascade;
drop table if exists disbursements cascade;
drop table if exists favourites cascade;
drop table if exists reviews cascade;
drop table if exists banners cascade;
drop table if exists notifications cascade;
drop table if exists otp_codes cascade;
drop table if exists payments cascade;
drop table if exists wallet_transactions cascade;
drop table if exists wallets cascade;
drop table if exists order_status_history cascade;
drop table if exists order_items cascade;
drop table if exists orders cascade;
drop table if exists coupons cascade;
drop table if exists cart_items cascade;
drop table if exists addresses cascade;
drop table if exists products cascade;
drop table if exists categories cascade;
drop table if exists delivery_areas cascade;
drop table if exists stores cascade;
drop table if exists delivery_men cascade;
drop table if exists vendors cascade;
drop table if exists customers cascade;
drop table if exists users cascade;

-- Drop enums
drop type if exists bonus_type cascade;
drop type if exists emergency_type cascade;
drop type if exists employee_role cascade;
drop type if exists subscription_period cascade;
drop type if exists ticket_category cascade;
drop type if exists ticket_priority cascade;
drop type if exists ticket_status cascade;
drop type if exists withdrawal_status cascade;
drop type if exists wallet_tx_source cascade;
drop type if exists wallet_tx_type cascade;
drop type if exists notification_type cascade;
drop type if exists banner_redirect cascade;
drop type if exists disbursement_status cascade;
drop type if exists payment_provider cascade;
drop type if exists discount_type cascade;
drop type if exists vehicle_type cascade;
drop type if exists payment_status cascade;
drop type if exists payment_method cascade;
drop type if exists order_status cascade;
drop type if exists user_role cascade;

-- Drop functions
drop function if exists trigger_set_timestamp() cascade;
drop function if exists generate_order_code() cascade;
drop function if exists handle_new_auth_user() cascade;
drop function if exists update_store_rating() cascade;
drop function if exists update_customer_totals() cascade;
drop function if exists update_vendor_totals() cascade;
drop function if exists update_delivery_man_totals() cascade;
drop function if exists decrement_stock(uuid, int) cascade;
drop function if exists increment_otp_attempts(text) cascade;
drop function if exists update_delivery_location(uuid, float, float) cascade;
drop function if exists log_audit(uuid, text, text, uuid, jsonb, jsonb) cascade;
drop function if exists is_admin() cascade;

-- ============================================================================
-- 2. ENUMS (re-create)
-- ============================================================================
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

-- SwitchEats extension enums
do $$ begin create type employee_role as enum ('Admin','Manager','Customer Care Executive','Operations','Finance'); exception when duplicate_object then null; end $$;
do $$ begin create type ticket_priority as enum ('Low','Medium','High'); exception when duplicate_object then null; end $$;
do $$ begin create type ticket_status as enum ('Open','In Progress','Resolved','Closed'); exception when duplicate_object then null; end $$;
do $$ begin create type ticket_category as enum ('Payment','Order','Technical','Account','Other'); exception when duplicate_object then null; end $$;
do $$ begin create type withdrawal_status as enum ('Pending','Paid','Rejected','Cancelled'); exception when duplicate_object then null; end $$;
do $$ begin create type bonus_type as enum ('Percentage','Amount'); exception when duplicate_object then null; end $$;
do $$ begin create type subscription_period as enum ('Month','Year'); exception when duplicate_object then null; end $$;
do $$ begin create type emergency_type as enum ('Accident','Vehicle Breakdown','Harassment','Other'); exception when duplicate_object then null; end $$;

-- ============================================================================
-- 3. USERS — made standalone (no auth.users FK) so it works in any Supabase project
-- ============================================================================
create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  firebase_uid text unique,
  email text not null unique,
  phone text,
  full_name text not null,
  role user_role not null default 'customer',
  avatar_url text not null,
  is_active boolean not null default true,
  is_phone_verified boolean not null default false,
  is_email_verified boolean not null default false,
  fcm_token text,
  preferred_language text not null default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_users_email on users(email);
create index if not exists idx_users_role on users(role);
create index if not exists idx_users_firebase_uid on users(firebase_uid);

-- CUSTOMERS
create table if not exists customers (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade unique,
  total_orders int not null default 0,
  total_spent numeric(12,2) not null default 0,
  wallet_balance numeric(12,2) not null default 0,
  loyalty_points int not null default 0,
  is_blocked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- VENDORS
create table if not exists vendors (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade unique,
  store_id uuid,
  total_sales numeric(12,2) not null default 0,
  total_orders int not null default 0,
  wallet_balance numeric(12,2) not null default 0,
  rating numeric(3,2) not null default 0,
  is_approved boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- DELIVERY MEN
create table if not exists delivery_men (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade unique,
  vehicle_type vehicle_type not null default 'bike',
  vehicle_number text,
  is_online boolean not null default false,
  is_approved boolean not null default false,
  is_active boolean not null default true,
  wallet_balance numeric(12,2) not null default 0,
  rating numeric(3,2) not null default 0,
  total_deliveries int not null default 0,
  total_earnings numeric(12,2) not null default 0,
  current_order_id uuid,
  location geography(point,4326),
  last_location_update timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_dm_online on delivery_men(is_online) where is_online = true;
create index if not exists idx_dm_location on delivery_men using gist(location);

-- STORES
create table if not exists stores (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique not null,
  description text,
  logo_url text not null,
  cover_url text not null,
  address text not null,
  location geography(point,4326),
  phone text not null,
  email text,
  vendor_id uuid not null references vendors(id) on delete restrict,
  is_active boolean not null default true,
  is_open boolean not null default true,
  rating numeric(3,2) not null default 0,
  reviews_count int not null default 0,
  minimum_order numeric(10,2) not null default 0,
  delivery_fee numeric(10,2) not null default 0,
  delivery_time_minutes int not null default 30,
  commission_percentage numeric(5,2) not null default 10.00,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
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

-- CATEGORIES
create table if not exists categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique not null,
  parent_id uuid references categories(id) on delete set null,
  icon_url text not null,
  position int not null default 0,
  is_active boolean not null default true,
  stores_count int not null default 0,
  items_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- PRODUCTS
create table if not exists products (
  id uuid primary key default uuid_generate_v4(),
  store_id uuid not null references stores(id) on delete cascade,
  category_id uuid not null references categories(id) on delete restrict,
  name text not null,
  slug text not null,
  description text,
  image_url text not null,
  images text[] default '{}',
  price numeric(10,2) not null,
  discount_price numeric(10,2),
  unit text not null,
  stock int not null default 0,
  low_stock_threshold int not null default 10,
  is_available boolean not null default true,
  is_featured boolean not null default false,
  rating numeric(3,2) not null default 0,
  reviews_count int not null default 0,
  tags text[] default '{}',
  is_veg boolean,
  prep_time_minutes int,
  brand text,
  barcode text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
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
  label text not null,
  full_address text not null,
  landmark text,
  pincode text,
  latitude numeric(10,7),
  longitude numeric(10,7),
  phone text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_addresses_customer on addresses(customer_id);

-- CART
create table if not exists cart_items (
  id uuid primary key default uuid_generate_v4(),
  customer_id uuid not null references customers(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  store_id uuid not null references stores(id) on delete cascade,
  quantity int not null default 1 check (quantity > 0),
  unit_price numeric(10,2) not null,
  addons jsonb default '[]',
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (customer_id, product_id)
);

-- COUPONS
create table if not exists coupons (
  id uuid primary key default uuid_generate_v4(),
  code text unique not null,
  title text not null,
  description text,
  discount_type discount_type not null,
  discount_value numeric(10,2) not null,
  minimum_order numeric(10,2) not null default 0,
  maximum_discount numeric(10,2),
  usage_limit int not null default 1000,
  used_count int not null default 0,
  per_user_limit int not null default 1,
  start_date timestamptz not null,
  end_date timestamptz not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
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
  subtotal numeric(12,2) not null default 0,
  delivery_fee numeric(10,2) not null default 0,
  discount numeric(10,2) not null default 0,
  tax numeric(10,2) not null default 0,
  total numeric(12,2) not null default 0,
  delivery_earnings numeric(10,2) not null default 0,
  payment_method payment_method not null default 'cash',
  payment_status payment_status not null default 'pending',
  status order_status not null default 'pending',
  delivery_address text not null,
  delivery_pincode text,
  delivery_latitude numeric(10,7),
  delivery_longitude numeric(10,7),
  note text,
  scheduled_at timestamptz,
  accepted_at timestamptz,
  picked_up_at timestamptz,
  delivered_at timestamptz,
  cancelled_at timestamptz,
  cancel_reason text,
  rating int check (rating between 1 and 5),
  rating_comment text,
  coupon_id uuid references coupons(id) on delete set null,
  serial_num serial,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
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
  name text not null,
  image_url text,
  unit text not null,
  price numeric(10,2) not null,
  quantity int not null check (quantity > 0),
  store_id uuid not null,
  store_name text not null,
  addons jsonb default '[]',
  created_at timestamptz not null default now()
);

-- ORDER STATUS HISTORY (audit trail)
create table if not exists order_status_history (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references orders(id) on delete cascade,
  status order_status not null,
  changed_by uuid references users(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

-- WALLETS
create table if not exists wallets (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade unique,
  balance numeric(12,2) not null default 0,
  currency text not null default 'INR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- WALLET TRANSACTIONS
create table if not exists wallet_transactions (
  id uuid primary key default uuid_generate_v4(),
  wallet_id uuid not null references wallets(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  type wallet_tx_type not null,
  source wallet_tx_source not null,
  amount numeric(12,2) not null,
  balance_after numeric(12,2) not null,
  description text,
  reference_id uuid,
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists idx_wallet_tx_user on wallet_transactions(user_id);

-- PAYMENTS
create table if not exists payments (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references orders(id) on delete cascade,
  customer_id uuid not null references customers(id) on delete cascade,
  provider payment_provider not null,
  provider_order_id text,
  provider_payment_id text,
  amount numeric(12,2) not null,
  currency text not null default 'INR',
  status payment_status not null default 'pending',
  method text,
  raw_response jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- OTP CODES
create table if not exists otp_codes (
  id uuid primary key default uuid_generate_v4(),
  phone text not null,
  code text not null,
  purpose text not null default 'login',
  attempts int not null default 0,
  is_used boolean not null default false,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- NOTIFICATIONS
create table if not exists notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  user_role user_role,
  title text not null,
  body text not null,
  type notification_type not null,
  data jsonb default '{}',
  is_read boolean not null default false,
  read_at timestamptz,
  fcm_message_id text,
  created_at timestamptz not null default now()
);
create index if not exists idx_notifications_user on notifications(user_id);

-- BANNERS
create table if not exists banners (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  image_url text not null,
  redirect_type banner_redirect not null default 'none',
  redirect_id uuid,
  redirect_url text,
  position int not null default 0,
  is_active boolean not null default true,
  start_date timestamptz,
  end_date timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- REVIEWS
create table if not exists reviews (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references orders(id) on delete cascade,
  customer_id uuid not null references customers(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  store_id uuid not null references stores(id) on delete cascade,
  delivery_man_id uuid references delivery_men(id) on delete set null,
  rating int not null check (rating between 1 and 5),
  comment text,
  reply text,
  replied_at timestamptz,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- FAVOURITES
create table if not exists favourites (
  id uuid primary key default uuid_generate_v4(),
  customer_id uuid not null references customers(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (customer_id, product_id)
);

-- DISBURSEMENTS
create table if not exists disbursements (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  user_role user_role not null,
  amount numeric(12,2) not null,
  status disbursement_status not null default 'pending',
  method text,
  bank_account jsonb,
  utr text,
  requested_at timestamptz not null default now(),
  processed_at timestamptz,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- CHAT
create table if not exists chat_conversations (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references orders(id) on delete cascade,
  type text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists chat_messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references chat_conversations(id) on delete cascade,
  sender_id uuid not null references users(id) on delete cascade,
  message text not null,
  attachment_url text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- AUDIT LOG
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

-- ============================================================================
-- 4. SWITCH EATS EXTENSION TABLES
-- ============================================================================

-- ZONES (delivery zone setup)
create table if not exists zones (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  pincode text not null,
  delivery_fee numeric(10,2) not null default 30,
  radius_km numeric(5,2) not null default 5,
  coordinates text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_zones_pincode on zones(pincode);
create index if not exists idx_zones_active on zones(is_active) where is_active = true;

-- ADDONS (restaurant-level add-ons)
create table if not exists addons (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  price numeric(10,2) not null default 0,
  image_url text not null,
  store_id uuid references stores(id) on delete cascade,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_addons_store on addons(store_id);
create index if not exists idx_addons_active on addons(is_active) where is_active = true;

-- EMPLOYEES (sub-admin accounts)
create table if not exists employees (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete set null,
  first_name text not null,
  last_name text not null,
  email text not null unique,
  phone text,
  password_hash text not null,
  image_url text,
  role employee_role not null default 'Customer Care Executive',
  zone text,
  is_active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_employees_role on employees(role);
create index if not exists idx_employees_email on employees(email);

-- EMPLOYEE ROLES
create table if not exists employee_roles (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  description text,
  permissions jsonb not null default '[]'::jsonb,
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- SUBSCRIPTION PLANS
create table if not exists subscription_plans (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  price numeric(10,2) not null,
  period subscription_period not null default 'Month',
  features text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- SUBSCRIPTION BILLS
create table if not exists subscription_bills (
  id uuid primary key default uuid_generate_v4(),
  store_id uuid not null references stores(id) on delete cascade,
  plan_id uuid not null references subscription_plans(id),
  amount numeric(10,2) not null,
  status payment_status not null default 'pending',
  invoice_url text,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_sub_bills_store on subscription_bills(store_id);
create index if not exists idx_sub_bills_status on subscription_bills(status);

-- SUPPORT TICKETS (User & Restaurant)
create table if not exists support_tickets (
  id uuid primary key default uuid_generate_v4(),
  ticket_code text unique not null,
  user_id uuid references users(id) on delete set null,
  user_type text not null check (user_type in ('user','restaurant')),
  subject text not null,
  description text,
  category ticket_category not null default 'Other',
  priority ticket_priority not null default 'Medium',
  status ticket_status not null default 'Open',
  assigned_to uuid references employees(id) on delete set null,
  resolved_at timestamptz,
  resolved_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_tickets_status on support_tickets(status);
create index if not exists idx_tickets_priority on support_tickets(priority);

-- DELIVERY WITHDRAWALS
create table if not exists delivery_withdrawals (
  id uuid primary key default uuid_generate_v4(),
  delivery_man_id uuid not null references delivery_men(id) on delete cascade,
  amount numeric(12,2) not null,
  status withdrawal_status not null default 'Pending',
  bank_name text,
  account_number text,
  ifsc_code text,
  holder_name text,
  upi_id text,
  rejection_reason text,
  processed_at timestamptz,
  rejected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_del_withdrawals_status on delivery_withdrawals(status);
create index if not exists idx_del_withdrawals_dm on delivery_withdrawals(delivery_man_id);

-- RESTAURANT WITHDRAWALS
create table if not exists restaurant_withdrawals (
  id uuid primary key default uuid_generate_v4(),
  store_id uuid not null references stores(id) on delete cascade,
  vendor_id uuid not null references vendors(id) on delete cascade,
  amount numeric(12,2) not null,
  status withdrawal_status not null default 'Pending',
  bank_name text,
  account_number text,
  ifsc_code text,
  holder_name text,
  rejection_reason text,
  processed_at timestamptz,
  rejected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_res_withdrawals_status on restaurant_withdrawals(status);

-- DELIVERY BONUS
create table if not exists delivery_bonus (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  bonus_type bonus_type not null default 'Amount',
  bonus_amount numeric(10,2) not null default 0,
  min_add_money numeric(10,2) not null default 0,
  max_bonus numeric(10,2) not null default 0,
  start_date timestamptz,
  expire_date timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists delivery_bonus_history (
  id uuid primary key default uuid_generate_v4(),
  delivery_man_id uuid not null references delivery_men(id) on delete cascade,
  bonus_id uuid references delivery_bonus(id) on delete set null,
  amount numeric(10,2) not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_bonus_hist_dm on delivery_bonus_history(delivery_man_id);

-- EARNING ADDONS
create table if not exists earning_addons (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  value text not null,
  condition text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists earning_addon_history (
  id uuid primary key default uuid_generate_v4(),
  delivery_man_id uuid not null references delivery_men(id) on delete cascade,
  addon_id uuid references earning_addons(id) on delete set null,
  addon_name text,
  amount numeric(10,2) not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_addon_hist_dm on earning_addon_history(delivery_man_id);

-- CONTACT MESSAGES (User Feedback)
create table if not exists contact_messages (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text not null,
  phone text,
  subject text,
  message text not null,
  rating int check (rating between 1 and 5),
  status text not null default 'unread',
  admin_reply text,
  replied_at timestamptz,
  replied_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_contact_messages_status on contact_messages(status);

-- SAFETY EMERGENCY REPORTS
create table if not exists safety_emergency_reports (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete set null,
  user_type text not null check (user_type in ('customer','delivery')),
  user_name text not null,
  type emergency_type not null default 'Other',
  location text,
  latitude numeric(10,7),
  longitude numeric(10,7),
  description text,
  status text not null default 'open',
  resolved_at timestamptz,
  resolved_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_safety_status on safety_emergency_reports(status);

-- ORDER REASSIGNMENT REQUESTS
create table if not exists order_reassignment_requests (
  id uuid primary key default uuid_generate_v4(),
  delivery_man_id uuid not null references delivery_men(id) on delete cascade,
  order_id uuid not null references orders(id) on delete cascade,
  reason text not null,
  status text not null default 'pending',
  resolved_by uuid references users(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- DELIVERY SUPPORT TICKETS
create table if not exists delivery_support_tickets (
  id uuid primary key default uuid_generate_v4(),
  ticket_code text unique not null,
  delivery_man_id uuid not null references delivery_men(id) on delete cascade,
  category ticket_category not null default 'Other',
  description text not null,
  priority ticket_priority not null default 'Medium',
  status ticket_status not null default 'Open',
  admin_response text,
  responded_at timestamptz,
  responded_by uuid references users(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_del_tickets_status on delivery_support_tickets(status);

-- BROADCAST NOTIFICATIONS
create table if not exists broadcast_notifications (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  body text not null,
  audience text not null default 'all',
  sent_count int not null default 0,
  delivered_count int not null default 0,
  opened_count int not null default 0,
  clicked_count int not null default 0,
  status text not null default 'draft',
  scheduled_at timestamptz,
  sent_at timestamptz,
  sent_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- FEATURE SETTINGS
create table if not exists feature_settings (
  id uuid primary key default uuid_generate_v4(),
  key text not null unique,
  label text not null,
  description text,
  is_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- BUSINESS SETTINGS
create table if not exists business_settings (
  id uuid primary key default uuid_generate_v4(),
  company_name text not null default 'Food Munch',
  support_email text not null default 'support@foodmunch.com',
  support_phone text not null default '+91 80 4567 8900',
  address text,
  pincode text,
  state text,
  country text not null default 'India',
  currency text not null default 'INR',
  timezone text not null default 'Asia/Kolkata',
  logo_url text,
  favicon_url text,
  restaurant_logo_url text,
  restaurant_favicon_url text,
  delivery_logo_url text,
  delivery_favicon_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- PAGES & SOCIAL MEDIA
create table if not exists pages_social_media (
  id uuid primary key default uuid_generate_v4(),
  page_key text not null unique,
  title text not null,
  content text not null,
  meta_description text,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RESTAURANT COMPLAINTS
create table if not exists restaurant_complaints (
  id uuid primary key default uuid_generate_v4(),
  store_id uuid not null references stores(id) on delete cascade,
  subject text not null,
  description text,
  priority ticket_priority not null default 'Medium',
  status ticket_status not null default 'Open',
  resolved_at timestamptz,
  resolved_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_res_complaints_status on restaurant_complaints(status);

-- RESTAURANT REVIEWS (denormalised)
create table if not exists restaurant_reviews (
  id uuid primary key default uuid_generate_v4(),
  store_id uuid not null references stores(id) on delete cascade,
  customer_id uuid references customers(id) on delete set null,
  customer_name text not null,
  rating int not null check (rating between 1 and 5),
  comment text,
  reply text,
  replied_at timestamptz,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_res_reviews_store on restaurant_reviews(store_id);
create index if not exists idx_res_reviews_rating on restaurant_reviews(rating);

-- DELIVERY PARTNER REVIEWS
create table if not exists delivery_partner_reviews (
  id uuid primary key default uuid_generate_v4(),
  delivery_man_id uuid not null references delivery_men(id) on delete cascade,
  customer_id uuid references customers(id) on delete set null,
  customer_name text not null,
  rating int not null check (rating between 1 and 5),
  comment text,
  reply text,
  replied_at timestamptz,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_dm_reviews_dm on delivery_partner_reviews(delivery_man_id);

-- FOOD APPROVAL QUEUE
create table if not exists food_approval_queue (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references products(id) on delete cascade,
  store_id uuid not null references stores(id) on delete cascade,
  status text not null default 'pending',
  reviewed_by uuid references users(id) on delete set null,
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_food_approval_status on food_approval_queue(status);

-- DELIVERY PARTNER EARNINGS
create table if not exists delivery_partner_earnings (
  id uuid primary key default uuid_generate_v4(),
  delivery_man_id uuid not null references delivery_men(id) on delete cascade,
  period text not null default 'all',
  from_date timestamptz,
  to_date timestamptz,
  total_deliveries int not null default 0,
  base_earnings numeric(12,2) not null default 0,
  bonus numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_dm_earnings_dm on delivery_partner_earnings(delivery_man_id);

-- POS ORDERS (walk-in counter sales)
create table if not exists pos_orders (
  id uuid primary key default uuid_generate_v4(),
  order_code text unique not null,
  store_id uuid not null references stores(id) on delete restrict,
  customer_name text not null default 'Walk-in Customer',
  items jsonb not null default '[]'::jsonb,
  item_count int not null default 0,
  subtotal numeric(12,2) not null default 0,
  tax_amount numeric(10,2) not null default 0,
  total numeric(12,2) not null default 0,
  payment_method text not null default 'cash',
  served_by uuid references employees(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists idx_pos_orders_store on pos_orders(store_id);
create index if not exists idx_pos_orders_created on pos_orders(created_at desc);

-- ============================================================================
-- 5. TRIGGERS & HELPER FUNCTIONS
-- ============================================================================
create or replace function trigger_set_timestamp() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$ declare t text; begin
  for t in select unnest(array[
    'users','customers','vendors','delivery_men','stores','categories','products',
    'addresses','cart_items','coupons','orders','wallets','wallet_transactions',
    'payments','notifications','banners','reviews','disbursements','chat_conversations',
    'zones','addons','employees','employee_roles','subscription_plans','subscription_bills',
    'support_tickets','delivery_withdrawals','restaurant_withdrawals','delivery_bonus',
    'delivery_bonus_history','earning_addons','earning_addon_history','contact_messages',
    'safety_emergency_reports','order_reassignment_requests','delivery_support_tickets',
    'broadcast_notifications','feature_settings','business_settings','pages_social_media',
    'restaurant_complaints','restaurant_reviews','delivery_partner_reviews',
    'food_approval_queue','delivery_partner_earnings','pos_orders'
  ]) loop
    execute format(
      'drop trigger if exists set_timestamp_%I on %I; create trigger set_timestamp_%I before update on %I for each row execute function trigger_set_timestamp();',
      t, t, t, t
    );
  end loop;
end $$;

create or replace function generate_order_code() returns trigger language plpgsql as $$
begin
  new.order_code = 'FM-' || to_char(now(), 'YYMMDD') || '-' || lpad(new.serial_num::text, 5, '0');
  return new;
end;
$$;
drop trigger if exists trg_order_code on orders;
create trigger trg_order_code before insert on orders for each row execute function generate_order_code();

create or replace function update_store_rating() returns trigger language plpgsql as $$
begin
  update stores set
    rating = coalesce((select avg(rating) from reviews where store_id = new.store_id), 0),
    reviews_count = (select count(*) from reviews where store_id = new.store_id)
  where id = new.store_id;
  return new;
end;
$$;
drop trigger if exists trg_update_store_rating on reviews;
create trigger trg_update_store_rating after insert on reviews for each row execute function update_store_rating();

create or replace function update_customer_totals() returns trigger language plpgsql as $$
begin
  if (new.status = 'delivered' and (old.status is null or old.status <> 'delivered')) then
    update customers set
      total_orders = total_orders + 1,
      total_spent = total_spent + new.total,
      loyalty_points = loyalty_points + floor(new.total / 100)
    where id = new.customer_id;
  end if;
  return new;
end;
$$;
drop trigger if exists trg_update_customer_totals on orders;
create trigger trg_update_customer_totals after update on orders for each row execute function update_customer_totals();

create or replace function update_vendor_totals() returns trigger language plpgsql as $$
begin
  if (new.status = 'delivered' and (old.status is null or old.status <> 'delivered')) then
    update vendors set
      total_orders = total_orders + 1,
      total_sales = total_sales + new.subtotal
    where id = new.vendor_id;
  end if;
  return new;
end;
$$;
drop trigger if exists trg_update_vendor_totals on orders;
create trigger trg_update_vendor_totals after update on orders for each row execute function update_vendor_totals();

create or replace function update_delivery_man_totals() returns trigger language plpgsql as $$
begin
  if (new.status = 'delivered' and (old.status is null or old.status <> 'delivered')) then
    if new.delivery_man_id is not null then
      update delivery_men set
        total_deliveries = total_deliveries + 1,
        total_earnings = total_earnings + new.delivery_earnings,
        current_order_id = null
      where id = new.delivery_man_id;
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists trg_update_delivery_man_totals on orders;
create trigger trg_update_delivery_man_totals after update on orders for each row execute function update_delivery_man_totals();

-- Helper functions
create or replace function decrement_stock(p_product_id uuid, p_quantity int) returns void language plpgsql as $$
begin
  update products set stock = stock - p_quantity where id = p_product_id;
end;
$$;

create or replace function increment_otp_attempts(p_phone text) returns void language plpgsql as $$
begin
  update otp_codes set attempts = attempts + 1
  where phone = p_phone and is_used = false
  order by created_at desc limit 1;
end;
$$;

create or replace function update_delivery_location(p_dm_id uuid, p_lat float, p_lng float) returns void language plpgsql as $$
begin
  update delivery_men set
    location = st_setsrid(st_makepoint(p_lng, p_lat), 4326),
    last_location_update = now()
  where id = p_dm_id;
end;
$$;

create or replace function log_audit(
  p_user_id uuid, p_action text, p_entity_type text, p_entity_id uuid,
  p_old jsonb, p_new jsonb
) returns void language plpgsql as $$
begin
  insert into audit_log (user_id, action, entity_type, entity_id, old_values, new_values)
  values (p_user_id, p_action, p_entity_type, p_entity_id, p_old, p_new);
end;
$$;

-- ============================================================================
-- 6. RLS — enable on all tables
-- ============================================================================
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
alter table zones enable row level security;
alter table addons enable row level security;
alter table employees enable row level security;
alter table employee_roles enable row level security;
alter table subscription_plans enable row level security;
alter table subscription_bills enable row level security;
alter table support_tickets enable row level security;
alter table delivery_withdrawals enable row level security;
alter table restaurant_withdrawals enable row level security;
alter table delivery_bonus enable row level security;
alter table delivery_bonus_history enable row level security;
alter table earning_addons enable row level security;
alter table earning_addon_history enable row level security;
alter table contact_messages enable row level security;
alter table safety_emergency_reports enable row level security;
alter table order_reassignment_requests enable row level security;
alter table delivery_support_tickets enable row level security;
alter table broadcast_notifications enable row level security;
alter table feature_settings enable row level security;
alter table business_settings enable row level security;
alter table pages_social_media enable row level security;
alter table restaurant_complaints enable row level security;
alter table restaurant_reviews enable row level security;
alter table delivery_partner_reviews enable row level security;
alter table food_approval_queue enable row level security;
alter table delivery_partner_earnings enable row level security;
alter table pos_orders enable row level security;

-- RLS helper
create or replace function is_admin() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from users where id = auth.uid() and role = 'admin')
$$;

-- For a fresh test project, we can disable RLS to keep things simple.
-- Comment out the next block if you want RLS enforced.
alter table users disable row level security;
alter table customers disable row level security;
alter table vendors disable row level security;
alter table delivery_men disable row level security;
alter table stores disable row level security;
alter table delivery_areas disable row level security;
alter table categories disable row level security;
alter table products disable row level security;
alter table addresses disable row level security;
alter table cart_items disable row level security;
alter table coupons disable row level security;
alter table orders disable row level security;
alter table order_items disable row level security;
alter table wallets disable row level security;
alter table wallet_transactions disable row level security;
alter table payments disable row level security;
alter table otp_codes disable row level security;
alter table notifications disable row level security;
alter table banners disable row level security;
alter table reviews disable row level security;
alter table favourites disable row level security;
alter table disbursements disable row level security;
alter table chat_conversations disable row level security;
alter table chat_messages disable row level security;
alter table audit_log disable row level security;
alter table zones disable row level security;
alter table addons disable row level security;
alter table employees disable row level security;
alter table employee_roles disable row level security;
alter table subscription_plans disable row level security;
alter table subscription_bills disable row level security;
alter table support_tickets disable row level security;
alter table delivery_withdrawals disable row level security;
alter table restaurant_withdrawals disable row level security;
alter table delivery_bonus disable row level security;
alter table delivery_bonus_history disable row level security;
alter table earning_addons disable row level security;
alter table earning_addon_history disable row level security;
alter table contact_messages disable row level security;
alter table safety_emergency_reports disable row level security;
alter table order_reassignment_requests disable row level security;
alter table delivery_support_tickets disable row level security;
alter table broadcast_notifications disable row level security;
alter table feature_settings disable row level security;
alter table business_settings disable row level security;
alter table pages_social_media disable row level security;
alter table restaurant_complaints disable row level security;
alter table restaurant_reviews disable row level security;
alter table delivery_partner_reviews disable row level security;
alter table food_approval_queue disable row level security;
alter table delivery_partner_earnings disable row level security;
alter table pos_orders disable row level security;

-- ============================================================================
-- 7. STORAGE BUCKETS
-- ============================================================================
insert into storage.buckets (id, name, public) values
  ('product_images','product_images',true),
  ('store_logos','store_logos',true),
  ('store_covers','store_covers',true),
  ('banner_images','banner_images',true),
  ('user_avatars','user_avatars',true),
  ('category_icons','category_icons',true),
  ('chat_attachments','chat_attachments',false),
  ('review_images','review_images',true),
  ('documents','documents',false)
on conflict (id) do nothing;

-- ============================================================================
-- 8. REALTIME PUBLICATION
-- ============================================================================
do $$ begin
  alter publication supabase_realtime add table orders;
exception when others then null; end $$;
do $$ begin
  alter publication supabase_realtime add table order_items;
exception when others then null; end $$;
do $$ begin
  alter publication supabase_realtime add table order_status_history;
exception when others then null; end $$;
do $$ begin
  alter publication supabase_realtime add table notifications;
exception when others then null; end $$;
do $$ begin
  alter publication supabase_realtime add table chat_messages;
exception when others then null; end $$;
do $$ begin
  alter publication supabase_realtime add table delivery_men;
exception when others then null; end $$;
do $$ begin
  alter publication supabase_realtime add table cart_items;
exception when others then null; end $$;
do $$ begin
  alter publication supabase_realtime add table wallet_transactions;
exception when others then null; end $$;

-- ============================================================================
-- 9. SEED DATA — works against the actual schema (no broken refs)
-- ============================================================================

-- Sample users (id is a fixed UUID for testing — Supabase auth integration can override later)
-- firebase_uid is set to mock values for testing the user-app's firebase_uid lookup
insert into users (id, firebase_uid, email, phone, full_name, role, is_active, is_email_verified, avatar_url) values
  ('a0000000-0000-0000-0000-000000000001', 'mock_admin_1',    'admin@freshcart.com',     '+918000000001', 'Admin User',          'admin',    true, true, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200'),
  ('a0000000-0000-0000-0000-000000000002', 'mock_customer_1', 'rahul.sharma@example.com','+919800000001', 'Rahul Sharma',        'customer', true, true, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200'),
  ('a0000000-0000-0000-0000-000000000003', 'mock_customer_2', 'priya.patel@example.com', '+919800000002', 'Priya Patel',         'customer', true, true, 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200'),
  ('a0000000-0000-0000-0000-000000000004', 'mock_customer_3', 'amit.kumar@example.com',  '+919800000003', 'Amit Kumar',          'customer', true, true, 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200'),
  ('a0000000-0000-0000-0000-000000000005', 'mock_vendor_1',   'spice.garden@vendor.com', '+919810000001', 'Spice Garden Owner',  'vendor',   true, true, 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200'),
  ('a0000000-0000-0000-0000-000000000006', 'mock_vendor_2',   'freshmart@vendor.com',    '+919810000002', 'FreshMart Owner',     'vendor',   true, true, 'https://images.unsplash.com/photo-1556157382-97eda2d62296?w=200'),
  ('a0000000-0000-0000-0000-000000000007', 'mock_vendor_3',   'pizza.corner@vendor.com', '+919810000003', 'Pizza Corner Owner',  'vendor',   true, true, 'https://images.unsplash.com/photo-1564564321834-a57f3c88c0d0?w=200'),
  ('a0000000-0000-0000-0000-000000000008', 'mock_dm_1',       'ramesh.kumar@delivery.com','+919820000001','Ramesh Kumar',        'delivery', true, true, 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200'),
  ('a0000000-0000-0000-0000-000000000009', 'mock_dm_2',       'suresh.yadav@delivery.com','+919820000002','Suresh Yadav',        'delivery', true, true, 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=200'),
  ('a0000000-0000-0000-0000-000000000010', 'mock_dm_3',       'mahesh.pandey@delivery.com','+919820000003','Mahesh Pandey',       'delivery', true, true, 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200')
on conflict (id) do nothing;

-- Customer extensions
insert into customers (user_id, total_orders, total_spent, wallet_balance, loyalty_points) values
  ('a0000000-0000-0000-0000-000000000002', 12, 8400, 350, 84),
  ('a0000000-0000-0000-0000-000000000003', 8, 5200, 175, 52),
  ('a0000000-0000-0000-0000-000000000004', 24, 18900, 1200, 189)
on conflict (user_id) do nothing;

-- Vendor extensions
insert into vendors (user_id, total_sales, total_orders, rating, is_approved) values
  ('a0000000-0000-0000-0000-000000000005', 84000, 245, 4.60, true),
  ('a0000000-0000-0000-0000-000000000006', 67000, 412, 4.40, true),
  ('a0000000-0000-0000-0000-000000000007', 92000, 187, 4.50, true)
on conflict (user_id) do nothing;

-- Delivery men
insert into delivery_men (user_id, vehicle_type, vehicle_number, is_online, is_approved, rating, total_deliveries, total_earnings) values
  ('a0000000-0000-0000-0000-000000000008', 'bike',    'KA01AB1234', true,  true, 4.7, 423, 18500),
  ('a0000000-0000-0000-0000-000000000009', 'scooter', 'KA02CD5678', true,  true, 4.5, 387, 16200),
  ('a0000000-0000-0000-0000-000000000010', 'bike',    'KA03EF9012', false, true, 4.8, 612, 28400)
on conflict (user_id) do nothing;

-- Stores
insert into stores (id, name, slug, description, logo_url, cover_url, address, location, phone, email, vendor_id, is_active, is_open, rating, reviews_count, minimum_order, delivery_fee, delivery_time_minutes) values
  ('s0000000-0000-0000-0000-000000000001', 'Spice Garden Restaurant', 'spice-garden', 'Authentic Indian cuisine, freshly prepared.', 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400', 'https://images.unsplash.com/photo-1555396273-36c1e5993909?w=800', '12 MG Road, Bangalore', st_setsrid(st_makepoint(77.5946, 12.9716), 4326), '+918012345678', 'orders@spicegarden.com', (select id from vendors where user_id='a0000000-0000-0000-0000-000000000005'), true, true, 4.6, 1240, 200, 30, 35),
  ('s0000000-0000-0000-0000-000000000002', 'FreshMart Grocery',      'freshmart',     'Daily groceries, farm-fresh produce.',         'https://images.unsplash.com/photo-1542838132-92c53300491b?w=400', 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=800', '88 Brigade Road, Bangalore', st_setsrid(st_makepoint(77.6056, 12.9698), 4326), '+918023456789', 'hello@freshmart.com', (select id from vendors where user_id='a0000000-0000-0000-0000-000000000006'), true, true, 4.4, 856, 300, 25, 50),
  ('s0000000-0000-0000-0000-000000000003', 'Pizza Corner',           'pizza-corner',  'Wood-fired pizzas & Italian classics.',       'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400', 'https://images.unsplash.com/photo-1571066811602-716837d681de?w=800', '45 Indiranagar, Bangalore', st_setsrid(st_makepoint(77.6412, 12.9719), 4326), '+918034567890', 'care@pizzacorner.com', (select id from vendors where user_id='a0000000-0000-0000-0000-000000000007'), true, true, 4.5, 980, 250, 35, 40)
on conflict (id) do nothing;

-- Categories
insert into categories (name, slug, icon_url, position, is_active, stores_count, items_count) values
  ('Biryani', 'biryani', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=200', 1, true, 18, 96),
  ('Pizza', 'pizza', 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200', 2, true, 22, 134),
  ('Burgers', 'burgers', 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=200', 3, true, 15, 78),
  ('North Indian', 'north-indian', 'https://images.unsplash.com/photo-1631292784640-2d244b27b8a2?w=200', 4, true, 34, 245),
  ('South Indian', 'south-indian', 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=200', 5, true, 28, 167),
  ('Desserts', 'desserts', 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=200', 7, true, 14, 89),
  ('Beverages', 'beverages', 'https://images.unsplash.com/photo-1606756790138-261d2b21cd75?w=200', 8, true, 11, 67),
  ('Fruits & Vegetables', 'fruits-vegetables', 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=200', 9, true, 25, 312),
  ('Dairy & Eggs', 'dairy-eggs', 'https://images.unsplash.com/photo-1559561853-08451507cbe7?w=200', 10, true, 18, 87),
  ('Atta, Rice & Dal', 'atta-rice-dal', 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=200', 11, true, 22, 156),
  ('Snacks & Munchies', 'snacks', 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=200', 12, true, 30, 234),
  ('Beverages (Packaged)', 'packaged-beverages', 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=200', 13, true, 26, 178)
on conflict (slug) do nothing;

-- Sample products
insert into products (store_id, category_id, name, slug, description, image_url, price, discount_price, unit, stock, is_available, is_featured, is_veg, prep_time_minutes, brand) values
  ('s0000000-0000-0000-0000-000000000001', (select id from categories where slug='biryani'), 'Chicken Biryani', 'chicken-biryani', 'Authentic Hyderabadi chicken biryani with raita.', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400', 220, null, 'plate', 50, true, true, false, 25, null),
  ('s0000000-0000-0000-0000-000000000001', (select id from categories where slug='biryani'), 'Veg Biryani', 'veg-biryani', 'Vegetable biryani with saffron rice.', 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=400', 180, 153, 'plate', 45, true, false, true, 20, null),
  ('s0000000-0000-0000-0000-000000000001', (select id from categories where slug='north-indian'), 'Paneer Butter Masala', 'paneer-butter-masala', 'Creamy tomato gravy with paneer cubes.', 'https://images.unsplash.com/photo-1631292784640-2d244b27b8a2?w=400', 240, null, 'bowl', 30, true, true, true, 22, null),
  ('s0000000-0000-0000-0000-000000000003', (select id from categories where slug='pizza'), 'Margherita Pizza', 'margherita-pizza', 'Classic cheese pizza with basil.', 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=400', 280, 238, 'medium', 25, true, true, true, 18, null),
  ('s0000000-0000-0000-0000-000000000003', (select id from categories where slug='pizza'), 'Pepperoni Pizza', 'pepperoni-pizza', 'Loaded with pepperoni and mozzarella.', 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400', 360, null, 'medium', 20, true, false, false, 18, null),
  ('s0000000-0000-0000-0000-000000000002', (select id from categories where slug='fruits-vegetables'), 'Banana (Robusta)', 'banana-robusta', 'Fresh robusta bananas.', 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400', 60, null, 'kg', 100, true, false, null, null, 'FreshMart'),
  ('s0000000-0000-0000-0000-000000000002', (select id from categories where slug='fruits-vegetables'), 'Tomato', 'tomato', 'Fresh farm tomatoes.', 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400', 40, 34, 'kg', 80, true, true, null, null, 'FreshMart'),
  ('s0000000-0000-0000-0000-000000000002', (select id from categories where slug='dairy-eggs'), 'Amul Milk 1L', 'amul-milk-1l', 'Pasteurized homogenized milk.', 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400', 64, null, 'liter', 60, true, true, null, null, 'Amul'),
  ('s0000000-0000-0000-0000-000000000002', (select id from categories where slug='atta-rice-dal'), 'Aashirvaad Atta 5kg', 'aashirvaad-atta-5kg', 'Whole wheat flour.', 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400', 290, null, 'pack', 40, true, false, null, null, 'Aashirvaad'),
  ('s0000000-0000-0000-0000-000000000002', (select id from categories where slug='snacks'), 'Lays Classic 52g', 'lays-classic-52g', 'Crispy potato chips.', 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=400', 20, null, 'pack', 200, true, false, null, null, 'Lays')
on conflict (store_id, slug) do nothing;

-- Sample coupons
insert into coupons (code, title, description, discount_type, discount_value, minimum_order, maximum_discount, usage_limit, used_count, start_date, end_date, is_active) values
  ('WELCOME50', '50% off first order', 'New users only', 'percentage', 50, 200, 150, 1000, 423, now() - interval '30 days', now() + interval '60 days', true),
  ('FOOD30',    '30% off food orders',  'On food orders above ₹300', 'percentage', 30, 300, 100, 500, 187, now() - interval '20 days', now() + interval '30 days', true),
  ('GROCERY20', '20% off grocery',      'On grocery orders above ₹500', 'percentage', 20, 500, 120, 800, 312, now() - interval '15 days', now() + interval '45 days', true),
  ('FLAT100',   'Flat ₹100 off',        'On orders above ₹400', 'fixed', 100, 400, null, 300, 156, now() - interval '10 days', now() + interval '20 days', true)
on conflict (code) do nothing;

-- Sample banners
insert into banners (title, image_url, redirect_type, redirect_id, redirect_url, position, is_active, start_date, end_date) values
  ('Order from Spice Garden today!', 'https://images.unsplash.com/photo-1555396273-36c1e5993909?w=800', 'store', 's0000000-0000-0000-0000-000000000001', null, 1, true, now() - interval '10 days', now() + interval '30 days'),
  ('Fresh groceries at FreshMart',    'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=800', 'store', 's0000000-0000-0000-0000-000000000002', null, 2, true, now() - interval '7 days',  now() + interval '25 days'),
  ('50% off your first order',        'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800', 'url',   null, '/coupons', 3, true, now() - interval '5 days',  now() + interval '40 days')
on conflict do nothing;

-- Sample wallets
insert into wallets (user_id, balance) values
  ('a0000000-0000-0000-0000-000000000002', 350),
  ('a0000000-0000-0000-0000-000000000003', 175),
  ('a0000000-0000-0000-0000-000000000004', 1200),
  ('a0000000-0000-0000-0000-000000000005', 0),
  ('a0000000-0000-0000-0000-000000000006', 0),
  ('a0000000-0000-0000-0000-000000000007', 0),
  ('a0000000-0000-0000-0000-000000000008', 18500),
  ('a0000000-0000-0000-0000-000000000009', 16200),
  ('a0000000-0000-0000-0000-000000000010', 28400)
on conflict (user_id) do nothing;

-- Sample notifications
insert into notifications (user_id, user_role, title, body, type, is_read) values
  ('a0000000-0000-0000-0000-000000000001', 'admin',    'New order received',     'Order ORD-001 placed by Rahul Sharma', 'order',  false),
  ('a0000000-0000-0000-0000-000000000001', 'admin',    'Vendor registration',   'New vendor pending approval',         'system', false),
  ('a0000000-0000-0000-0000-000000000001', 'admin',    'Weekend promo live',    'WEEKEND15 coupon is now active',       'promo',  false),
  ('a0000000-0000-0000-0000-000000000002', null,       'Order accepted',         'Your order ORD-001 has been accepted', 'order',  false),
  ('a0000000-0000-0000-0000-000000000002', null,       'Order delivered',        'Your order ORD-001 has been delivered. Rate your experience!', 'order', true)
on conflict do nothing;

-- Sample addresses
insert into addresses (customer_id, label, full_address, landmark, latitude, longitude, phone, is_default) values
  ((select id from customers where user_id='a0000000-0000-0000-0000-000000000002'), 'Home', '12 MG Road, Bangalore, Karnataka 560001', 'Near Metro Station', 12.9716, 77.5946, '+919800000001', true),
  ((select id from customers where user_id='a0000000-0000-0000-0000-000000000002'), 'Work', '45 Indiranagar, Bangalore, Karnataka 560038', '100 Feet Road', 12.9719, 77.6412, '+919800000001', false)
on conflict do nothing;

-- ============================================================================
-- 10. SWITCH EATS SEED DATA
-- ============================================================================

-- Employee roles
insert into employee_roles (name, description, permissions, is_system) values
  ('Super Admin', 'Full access to all features', '["all"]', true),
  ('Operations',  'Orders, restaurants, delivery', '["orders","restaurants","delivery"]', true),
  ('Support',     'Tickets, customers', '["tickets","customers"]', true),
  ('Finance',     'Wallets, payouts, reports', '["wallets","payouts","reports"]', true)
on conflict (name) do nothing;

-- Subscription plans
insert into subscription_plans (name, price, period, features, is_active) values
  ('Starter',    999,  'Month', 'Up to 100 orders/mo', true),
  ('Growth',     2499, 'Month', 'Up to 1000 orders/mo + Analytics', true),
  ('Enterprise', 4999, 'Month', 'Unlimited orders + Priority support', false)
on conflict (name) do nothing;

-- Earning addons
insert into earning_addons (name, value, condition, is_active) values
  ('Peak Hours Bonus', '+₹10/delivery', '6-9 PM weekdays', true),
  ('Rain Surge',        '+₹20/delivery', 'When weather is rainy', true),
  ('Long Distance',     '+₹5/km beyond 5km', 'Distance > 5km', false)
on conflict do nothing;

-- Feature settings
insert into feature_settings (key, label, description, is_enabled) values
  ('restaurant_subscription', 'Restaurant Subscriptions', 'Enable subscription billing for restaurants', true),
  ('cod_control', 'Cash on Delivery', 'Allow COD payments', true),
  ('admin_access_section', 'Sub Admin Access', 'Enable role-based admin access', false),
  ('root_landing_and_unregistered_control', 'Unregistered Restaurants', 'Show unregistered restaurant section', true),
  ('dining_management', 'Dining Management', 'Enable dine-in features', false)
on conflict (key) do nothing;

-- Business settings (single row)
insert into business_settings (company_name, support_email, support_phone, address, pincode, state, country, currency, timezone)
values ('Food Munch', 'support@foodmunch.com', '+91 80 4567 8900', 'MG Road, Bengaluru, KA 560001', '560001', 'Karnataka', 'India', 'INR', 'Asia/Kolkata')
on conflict do nothing;

-- Pages & Social Media
insert into pages_social_media (page_key, title, content, is_published) values
  ('about',        'About Us',              'Food Munch is India''s leading food delivery platform connecting customers with their favourite restaurants. Founded in 2020, we serve over 50,000 customers daily across 12 cities.', true),
  ('terms',        'Terms & Conditions',    'By using Food Munch, you agree to our terms of service. All orders are subject to restaurant availability and delivery partner confirmation.', true),
  ('privacy',      'Privacy Policy',        'We respect your privacy. Your data is encrypted and never shared with third parties without your explicit consent.', true),
  ('support',      'Support',               'Need help? Reach our 24/7 support team at support@foodmunch.com or call +91 80 4567 8900.', true),
  ('refund',       'Refund Policy',         'Refunds are processed within 5-7 business days. Cancellation before preparation qualifies for full refund.', true),
  ('shipping',     'Shipping Policy',       'Delivery is available within 10km of partner restaurants. Standard delivery time is 30-45 minutes.', true),
  ('cancellation', 'Cancellation Policy',   'Orders can be cancelled free of charge before preparation starts. Post-preparation cancellations may incur a fee.', true)
on conflict (page_key) do nothing;

-- Zones
insert into zones (name, pincode, delivery_fee, radius_km, coordinates, is_active) values
  ('Bengaluru Central', '560001', 30, 5, '12.9716,77.5946', true),
  ('Indiranagar',       '560038', 35, 4, '12.9719,77.6412', true),
  ('Koramangala',       '560034', 25, 3, '12.9352,77.6245', true),
  ('Whitefield',        '560066', 45, 7, '12.9698,77.7500', false),
  ('JP Nagar',          '560078', 30, 5, '12.9082,77.5852', true)
on conflict do nothing;

-- Addons
insert into addons (name, description, price, store_id, is_active, image_url) values
  ('Extra Cheese', 'Extra cheese topping', 30, null, true,  'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=400'),
  ('Extra Sauce',  'Extra sauce on the side', 15, null, true,  'https://images.unsplash.com/photo-1606756790138-261d2b21cd75?w=400'),
  ('Spicy Mix',    'Extra spicy seasoning', 20, null, false, 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=400'),
  ('Onion Rings',  'Side of onion rings', 50, null, true,  'https://images.unsplash.com/photo-1639024471283-03518883512d?w=400')
on conflict do nothing;

-- Sample support tickets
insert into support_tickets (ticket_code, user_id, user_type, subject, description, category, priority, status) values
  ('TKT-001', 'a0000000-0000-0000-0000-000000000002', 'user',       'Order not delivered', 'Order ORD-001 was not delivered', 'Order',    'High',   'Open'),
  ('TKT-002', 'a0000000-0000-0000-0000-000000000005', 'restaurant', 'Refund not received', 'Refund for order #1024 pending', 'Payment',  'Medium', 'In Progress'),
  ('TKT-003', 'a0000000-0000-0000-0000-000000000003', 'user',       'App crash on checkout', 'App crashes when I tap checkout on iPhone', 'Technical', 'High', 'Open')
on conflict (ticket_code) do nothing;

-- Sample delivery withdrawals
insert into delivery_withdrawals (delivery_man_id, amount, status, bank_name, account_number, ifsc_code, holder_name) values
  ((select id from delivery_men where user_id='a0000000-0000-0000-0000-000000000008'), 3450, 'Pending', 'HDFC Bank', '****1234', 'HDFC0001234', 'Ramesh Kumar'),
  ((select id from delivery_men where user_id='a0000000-0000-0000-0000-000000000009'), 2800, 'Paid',    'ICICI Bank', '****5678', 'ICIC0005678', 'Suresh Yadav'),
  ((select id from delivery_men where user_id='a0000000-0000-0000-0000-000000000010'), 1500, 'Pending', 'SBI Bank',   '****9012', 'SBIN0009012', 'Mahesh Pandey')
on conflict do nothing;

-- Sample restaurant withdrawals
insert into restaurant_withdrawals (store_id, vendor_id, amount, status, bank_name, account_number, ifsc_code, holder_name) values
  ('s0000000-0000-0000-0000-000000000001', (select id from vendors where user_id='a0000000-0000-0000-0000-000000000005'), 12450, 'Pending', 'HDFC Bank', '****1234', 'HDFC0001234', 'Spice Garden Pvt Ltd'),
  ('s0000000-0000-0000-0000-000000000002', (select id from vendors where user_id='a0000000-0000-0000-0000-000000000006'), 8900,  'Paid',    'ICICI Bank', '****5678', 'ICIC0005678', 'FreshMart LLP'),
  ('s0000000-0000-0000-0000-000000000003', (select id from vendors where user_id='a0000000-0000-0000-0000-000000000007'), 6700,  'Pending', 'SBI Bank',   '****9012', 'SBIN0009012', 'Pizza Corner Inc')
on conflict do nothing;

-- Sample delivery support tickets
insert into delivery_support_tickets (ticket_code, delivery_man_id, category, description, priority, status) values
  ('DST-001', (select id from delivery_men where user_id='a0000000-0000-0000-0000-000000000008'), 'Payment',   'Payment not received for order #1024', 'High',   'Open'),
  ('DST-002', (select id from delivery_men where user_id='a0000000-0000-0000-0000-000000000009'), 'Technical', 'App GPS issue in Indiranagar area',    'Medium', 'In Progress'),
  ('DST-003', (select id from delivery_men where user_id='a0000000-0000-0000-0000-000000000010'), 'Order',     'Order assignment problem',             'Low',    'Resolved')
on conflict (ticket_code) do nothing;

-- Sample contact messages
insert into contact_messages (name, email, phone, subject, message, rating, status) values
  ('Rahul Sharma', 'rahul@example.com', '+91 7470311228', 'Feedback on app', 'Loving the new UI!', 5, 'unread'),
  ('Priya Patel',  'priya@example.com', '+91 98765 43210', 'Bug report',      'Cart total shows wrong amount on iPhone.', 2, 'read'),
  ('Amit Kumar',   'amit@example.com',  '+91 99887 76655', 'Feature request', 'Please add scheduled deliveries.', 4, 'unread')
on conflict do nothing;

-- Sample safety emergency reports
insert into safety_emergency_reports (user_id, user_type, user_name, type, location, description, status) values
  ('a0000000-0000-0000-0000-000000000008', 'delivery', 'Ramesh Kumar',  'Accident',            'MG Road',       'Met with minor accident near MG Road signal', 'open'),
  ('a0000000-0000-0000-0000-000000000002', 'customer', 'Priya Patel',   'Harassment',          'Indiranagar',  'Delivery partner was rude',                   'open'),
  ('a0000000-0000-0000-0000-000000000009', 'delivery', 'Suresh Yadav',   'Vehicle Breakdown',  'Koramangala',  'Bike broke down on the way',                  'resolved')
on conflict do nothing;

-- Sample restaurant reviews
insert into restaurant_reviews (store_id, customer_id, customer_name, rating, comment, is_published) values
  ('s0000000-0000-0000-0000-000000000001', (select id from customers where user_id='a0000000-0000-0000-0000-000000000002'), 'Rahul Sharma', 5, 'Excellent service and great food quality. Highly recommended!', true),
  ('s0000000-0000-0000-0000-000000000002', (select id from customers where user_id='a0000000-0000-0000-0000-000000000003'), 'Priya Patel',  4, 'Good experience overall, slight delay in delivery.', true),
  ('s0000000-0000-0000-0000-000000000003', (select id from customers where user_id='a0000000-0000-0000-0000-000000000004'), 'Amit Kumar',   5, 'Best in town! Will order again.', true)
on conflict do nothing;

-- Sample delivery partner reviews
insert into delivery_partner_reviews (delivery_man_id, customer_id, customer_name, rating, comment, is_published) values
  ((select id from delivery_men where user_id='a0000000-0000-0000-0000-000000000008'), (select id from customers where user_id='a0000000-0000-0000-0000-000000000002'), 'Rahul Sharma', 5, 'Very polite and quick delivery!', true),
  ((select id from delivery_men where user_id='a0000000-0000-0000-0000-000000000009'), (select id from customers where user_id='a0000000-0000-0000-0000-000000000003'), 'Priya Patel',  4, 'Good service, slight delay.', true),
  ((select id from delivery_men where user_id='a0000000-0000-0000-0000-000000000010'), (select id from customers where user_id='a0000000-0000-0000-0000-000000000004'), 'Amit Kumar',   5, 'Best delivery experience!', true)
on conflict do nothing;

-- Sample restaurant complaints
insert into restaurant_complaints (store_id, subject, description, priority, status) values
  ('s0000000-0000-0000-0000-000000000001', 'Payment delay', 'Commission payment is delayed by 3 days', 'High',   'Open'),
  ('s0000000-0000-0000-0000-000000000002', 'Commission dispute', 'Commission charged is higher than agreed', 'Medium', 'In Progress'),
  ('s0000000-0000-0000-0000-000000000003', 'Order refund issue', 'Refund for cancelled order #1024 pending', 'High', 'Open')
on conflict do nothing;

-- Sample broadcast notifications
insert into broadcast_notifications (title, body, audience, status, sent_at) values
  ('Weekend Special — 25% OFF', 'Use code WEEKEND50 for 25% off this weekend!', 'all', 'sent', now() - interval '2 days'),
  ('New store: Tandoori Nights', 'Tandoori Nights is now live in your area', 'active', 'sent', now() - interval '5 days')
on conflict do nothing;

-- ============================================================================
-- 11. DONE — verify with: select count(*) from <table>;
-- ============================================================================
-- Total tables created: 53
-- Total enums created: 20
-- Total seed rows inserted: ~80+ across all tables
-- RLS: disabled for testing (enable in production)
-- ============================================================================

-- Final sanity check: count rows in key tables
select 'users' as t, count(*) from users
union all select 'customers', count(*) from customers
union all select 'vendors', count(*) from vendors
union all select 'delivery_men', count(*) from delivery_men
union all select 'stores', count(*) from stores
union all select 'products', count(*) from products
union all select 'categories', count(*) from categories
union all select 'zones', count(*) from zones
union all select 'addons', count(*) from addons
union all select 'employee_roles', count(*) from employee_roles
union all select 'subscription_plans', count(*) from subscription_plans
union all select 'feature_settings', count(*) from feature_settings
union all select 'pages_social_media', count(*) from pages_social_media
union all select 'business_settings', count(*) from business_settings
union all select 'support_tickets', count(*) from support_tickets
union all select 'delivery_withdrawals', count(*) from delivery_withdrawals
union all select 'restaurant_withdrawals', count(*) from restaurant_withdrawals
union all select 'delivery_support_tickets', count(*) from delivery_support_tickets
union all select 'contact_messages', count(*) from contact_messages
union all select 'safety_emergency_reports', count(*) from safety_emergency_reports
union all select 'restaurant_reviews', count(*) from restaurant_reviews
union all select 'delivery_partner_reviews', count(*) from delivery_partner_reviews
union all select 'restaurant_complaints', count(*) from restaurant_complaints
union all select 'broadcast_notifications', count(*) from broadcast_notifications
order by t;
