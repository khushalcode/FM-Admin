-- ============================================================================
-- FreshCart 4.0 — Seed Data
-- Run AFTER 0001_initial_schema.sql
-- ============================================================================

-- Sample users (firebase_uid is mock — replace with real Firebase UIDs after auth setup)
insert into users (id, firebase_uid, email, phone, full_name, role, is_active, is_email_verified) values
  ('a0000000-0000-0000-0000-000000000001', 'mock_admin_1',    'admin@freshcart.com',     '+918000000001', 'Admin User',          'admin',    true, true),
  ('a0000000-0000-0000-0000-000000000002', 'mock_customer_1', 'rahul.sharma@example.com', '+919800000001', 'Rahul Sharma',       'customer', true, true),
  ('a0000000-0000-0000-0000-000000000003', 'mock_customer_2', 'priya.patel@example.com',  '+919800000002', 'Priya Patel',        'customer', true, true),
  ('a0000000-0000-0000-0000-000000000004', 'mock_customer_3', 'amit.kumar@example.com',   '+919800000003', 'Amit Kumar',         'customer', true, true),
  ('a0000000-0000-0000-0000-000000000005', 'mock_vendor_1',   'spice.garden@vendor.com',  '+919810000001', 'Spice Garden Owner', 'vendor',   true, true),
  ('a0000000-0000-0000-0000-000000000006', 'mock_vendor_2',   'freshmart@vendor.com',     '+919810000002', 'FreshMart Owner',    'vendor',   true, true),
  ('a0000000-0000-0000-0000-000000000007', 'mock_vendor_3',   'pizza.corner@vendor.com',  '+919810000003', 'Pizza Corner Owner', 'vendor',   true, true),
  ('a0000000-0000-0000-0000-000000000008', 'mock_dm_1',       'ramesh.kumar@delivery.com','+919820000001', 'Ramesh Kumar',       'delivery', true, true),
  ('a0000000-0000-0000-0000-000000000009', 'mock_dm_2',       'suresh.yadav@delivery.com','+919820000002', 'Suresh Yadav',       'delivery', true, true),
  ('a0000000-0000-0000-0000-000000000010', 'mock_dm_3',       'mahesh.pandey@delivery.com','+919820000003','Mahesh Pandey',      'delivery', true, true);

-- Customer extensions
insert into customers (user_id, total_orders, total_spent, wallet_balance, loyalty_points) values
  ('a0000000-0000-0000-0000-000000000002', 12, 8400, 350, 84),
  ('a0000000-0000-0000-0000-000000000003', 8, 5200, 175, 52),
  ('a0000000-0000-0000-0000-000000000004', 24, 18900, 1200, 189);

-- Vendor extensions
insert into vendors (user_id, total_sales, total_orders, rating, is_approved) values
  ('a0000000-0000-0000-0000-000000000005', 84000, 245, 4.6, true),
  ('a0000000-0000-0000-0000-000000000006', 67000, 412, 4.4, true),
  ('a0000000-0000-0000-0000-000000000007', 92000, 187, 4.5, true);

-- Delivery men
insert into delivery_men (user_id, vehicle_type, vehicle_number, is_online, is_approved, rating, total_deliveries, total_earnings) values
  ('a0000000-0000-0000-0000-000000000008', 'bike',    'KA01AB1234',  true,  true, 4.7, 423, 18500),
  ('a0000000-0000-0000-0000-000000000009', 'scooter', 'KA02CD5678',  true,  true, 4.5, 387, 16200),
  ('a0000000-0000-0000-0000-000000000010', 'bike',    'KA03EF9012',  false, true, 4.8, 612, 28400);

-- Stores
insert into stores (id, name, slug, module_type, description, address, location, phone, email, vendor_id, is_active, is_open, rating, reviews_count, minimum_order, delivery_fee, delivery_time_minutes) values
  ('s0000000-0000-0000-0000-000000000001', 'Spice Garden Restaurant', 'spice-garden', 'food', 'Authentic Indian cuisine, freshly prepared.', '12 MG Road, Bangalore', st_setsrid(st_makepoint(77.5946, 12.9716), 4326), '+918012345678', 'orders@spicegarden.com', 'a0000000-0000-0000-0000-000000000005', true, true, 4.6, 1240, 200, 30, 35),
  ('s0000000-0000-0000-0000-000000000002', 'FreshMart Grocery', 'freshmart', 'grocery', 'Daily groceries, farm-fresh produce.', '88 Brigade Road, Bangalore', st_setsrid(st_makepoint(77.6056, 12.9698), 4326), '+918023456789', 'hello@freshmart.com', 'a0000000-0000-0000-0000-000000000006', true, true, 4.4, 856, 300, 25, 50),
  ('s0000000-0000-0000-0000-000000000003', 'Pizza Corner', 'pizza-corner', 'food', 'Wood-fired pizzas & Italian classics.', '45 Indiranagar, Bangalore', st_setsrid(st_makepoint(77.6412, 12.9719), 4326), '+918034567890', 'care@pizzacorner.com', 'a0000000-0000-0000-0000-000000000007', true, true, 4.5, 980, 250, 35, 40);

-- Categories
insert into categories (name, slug, module_type, position, is_active, stores_count, items_count) values
  ('Biryani', 'biryani', 'food', 1, true, 18, 96),
  ('Pizza', 'pizza', 'food', 2, true, 22, 134),
  ('Burgers', 'burgers', 'food', 3, true, 15, 78),
  ('North Indian', 'north-indian', 'food', 4, true, 34, 245),
  ('South Indian', 'south-indian', 'food', 5, true, 28, 167),
  ('Desserts', 'desserts', 'food', 7, true, 14, 89),
  ('Beverages', 'beverages', 'food', 8, true, 11, 67),
  ('Fruits & Vegetables', 'fruits-vegetables', 'grocery', 9, true, 25, 312),
  ('Dairy & Eggs', 'dairy-eggs', 'grocery', 10, true, 18, 87),
  ('Atta, Rice & Dal', 'atta-rice-dal', 'grocery', 11, true, 22, 156),
  ('Snacks & Munchies', 'snacks', 'grocery', 12, true, 30, 234),
  ('Beverages (Packaged)', 'packaged-beverages', 'grocery', 13, true, 26, 178);

-- Sample products
insert into products (store_id, category_id, module_type, name, slug, description, price, discount_price, unit, stock, is_available, is_featured, is_veg, prep_time_minutes, brand) values
  ('s0000000-0000-0000-0000-000000000001', (select id from categories where slug='biryani'), 'food', 'Chicken Biryani', 'chicken-biryani', 'Authentic Hyderabadi chicken biryani with raita.', 220, null, 'plate', 50, true, true, false, 25, null),
  ('s0000000-0000-0000-0000-000000000001', (select id from categories where slug='biryani'), 'food', 'Veg Biryani', 'veg-biryani', 'Vegetable biryani with saffron rice.', 180, 153, 'plate', 45, true, false, true, 20, null),
  ('s0000000-0000-0000-0000-000000000001', (select id from categories where slug='north-indian'), 'food', 'Paneer Butter Masala', 'paneer-butter-masala', 'Creamy tomato gravy with paneer cubes.', 240, null, 'bowl', 30, true, true, true, 22, null),
  ('s0000000-0000-0000-0000-000000000003', (select id from categories where slug='pizza'), 'food', 'Margherita Pizza', 'margherita-pizza', 'Classic cheese pizza with basil.', 280, 238, 'medium', 25, true, true, true, 18, null),
  ('s0000000-0000-0000-0000-000000000003', (select id from categories where slug='pizza'), 'food', 'Pepperoni Pizza', 'pepperoni-pizza', 'Loaded with pepperoni and mozzarella.', 360, null, 'medium', 20, true, false, false, 18, null),
  ('s0000000-0000-0000-0000-000000000002', (select id from categories where slug='fruits-vegetables'), 'grocery', 'Banana (Robusta)', 'banana-robusta', 'Fresh robusta bananas.', 60, null, 'kg', 100, true, false, null, null, 'FreshMart'),
  ('s0000000-0000-0000-0000-000000000002', (select id from categories where slug='fruits-vegetables'), 'grocery', 'Tomato', 'tomato', 'Fresh farm tomatoes.', 40, 34, 'kg', 80, true, true, null, null, 'FreshMart'),
  ('s0000000-0000-0000-0000-000000000002', (select id from categories where slug='dairy-eggs'), 'grocery', 'Amul Milk 1L', 'amul-milk-1l', 'Pasteurized homogenized milk.', 64, null, 'liter', 60, true, true, null, null, 'Amul'),
  ('s0000000-0000-0000-0000-000000000002', (select id from categories where slug='atta-rice-dal'), 'grocery', 'Aashirvaad Atta 5kg', 'aashirvaad-atta-5kg', 'Whole wheat flour.', 290, null, 'pack', 40, true, false, null, null, 'Aashirvaad'),
  ('s0000000-0000-0000-0000-000000000002', (select id from categories where slug='snacks'), 'grocery', 'Lay''s Classic 52g', 'lays-classic-52g', 'Crispy potato chips.', 20, null, 'pack', 200, true, false, null, null, 'Lay''s');

-- Sample coupons
insert into coupons (code, title, description, module_type, applies_to_all, discount_type, discount_value, minimum_order, maximum_discount, usage_limit, used_count, start_date, end_date, is_active) values
  ('WELCOME50', '50% off first order', 'New users only', 'food', true, 'percentage', 50, 200, 150, 1000, 423, now() - interval '30 days', now() + interval '60 days', true),
  ('FOOD30', '30% off food orders', 'On food orders above ₹300', 'food', false, 'percentage', 30, 300, 100, 500, 187, now() - interval '20 days', now() + interval '30 days', true),
  ('GROCERY20', '20% off grocery', 'On grocery orders above ₹500', 'grocery', false, 'percentage', 20, 500, 120, 800, 312, now() - interval '15 days', now() + interval '45 days', true),
  ('FLAT100', 'Flat ₹100 off', 'On orders above ₹400', 'food', true, 'fixed', 100, 400, null, 300, 156, now() - interval '10 days', now() + interval '20 days', true);

-- Sample banners
insert into banners (title, module_type, applies_to_all, image_url, redirect_type, redirect_id, redirect_url, position, is_active, start_date, end_date) values
  ('Order from Spice Garden today!', 'food', false, '', 'store', 's0000000-0000-0000-0000-000000000001', null, 1, true, now() - interval '10 days', now() + interval '30 days'),
  ('Fresh groceries at FreshMart', 'grocery', false, '', 'store', 's0000000-0000-0000-0000-000000000002', null, 2, true, now() - interval '7 days', now() + interval '25 days'),
  ('50% off your first order', 'food', true, '', 'url', null, '/coupons', 3, true, now() - interval '5 days', now() + interval '40 days');

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
  ('a0000000-0000-0000-0000-000000000010', 28400);

-- Sample notifications
insert into notifications (user_id, user_role, title, body, type, is_read) values
  ('a0000000-0000-0000-0000-000000000001', 'admin', 'New order received', 'Order ORD-001 placed by Rahul Sharma', 'order', false),
  ('a0000000-0000-0000-0000-000000000001', 'admin', 'Vendor registration', 'New vendor pending approval', 'system', false),
  ('a0000000-0000-0000-0000-000000000002', null, 'Order accepted', 'Your order ORD-001 has been accepted', 'order', false),
  ('a0000000-0000-0000-0000-000000000002', null, 'Order delivered', 'Your order ORD-001 has been delivered. Rate your experience!', 'order', true);

-- Sample addresses
insert into addresses (customer_id, label, full_address, landmark, latitude, longitude, phone, is_default) values
  ((select id from customers where user_id='a0000000-0000-0000-0000-000000000002'), 'Home', '12 MG Road, Bangalore, Karnataka 560001', 'Near Metro Station', 12.9716, 77.5946, '+919800000001', true),
  ((select id from customers where user_id='a0000000-0000-0000-0000-000000000002'), 'Work', '45 Indiranagar, Bangalore, Karnataka 560038', '100 Feet Road', 12.9719, 77.6412, '+919800000001', false);

-- Sample orders (status delivered for testing)
insert into orders (id, serial_num, customer_id, store_id, vendor_id, module_type, item_count, subtotal, delivery_fee, discount, tax, total, delivery_earnings, payment_method, payment_status, status, delivery_address, accepted_at, picked_up_at, delivered_at, created_at)
select
  'o0000000-0000-0000-0000-000000000001',
  nextval('orders_serial_num_seq'),
  c.id,
  's0000000-0000-0000-0000-000000000001',
  v.id,
  'food',
  2,
  460,
  30,
  0,
  23,
  513,
  35,
  'online',
  'paid',
  'delivered',
  '12 MG Road, Bangalore',
  now() - interval '2 hours',
  now() - interval '1.5 hours',
  now() - interval '1 hour',
  now() - interval '3 hours'
from customers c, vendors v
where c.user_id = 'a0000000-0000-0000-0000-000000000002'
  and v.user_id = 'a0000000-0000-0000-0000-000000000005';

-- Sample order items
insert into order_items (order_id, product_id, name, unit, price, quantity, module_type, store_id, store_name) values
  ('o0000000-0000-0000-0000-000000000001', (select id from products where slug='chicken-biryani'), 'Chicken Biryani', 'plate', 220, 1, 'food', 's0000000-0000-0000-0000-000000000001', 'Spice Garden Restaurant'),
  ('o0000000-0000-0000-0000-000000000001', (select id from products where slug='paneer-butter-masala'), 'Paneer Butter Masala', 'bowl', 240, 1, 'food', 's0000000-0000-0000-0000-000000000001', 'Spice Garden Restaurant');

-- Done
