/**
 * Food Munch — unified food delivery data model.
 *
 * Single app, single model — no separate food/grocery module split.
 * Every store, product, order, category is just "food".
 */

export type UserRole = 'admin' | 'customer' | 'vendor' | 'delivery'

export interface AppUser {
  id: string
  firebase_uid: string
  email: string
  phone?: string
  full_name: string
  role: UserRole
  avatar_url?: string
  is_active: boolean
  created_at: string
}

export interface Store {
  id: string
  name: string
  slug: string
  description?: string
  logo_url?: string
  cover_url?: string
  address: string
  latitude?: number
  longitude?: number
  phone: string
  email?: string
  vendor_id: string
  is_active: boolean
  is_open: boolean
  rating: number
  reviews_count: number
  minimum_order: number
  delivery_fee: number
  delivery_time_minutes: number
  commission_percentage: number
  created_at: string
}

export interface DeliveryArea {
  id: string
  store_id: string
  pincode: string
  delivery_fee: number
  delivery_time_minutes: number
  is_active: boolean
  created_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  parent_id?: string | null
  icon_url?: string
  position: number
  is_active: boolean
  stores_count: number
  items_count: number
}

export interface Product {
  id: string
  store_id: string
  category_id: string
  name: string
  slug: string
  description?: string
  image_url?: string
  images?: string[]
  price: number
  discount_price?: number | null
  unit: string // kg, pcs, liter, pack, etc.
  stock: number
  is_available: boolean
  is_featured: boolean
  rating: number
  reviews_count: number
  tags: string[]
  is_veg?: boolean
  prep_time_minutes?: number
  brand?: string
  barcode?: string
  created_at: string
}

export interface CartItem {
  id: string
  product_id: string
  name: string
  image_url?: string
  unit: string
  price: number
  quantity: number
}

export interface OrderItem {
  product_id: string
  name: string
  image_url?: string
  unit: string
  price: number
  quantity: number
  store_id: string
  store_name: string
}

export type OrderStatus =
  | 'pending'
  | 'accepted'
  | 'preparing'
  | 'ready'
  | 'picked_up'
  | 'on_the_way'
  | 'delivered'
  | 'cancelled'
  | 'rejected'

export type PaymentMethod = 'cash' | 'card' | 'wallet' | 'online'
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'

export interface Order {
  id: string
  order_code: string
  customer_id: string
  customer_name: string
  customer_phone: string
  store_id: string
  store_name: string
  vendor_id: string
  delivery_man_id?: string | null
  delivery_man_name?: string
  items: OrderItem[]
  item_count: number
  subtotal: number
  delivery_fee: number
  discount: number
  tax: number
  total: number
  payment_method: PaymentMethod
  payment_status: PaymentStatus
  status: OrderStatus
  delivery_address: string
  delivery_latitude?: number
  delivery_longitude?: number
  note?: string
  scheduled_at?: string | null
  accepted_at?: string | null
  picked_up_at?: string | null
  delivered_at?: string | null
  rating?: number
  created_at: string
}

export interface Coupon {
  id: string
  code: string
  title: string
  description?: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  minimum_order: number
  maximum_discount?: number
  usage_limit: number
  used_count: number
  start_date: string
  end_date: string
  is_active: boolean
}

export interface Banner {
  id: string
  title: string
  image_url: string
  redirect_type: 'store' | 'category' | 'product' | 'url' | 'none'
  redirect_id?: string
  redirect_url?: string
  position: number
  is_active: boolean
  start_date?: string
  end_date?: string
}

export interface Notification {
  id: string
  user_role: UserRole
  user_id?: string | null
  title: string
  body: string
  type: 'order' | 'promo' | 'system' | 'chat'
  data?: Record<string, unknown>
  is_read: boolean
  created_at: string
}

export interface DeliveryMan {
  id: string
  firebase_uid: string
  full_name: string
  email: string
  phone: string
  avatar_url?: string
  vehicle_type: 'bike' | 'car' | 'cycle' | 'scooter'
  is_online: boolean
  is_active: boolean
  is_approved: boolean
  rating: number
  total_deliveries: number
  current_order_id?: string | null
  latitude?: number
  longitude?: number
  wallet_balance: number
  created_at: string
}

export interface Vendor {
  id: string
  firebase_uid: string
  full_name: string
  email: string
  phone: string
  avatar_url?: string
  store_id?: string
  is_active: boolean
  is_approved: boolean
  total_sales: number
  total_orders: number
  rating: number
  wallet_balance: number
  created_at: string
}

export interface Customer {
  id: string
  firebase_uid: string
  full_name: string
  email: string
  phone: string
  avatar_url?: string
  is_active: boolean
  is_blocked: boolean
  total_orders: number
  total_spent: number
  wallet_balance: number
  loyalty_points: number
  created_at: string
}

export type WalletTxType = 'credit' | 'debit'
export type WalletTxSource =
  | 'order'
  | 'refund'
  | 'topup'
  | 'payout'
  | 'cashback'
  | 'adjustment'

export interface WalletTransaction {
  id: string
  user_id: string
  user_role: UserRole
  user_name: string
  type: WalletTxType
  source: WalletTxSource
  amount: number
  balance_after: number
  description: string
  reference_id?: string
  created_by?: string
  created_at: string
}

export interface DashboardStats {
  total_revenue: number
  total_orders: number
  total_customers: number
  total_stores: number
  total_products: number
  total_vendors: number
  total_delivery_men: number
  pending_orders: number
  active_orders: number
  cancelled_orders: number
  pending_approvals: number
  revenue_change_pct: number
  orders_change_pct: number
  customers_change_pct: number
}

export interface RevenuePoint {
  date: string
  total: number
}

export interface OrderStatusBreakdown {
  status: OrderStatus
  label: string
  count: number
  color: string
}

export interface AppSettings {
  // General
  appName: string
  supportEmail: string
  supportPhone: string
  currency: string
  currencySymbol: string
  timezone: string
  language: string
  defaultCity: string
  minOrderValue: string
  maxDeliveryRadius: string
  deliveryFee: string
  taxRate: string
  // Notifications
  newOrder: boolean
  orderStatusUpdate: boolean
  lowStock: boolean
  vendorRegistration: boolean
  payoutRequest: boolean
  paymentFailure: boolean
  dailySummary: boolean
  weeklyReport: boolean
  pushChannel: boolean
  emailChannel: boolean
  smsChannel: boolean
  // Security
  emailVerification: boolean
  phoneVerification: boolean
  twoFactor: boolean
  googleSignIn: boolean
  autoApproveVendors: boolean
  autoApproveDelivery: boolean
  autoApproveProducts: boolean
  // Commission
  defaultCommission: string
  vendorSubscriptionPlan: string
}
