# FM-Admin — SwitchEats-aligned Admin Console

A complete Next.js 16 admin console for a food-delivery platform, faithfully aligned with the **food-backend-umber (SwitchEats)** admin UI structure.

## 🗄️ Shared Database with FA-User (Expo React Native App)

**This admin shares ONE Supabase database with the FA-User customer mobile app.**

- **Database URL**: `https://dhmeyycjosacuwgtdhfo.supabase.co` (configured in `.env` and in the user app's `app.json`)
- **Unified SQL file**: `supabase/fm-admin-fresh.sql` (1602 lines, 82 KB) — used by BOTH apps
- **Admin app** (this one): controls all data — products, stores, categories, vendors, delivery partners, orders, coupons, banners, etc. All changes are visible in the user app in real-time via Supabase Realtime.
- **User app** (FA-User): reads from the same tables and writes customer-facing data (orders, cart, reviews, wallet, addresses)

### How the admin controls the user app

| Admin action | User app sees |
|--------------|---------------|
| Add a Product | Product appears in Home / Categories / Search |
| Add a Store | Store appears in Top Stores / Store Detail pages |
| Add a Category | Category appears in Category grid |
| Add a Banner | Banner appears in Home carousel |
| Add a Coupon | Coupon appears in Cart / Coupons page |
| Update Order Status | Status updates live in user's Orders tab (via Supabase Realtime) |
| Block a Customer | Customer can no longer sign in |
| Toggle Store Open/Closed | Store shows as Open/Closed in user app |

## What's new in v3.0

- **Unified database**: this admin + the FA-User app now share ONE Supabase database. The `users` table now has a `firebase_uid` column (unique, nullable) so the user app can look up customers by their Firebase Auth UID.
- **Prisma removed entirely**. The backend now uses **Supabase only** (via `@supabase/supabase-js`).
- **Single fresh SQL file** at `supabase/fm-admin-fresh.sql` (1602 lines, 82 KB) — drops all existing tables, recreates with the SAME table names as v1, inserts working seed data with real Unsplash image URLs. Run it once in a fresh Supabase project to provision everything.
- Fixed broken seed data from v1 (the old `0002_seed_data.sql` referenced non-existent columns like `module_type`, `applies_to_all` — those are gone now). `firebase_uid` is now a real column in the schema.
- Added `supabaseAdmin()` helper in `src/lib/supabase.ts` for server-side API routes that need to bypass RLS.
- RLS is **disabled by default** in the fresh SQL file for easy testing. Re-enable for production.

## Quick start

```bash
npm install
npm run dev
# → http://localhost:3000
```

**Login (mock mode — no Supabase env vars needed):**
- Email: any value (e.g. `admin@suvio.appzeto.com`)
- Password: any value (e.g. `admin123.`)

### Provisioning the database (fresh Supabase project)

1. Create a new Supabase project at https://supabase.com
2. Open SQL Editor → New query
3. Paste the entire contents of `supabase/fm-admin-fresh.sql` (1602 lines)
4. Click **Run** — this drops any existing tables, creates 53 tables, 20 enums, all triggers/functions/RLS, and inserts ~80+ seed rows
5. The final `SELECT` at the bottom of the file will print row counts for each table to confirm everything inserted correctly

### Enabling real Supabase auth

Add to `.env`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key   # server only, for admin API routes
```

When env vars are missing, the admin runs in **mock mode**: any email/password works, and all CRUD persists to `localStorage`.

## What's included

### Admin shell — 16 sidebar sections + MORE

Exact mirror of food-backend-umber's sidebar structure:

1. **Dashboard**
2. **Point of Sale** — POS checkout with product grid + cart
3. **FOOD MANAGEMENT** — Food Approval, Foods (Restaurant Foods List + Restaurant Addons List), Categories
4. **RESTAURANT MANAGEMENT** — Zone Setup, Restaurants (List, New Joining Request, Unregistered, Reviews, Complaints, Settings, Subscription Settings, Subscription Billing)
5. **ORDER MANAGEMENT** — Orders (All, Pending, Processing, Food On The Way, Delivered, Cancelled, Restaurant cancelled, Payment Failed, Refunded, Offline Payments, User Carts), Order Detect Delivery
6. **PROMOTIONS MANAGEMENT** — Restaurant Coupons & Offers
7. **REFERRAL & REWARDS** — Referral Settings
8. **CUSTOMER MANAGEMENT** — Customers, Support Tickets
9. **DELIVERYMAN MANAGEMENT** — Delivery & Platform Fee, Delivery Withdrawal, Delivery boy Wallet, Delivery Emergency Help, Delivery Support Tickets, Order Reassignment Requests, Deliveryman (New Join Request, List, Live Tracking, Reviews, Bonus, Earning Addon, Earning Addon History, Delivery Earning)
10. **HELP & SUPPORT** — User Feedback, Safety Emergency Reports
11. **REPORT MANAGEMENT** — Transaction Report, Order Report, Tax Report, Restaurant Report, Customer Report
12. **TRANSACTION MANAGEMENT** — Restaurant Withdraws
13. **BANNER SETTINGS** — Landing Page Management, Promotional Banners
14. **SYSTEM SETTINGS** — Broadcast Notification, Business Setup
15. **SUPER POWERS** — Feature Settings, Power Scanning
16. **ADMIN ACCESS** — Sub Admin List, Employee Role
17. **PAGES & SOCIAL MEDIA** — About Us, Terms & Conditions, Privacy Policy, Support, Refund Policy, Shipping Policy, Cancellation Policy
18. **MORE** — Notifications, Analytics, Reports, Wallets (Customers/Vendors/Delivery), Reviews (legacy), Refunds (legacy), Payouts (legacy), Push Campaigns (legacy), Settings

### Database — 53 tables, all in one SQL file

Run `supabase/fm-admin-fresh.sql` once in Supabase SQL Editor. It:
1. Drops any existing tables (CASCADE)
2. Creates 20 enums (`user_role`, `order_status`, `payment_method`, `payment_status`, `vehicle_type`, `discount_type`, `banner_redirect`, `notification_type`, `wallet_tx_type`, `wallet_tx_source`, `disbursement_status`, `payment_provider`, `employee_role`, `ticket_priority`, `ticket_status`, `ticket_category`, `withdrawal_status`, `bonus_type`, `subscription_period`, `emergency_type`)
3. Creates 53 tables (users, customers, vendors, stores, products, orders, order_items, wallets, payments, notifications, banners, reviews, zones, addons, employees, employee_roles, subscription_plans, support_tickets, delivery_withdrawals, restaurant_withdrawals, delivery_bonus, earning_addons, contact_messages, safety_emergency_reports, delivery_support_tickets, broadcast_notifications, feature_settings, business_settings, pages_social_media, restaurant_complaints, restaurant_reviews, delivery_partner_reviews, food_approval_queue, delivery_partner_earnings, pos_orders, etc.)
4. Creates triggers (`set_timestamp`, `generate_order_code`, `update_store_rating`, `update_customer_totals`, `update_vendor_totals`, `update_delivery_man_totals`)
5. Creates helper functions (`is_admin`, `decrement_stock`, `increment_otp_attempts`, `update_delivery_location`, `log_audit`)
6. Configures storage buckets (product_images, store_logos, banner_images, etc.)
7. Adds tables to `supabase_realtime` publication
8. Inserts ~80+ seed rows for testing

### Key technical files

- `src/lib/supabase.ts` — Supabase client (browser) + `supabaseAdmin()` helper (server, bypasses RLS)
- `src/lib/admin-data.ts` — Zustand-style state store with localStorage persistence (fallback when Supabase isn't configured)
- `src/lib/auth-context.tsx` — Supabase auth + mock fallback
- `src/components/admin/shell.tsx` — sidebar nav with section + expandable subtab support
- `src/components/admin/views/switcheats-views.tsx` (1700+ lines, 36 view exports) — every view mirrors food-backend-umber's exact column structures & form fields
- `src/components/admin/views/*.tsx` — original views (dashboard, orders, products, stores, etc.) reused where appropriate
- `src/components/admin/shared.tsx` — shared primitives (PageHeader, StatCard, StatusBadge, Modal, Field, etc.)
- `src/lib/server/admin-store.ts` — server-side in-memory store used by API routes when Supabase isn't configured

### Action buttons per view

Every list/form view exposes visible, working action buttons:
- **New / Create / Add** — opens create modal
- **Edit / View / Eye** — opens edit modal or detail drawer
- **Delete** — confirms via AlertDialog before removal
- **Approve / Reject** — for approval queues (food, vendor, delivery partner, withdrawal, etc.)
- **Toggle / Power** — activate/deactivate
- **Export CSV** — downloads filtered rows as CSV
- **Reply / Respond / Resolve / Close** — for tickets, complaints, feedback
- **Call** — emergency hotline / partner call
- **Save / Submit / Reset** — form actions
- **Send / Send Now** — broadcast notifications

## Deployment

### Vercel

1. Push this repo to GitHub
2. Import in Vercel
3. Add env vars:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (for server-side admin ops)
   - `NEXT_PUBLIC_FIREBASE_API_KEY` (optional, for FCM)
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` (optional)
4. Deploy

### Manual build

```bash
npm run build
npm start
```

## Development notes

- **No Prisma**: this version is Prisma-free. The `prisma/` directory and `@prisma/client` dependency have been removed. The `.env` no longer has `DATABASE_URL`.
- **Mock mode**: without Supabase env vars, the app uses a localStorage-backed mock auth that accepts any credentials. All CRUD operations persist to `localStorage` so changes survive reloads.
- **Realtime**: the existing `src/lib/realtime.ts` uses Supabase channels. In mock mode, the admin shell simulates realtime by advancing random pending orders every 8-12 seconds when "Live" is enabled on the Orders view.

## License

Private. © 2026 Food Munch.
