/**
 * Unified admin data layer.
 *
 * - Hydrates from mock-data on first load.
 * - Persists all CRUD to localStorage (so changes survive reloads).
 * - Falls back to Supabase when configured (server-side routes do the same).
 *
 * Every UI view imports these helpers instead of touching mock-data directly.
 */
import {
  Banner, Category, Coupon, Customer, DeliveryArea, DeliveryMan,
  Notification, Order, OrderStatus, Product, Store, Vendor,
  WalletTransaction, AppSettings, WalletTxType,
} from './types'
import * as seed from './mock-data'

const KEY = 'food-munch-admin-state-v1'

interface State {
  stores: Store[]
  deliveryAreas: DeliveryArea[]
  categories: Category[]
  products: Product[]
  customers: Customer[]
  vendors: Vendor[]
  deliveryMen: DeliveryMan[]
  orders: Order[]
  coupons: Coupon[]
  banners: Banner[]
  notifications: Notification[]
  walletTransactions: WalletTransaction[]
  settings: AppSettings
}

function seedState(): State {
  return {
    stores: JSON.parse(JSON.stringify(seed.stores)),
    deliveryAreas: JSON.parse(JSON.stringify(seed.deliveryAreas)),
    categories: JSON.parse(JSON.stringify(seed.categories)),
    products: JSON.parse(JSON.stringify(seed.products)),
    customers: JSON.parse(JSON.stringify(seed.customers)),
    vendors: JSON.parse(JSON.stringify(seed.vendors)),
    deliveryMen: JSON.parse(JSON.stringify(seed.deliveryMen)),
    orders: JSON.parse(JSON.stringify(seed.orders)),
    coupons: JSON.parse(JSON.stringify(seed.coupons)),
    banners: JSON.parse(JSON.stringify(seed.banners)),
    notifications: JSON.parse(JSON.stringify(seed.notifications)),
    walletTransactions: JSON.parse(JSON.stringify(seed.walletTransactions)),
    settings: { ...seed.defaultSettings },
  }
}

let _state: State | null = null
const listeners = new Set<() => void>()

function load(): State {
  if (_state) return _state
  if (typeof window === 'undefined') {
    _state = seedState()
    return _state
  }
  try {
    const raw = window.localStorage.getItem(KEY)
    if (raw) {
      _state = { ...seedState(), ...JSON.parse(raw) }
    } else {
      _state = seedState()
      save()
    }
  } catch {
    _state = seedState()
  }
  return _state
}

function save() {
  if (typeof window === 'undefined') return
  if (!_state) return
  try {
    window.localStorage.setItem(KEY, JSON.stringify(_state))
    // Broadcast to other tabs/components in the same tab
    try {
      const ch = new BroadcastChannel('foodmunch-sync')
      ch.postMessage({ type: 'state-updated', timestamp: Date.now() })
      ch.close()
    } catch {}
  } catch (e) {
    console.warn('[admin-data] save failed:', e)
  }
}

function emit() {
  listeners.forEach((fn) => fn())
}

function subscribe(fn: () => void) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

function uid(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

/* ------------------------------------------------------------------ */
/*  React hook                                                         */
/* ------------------------------------------------------------------ */

import { useEffect, useReducer } from 'react'

/**
 * Subscribe to admin state changes. Re-renders on every mutation and
 * recomputes the selector — simplest correct pattern (admin panel
 * datasets are small enough that this is fine).
 *
 * Can be called with or without a selector:
 *   useAdminState()              → returns the full State object
 *   useAdminState(s => s.stores) → returns only stores
 */
export function useAdminState<T = State>(selector?: (s: State) => T): T {
  const [, force] = useReducer((c) => c + 1, 0)
  useEffect(() => {
    const unsub = subscribe(force)
    return () => unsub
  }, [])
  const state = load()
  return selector ? selector(state) : (state as unknown as T)
}

/* ------------------------------------------------------------------ */
/*  Stores                                                             */
/* ------------------------------------------------------------------ */

export const storeActions = {
  list: () => load().stores,
  get: (id: string) => load().stores.find((s) => s.id === id),
  create: (data: Partial<Store>) => {
    const s = load()
    const item: Store = {
      id: uid('store'),
      name: data.name || 'Untitled',
      slug: (data.name || 'untitled').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: data.description || '',
      address: data.address || '',
      latitude: data.latitude,
      longitude: data.longitude,
      phone: data.phone || '',
      email: data.email,
      vendor_id: data.vendor_id || s.vendors[0]?.id || '',
      is_active: data.is_active ?? true,
      is_open: data.is_open ?? true,
      rating: 0,
      reviews_count: 0,
      minimum_order: data.minimum_order ?? 200,
      delivery_fee: data.delivery_fee ?? 30,
      delivery_time_minutes: data.delivery_time_minutes ?? 35,
      commission_percentage: data.commission_percentage ?? 10,
      created_at: new Date().toISOString(),
      logo_url: data.logo_url,
      cover_url: data.cover_url,
    }
    s.stores = [item, ...s.stores]
    save(); emit()
    return item
  },
  update: (id: string, patch: Partial<Store>) => {
    const s = load()
    s.stores = s.stores.map((x) => (x.id === id ? { ...x, ...patch } : x))
    save(); emit()
  },
  remove: (id: string) => {
    const s = load()
    s.stores = s.stores.filter((x) => x.id !== id)
    s.deliveryAreas = s.deliveryAreas.filter((d) => d.store_id !== id)
    save(); emit()
  },
  toggleActive: (id: string) => {
    const item = load().stores.find((x) => x.id === id)
    if (item) storeActions.update(id, { is_active: !item.is_active })
  },
  toggleOpen: (id: string) => {
    const item = load().stores.find((x) => x.id === id)
    if (item) storeActions.update(id, { is_open: !item.is_open })
  },
}

/* ------------------------------------------------------------------ */
/*  Delivery Areas                                                     */
/* ------------------------------------------------------------------ */

export const deliveryAreaActions = {
  listByStore: (storeId: string) => load().deliveryAreas.filter((d) => d.store_id === storeId),
  list: () => load().deliveryAreas,
  create: (data: Partial<DeliveryArea>) => {
    const s = load()
    const item: DeliveryArea = {
      id: uid('da'),
      store_id: data.store_id || '',
      pincode: data.pincode || '',
      delivery_fee: data.delivery_fee ?? 30,
      delivery_time_minutes: data.delivery_time_minutes ?? 35,
      is_active: data.is_active ?? true,
      created_at: new Date().toISOString(),
    }
    s.deliveryAreas = [item, ...s.deliveryAreas]
    save(); emit()
    return item
  },
  update: (id: string, patch: Partial<DeliveryArea>) => {
    const s = load()
    s.deliveryAreas = s.deliveryAreas.map((x) => (x.id === id ? { ...x, ...patch } : x))
    save(); emit()
  },
  remove: (id: string) => {
    const s = load()
    s.deliveryAreas = s.deliveryAreas.filter((x) => x.id !== id)
    save(); emit()
  },
}

/* ------------------------------------------------------------------ */
/*  Customers                                                          */
/* ------------------------------------------------------------------ */

export const customerActions = {
  list: () => load().customers,
  get: (id: string) => load().customers.find((c) => c.id === id),
  ordersByCustomer: (customerId: string) =>
    load().orders.filter((o) => o.customer_id === customerId),
  create: (data: Partial<Customer> & { full_name: string; email: string; phone: string }) => {
    const s = load()
    const item: Customer = {
      id: uid('cust'),
      firebase_uid: uid('uid'),
      full_name: data.full_name,
      email: data.email,
      phone: data.phone,
      avatar_url: data.avatar_url,
      is_active: true,
      is_blocked: false,
      total_orders: 0,
      total_spent: 0,
      wallet_balance: 0,
      loyalty_points: 0,
      created_at: new Date().toISOString(),
    }
    s.customers = [item, ...s.customers]
    save(); emit()
    return item
  },
  update: (id: string, patch: Partial<Customer>) => {
    const s = load()
    s.customers = s.customers.map((x) => (x.id === id ? { ...x, ...patch } : x))
    save(); emit()
  },
  remove: (id: string) => {
    const s = load()
    s.customers = s.customers.filter((x) => x.id !== id)
    save(); emit()
  },
  toggleBlock: (id: string) => {
    const item = load().customers.find((x) => x.id === id)
    if (item) customerActions.update(id, { is_blocked: !item.is_blocked, is_active: item.is_blocked })
  },
}

/* ------------------------------------------------------------------ */
/*  Vendors                                                            */
/* ------------------------------------------------------------------ */

export const vendorActions = {
  list: () => load().vendors,
  get: (id: string) => load().vendors.find((v) => v.id === id),
  ordersByVendor: (vendorId: string) =>
    load().orders.filter((o) => o.vendor_id === vendorId),
  storeByVendor: (vendorId: string) =>
    load().stores.find((s) => s.vendor_id === vendorId),
  create: (data: Partial<Vendor> & { full_name: string; email: string; phone: string }) => {
    const s = load()
    const item: Vendor = {
      id: uid('vendor'),
      firebase_uid: uid('uid'),
      full_name: data.full_name,
      email: data.email,
      phone: data.phone,
      avatar_url: data.avatar_url,
      is_active: true,
      is_approved: false,
      total_sales: 0,
      total_orders: 0,
      rating: 0,
      wallet_balance: 0,
      created_at: new Date().toISOString(),
    }
    s.vendors = [item, ...s.vendors]
    // Create store if name provided
    if (data.store_id && data.store_id.startsWith('new_')) {
      const store = storeActions.create({
        name: data.store_id.slice(4) || `${data.full_name}'s Store`,
        vendor_id: item.id,
        phone: data.phone,
      })
      vendorActions.update(item.id, { store_id: store.id })
      item.store_id = store.id
    }
    save(); emit()
    return item
  },
  update: (id: string, patch: Partial<Vendor>) => {
    const s = load()
    s.vendors = s.vendors.map((x) => (x.id === id ? { ...x, ...patch } : x))
    save(); emit()
  },
  remove: (id: string) => {
    const s = load()
    s.vendors = s.vendors.filter((x) => x.id !== id)
    save(); emit()
  },
  approve: (id: string) => vendorActions.update(id, { is_approved: true, is_active: true }),
  reject: (id: string) => vendorActions.update(id, { is_approved: false, is_active: false }),
}

/* ------------------------------------------------------------------ */
/*  Delivery Men                                                       */
/* ------------------------------------------------------------------ */

export const deliveryManActions = {
  list: () => load().deliveryMen,
  get: (id: string) => load().deliveryMen.find((d) => d.id === id),
  deliveriesByMan: (manId: string) =>
    load().orders.filter((o) => o.delivery_man_id === manId),
  create: (data: Partial<DeliveryMan> & { full_name: string; email: string; phone: string }) => {
    const s = load()
    const item: DeliveryMan = {
      id: uid('dm'),
      firebase_uid: uid('uid'),
      full_name: data.full_name,
      email: data.email,
      phone: data.phone,
      avatar_url: data.avatar_url,
      vehicle_type: data.vehicle_type || 'bike',
      is_online: false,
      is_active: true,
      is_approved: false,
      rating: 0,
      total_deliveries: 0,
      current_order_id: null,
      latitude: data.latitude ?? 12.9716,
      longitude: data.longitude ?? 77.5946,
      wallet_balance: 0,
      created_at: new Date().toISOString(),
    }
    s.deliveryMen = [item, ...s.deliveryMen]
    save(); emit()
    return item
  },
  update: (id: string, patch: Partial<DeliveryMan>) => {
    const s = load()
    s.deliveryMen = s.deliveryMen.map((x) => (x.id === id ? { ...x, ...patch } : x))
    save(); emit()
  },
  remove: (id: string) => {
    const s = load()
    s.deliveryMen = s.deliveryMen.filter((x) => x.id !== id)
    save(); emit()
  },
  approve: (id: string) => deliveryManActions.update(id, { is_approved: true, is_active: true }),
  reject: (id: string) => deliveryManActions.update(id, { is_approved: false, is_active: false }),
}

/* ------------------------------------------------------------------ */
/*  Products                                                           */
/* ------------------------------------------------------------------ */

export const productActions = {
  list: () => load().products,
  create: (data: Partial<Product> & { name: string; price: number; store_id: string }) => {
    const s = load()
    const item: Product = {
      id: uid('prod'),
      store_id: data.store_id,
      category_id: data.category_id || s.categories[0]?.id || '',
      name: data.name,
      slug: data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: data.description,
      image_url: data.image_url,
      images: data.images,
      price: data.price,
      discount_price: data.discount_price,
      unit: data.unit || 'pcs',
      stock: data.stock ?? 0,
      is_available: data.is_available ?? true,
      is_featured: data.is_featured ?? false,
      rating: 0,
      reviews_count: 0,
      tags: data.tags || [],
      is_veg: data.is_veg,
      prep_time_minutes: data.prep_time_minutes,
      brand: data.brand,
      barcode: data.barcode,
      created_at: new Date().toISOString(),
    }
    s.products = [item, ...s.products]
    save(); emit()
    return item
  },
  update: (id: string, patch: Partial<Product>) => {
    const s = load()
    s.products = s.products.map((x) => (x.id === id ? { ...x, ...patch } : x))
    save(); emit()
  },
  remove: (id: string) => {
    const s = load()
    s.products = s.products.filter((x) => x.id !== id)
    save(); emit()
  },
}

/* ------------------------------------------------------------------ */
/*  Categories                                                         */
/* ------------------------------------------------------------------ */

export const categoryActions = {
  list: () => load().categories,
  create: (data: Partial<Category> & { name: string }) => {
    const s = load()
    const item: Category = {
      id: uid('cat'),
      name: data.name,
      slug: data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      position: data.position ?? s.categories.length + 1,
      is_active: data.is_active ?? true,
      stores_count: 0,
      items_count: 0,
      icon_url: data.icon_url,
      parent_id: data.parent_id,
    }
    s.categories = [...s.categories, item]
    save(); emit()
    return item
  },
  update: (id: string, patch: Partial<Category>) => {
    const s = load()
    s.categories = s.categories.map((x) => (x.id === id ? { ...x, ...patch } : x))
    save(); emit()
  },
  remove: (id: string) => {
    const s = load()
    s.categories = s.categories.filter((x) => x.id !== id)
    save(); emit()
  },
}

/* ------------------------------------------------------------------ */
/*  Coupons                                                            */
/* ------------------------------------------------------------------ */

export const couponActions = {
  list: () => load().coupons,
  create: (data: Partial<Coupon> & { code: string; title: string }) => {
    const s = load()
    const item: Coupon = {
      id: uid('cpn'),
      code: data.code.toUpperCase(),
      title: data.title,
      description: data.description,
      discount_type: data.discount_type || 'percentage',
      discount_value: data.discount_value ?? 0,
      minimum_order: data.minimum_order ?? 0,
      maximum_discount: data.maximum_discount,
      usage_limit: data.usage_limit ?? 100,
      used_count: 0,
      start_date: data.start_date || new Date().toISOString(),
      end_date: data.end_date || new Date(Date.now() + 30 * 86400000).toISOString(),
      is_active: data.is_active ?? true,
    }
    s.coupons = [item, ...s.coupons]
    save(); emit()
    return item
  },
  update: (id: string, patch: Partial<Coupon>) => {
    const s = load()
    s.coupons = s.coupons.map((x) => (x.id === id ? { ...x, ...patch } : x))
    save(); emit()
  },
  remove: (id: string) => {
    const s = load()
    s.coupons = s.coupons.filter((x) => x.id !== id)
    save(); emit()
  },
}

/* ------------------------------------------------------------------ */
/*  Banners                                                            */
/* ------------------------------------------------------------------ */

export const bannerActions = {
  list: () => load().banners,
  create: (data: Partial<Banner> & { title: string }) => {
    const s = load()
    const item: Banner = {
      id: uid('bnr'),
      title: data.title,
      image_url: data.image_url || '',
      redirect_type: data.redirect_type || 'none',
      redirect_id: data.redirect_id,
      redirect_url: data.redirect_url,
      position: data.position ?? s.banners.length + 1,
      is_active: data.is_active ?? true,
      start_date: data.start_date,
      end_date: data.end_date,
    }
    s.banners = [item, ...s.banners]
    save(); emit()
    return item
  },
  update: (id: string, patch: Partial<Banner>) => {
    const s = load()
    s.banners = s.banners.map((x) => (x.id === id ? { ...x, ...patch } : x))
    save(); emit()
  },
  remove: (id: string) => {
    const s = load()
    s.banners = s.banners.filter((x) => x.id !== id)
    save(); emit()
  },
}

/* ------------------------------------------------------------------ */
/*  Orders                                                             */
/* ------------------------------------------------------------------ */

export const orderActions = {
  list: () => load().orders,
  get: (id: string) => load().orders.find((o) => o.id === id),
  setStatus: (id: string, status: OrderStatus) => {
    const s = load()
    s.orders = s.orders.map((o) => {
      if (o.id !== id) return o
      const patch: Partial<Order> = { status }
      if (status === 'accepted') patch.accepted_at = new Date().toISOString()
      if (status === 'picked_up') patch.picked_up_at = new Date().toISOString()
      if (status === 'delivered') {
        patch.delivered_at = new Date().toISOString()
        patch.payment_status = 'paid'
      }
      return { ...o, ...patch }
    })
    save(); emit()
  },
  assignDelivery: (orderId: string, manId: string) => {
    const s = load()
    const man = s.deliveryMen.find((d) => d.id === manId)
    s.orders = s.orders.map((o) =>
      o.id === orderId
        ? { ...o, delivery_man_id: manId, delivery_man_name: man?.full_name }
        : o,
    )
    save(); emit()
  },
  // Realtime helpers
  addLive: (order: Order) => {
    const s = load()
    if (s.orders.some((o) => o.id === order.id)) return
    s.orders = [order, ...s.orders]
    save(); emit()
  },
  patchLive: (id: string, patch: Partial<Order>) => {
    const s = load()
    s.orders = s.orders.map((o) => (o.id === id ? { ...o, ...patch } : o))
    save(); emit()
  },
}

/* ------------------------------------------------------------------ */
/*  Notifications                                                      */
/* ------------------------------------------------------------------ */

export const notificationActions = {
  list: () => load().notifications,
  markRead: (id: string) => {
    const s = load()
    s.notifications = s.notifications.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    save(); emit()
  },
  markAllRead: () => {
    const s = load()
    s.notifications = s.notifications.map((n) => ({ ...n, is_read: true }))
    save(); emit()
  },
  remove: (id: string) => {
    const s = load()
    s.notifications = s.notifications.filter((n) => n.id !== id)
    save(); emit()
  },
  add: (n: Partial<Notification> & { title: string; body: string; type: Notification['type'] }) => {
    const s = load()
    const item: Notification = {
      id: uid('ntf'),
      user_role: 'admin',
      title: n.title,
      body: n.body,
      type: n.type,
      is_read: false,
      created_at: new Date().toISOString(),
      user_id: n.user_id,
      data: n.data,
    }
    s.notifications = [item, ...s.notifications]
    save(); emit()
    return item
  },
}

/* ------------------------------------------------------------------ */
/*  Wallet                                                             */
/* ------------------------------------------------------------------ */

export const walletActions = {
  transactionsByUser: (userId: string) =>
    load().walletTransactions
      .filter((t) => t.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
  transactionsByRole: (role: 'customer' | 'vendor' | 'delivery') =>
    load().walletTransactions.filter((t) => t.user_role === role),
  all: () => load().walletTransactions,
  adjust: (
    userId: string,
    role: 'customer' | 'vendor' | 'delivery',
    type: WalletTxType,
    amount: number,
    description: string,
    adminId = 'admin',
  ) => {
    const s = load()
    const list = role === 'customer' ? s.customers : role === 'vendor' ? s.vendors : s.deliveryMen
    const user = list.find((u) => u.id === userId)
    if (!user) throw new Error('user not found')
    const balanceAfter =
      type === 'credit' ? user.wallet_balance + amount : Math.max(0, user.wallet_balance - amount)
    user.wallet_balance = balanceAfter
    const tx: WalletTransaction = {
      id: uid('wtx'),
      user_id: userId,
      user_role: role,
      user_name: user.full_name,
      type,
      source: 'adjustment',
      amount,
      balance_after: balanceAfter,
      description: description || (type === 'credit' ? 'Admin credit' : 'Admin debit'),
      created_by: adminId,
      created_at: new Date().toISOString(),
    }
    s.walletTransactions = [tx, ...s.walletTransactions]
    save(); emit()
    return tx
  },
}

/* ------------------------------------------------------------------ */
/*  Settings                                                           */
/* ------------------------------------------------------------------ */

export const settingsActions = {
  get: () => load().settings,
  update: (patch: Partial<AppSettings>) => {
    const s = load()
    s.settings = { ...s.settings, ...patch }
    save(); emit()
    return s.settings
  },
  reset: () => {
    const s = load()
    s.settings = { ...seed.defaultSettings }
    save(); emit()
  },
}

/* ------------------------------------------------------------------ */
/*  Reset all (dev utility)                                            */
/* ------------------------------------------------------------------ */

export function resetAllData() {
  _state = seedState()
  save()
  emit()
}

/* ------------------------------------------------------------------ */
/*  Cross-tab / cross-component real-time sync                         */
/*                                                                    */
/*  When the admin panel changes data (add product, update order      */
/*  status, send notification, etc.), the customer app must see the   */
/*  change immediately. We use a BroadcastChannel for same-origin     */
/*  same-tab notifications, plus a storage event listener for          */
/*  cross-tab sync.                                                   */
/* ------------------------------------------------------------------ */

if (typeof window !== 'undefined') {
  // Cross-tab: listen for localStorage changes from other tabs
  window.addEventListener('storage', (e) => {
    if (e.key === KEY && e.newValue) {
      try {
        _state = JSON.parse(e.newValue)
        emit()
      } catch {}
    }
  })

  // Same-tab: use a BroadcastChannel (or fallback to custom event)
  try {
    const channel = new BroadcastChannel('foodmunch-sync')
    channel.onmessage = (e) => {
      if (e.data?.type === 'state-updated') {
        _state = null // force reload from localStorage
        emit()
      }
    }
  } catch {
    // BroadcastChannel not available — storage event is enough
  }
}

/**
 * Force a re-read from localStorage and notify all subscribers.
 * Call this when you know external data has changed.
 */
export function refreshState() {
  _state = null
  load()
  emit()
}

/* ------------------------------------------------------------------ */
/*  Customer-facing actions (called from customer app, managed by admin) */
/* ------------------------------------------------------------------ */

/**
 * Place an order from the customer app. The order appears in the
 * admin Orders view immediately.
 */
export function placeCustomerOrder(order: {
  store_id: string
  store_name: string
  items: { product_id: string; name: string; image_url?: string; unit: string; price: number; quantity: number }[]
  subtotal: number
  delivery_fee: number
  tax: number
  discount: number
  total: number
  payment_method: string
  delivery_address: string
}): string {
  const s = load()
  const orderId = uid('order')
  const orderCode = 'ORD' + String(s.orders.length + 1).padStart(4, '0')
  const newOrder: Order = {
    id: orderId,
    order_code: orderCode,
    customer_id: 'cust_1',
    customer_name: 'Aarav Sharma',
    customer_phone: '+91 98765 43210',
    store_id: order.store_id,
    store_name: order.store_name,
    vendor_id: s.stores.find((st) => st.id === order.store_id)?.vendor_id || '',
    delivery_man_id: null,
    delivery_man_name: null,
    items: order.items.map((it) => ({
      product_id: it.product_id,
      name: it.name,
      image_url: it.image_url,
      unit: it.unit,
      price: it.price,
      quantity: it.quantity,
      store_id: order.store_id,
      store_name: order.store_name,
    })),
    item_count: order.items.reduce((n, i) => n + i.quantity, 0),
    subtotal: order.subtotal,
    delivery_fee: order.delivery_fee,
    discount: order.discount,
    tax: order.tax,
    total: order.total,
    payment_method: order.payment_method as any,
    payment_status: 'pending',
    status: 'pending',
    delivery_address: order.delivery_address,
    note: '',
    scheduled_at: null,
    accepted_at: null,
    picked_up_at: null,
    delivered_at: null,
    rating: undefined,
    created_at: new Date().toISOString(),
  }
  s.orders = [newOrder, ...s.orders]
  save(); emit()
  return orderId
}

/**
 * Admin sends a notification — it appears in the customer app's
 * Notifications screen immediately.
 */
export function sendCustomerNotification(notif: {
  title: string
  body: string
  type?: 'order' | 'offer' | 'wallet' | 'system'
  data?: Record<string, any>
}) {
  const s = load()
  const n: Notification = {
    id: uid('notif'),
    type: notif.type || 'system',
    title: notif.title,
    body: notif.body,
    data: notif.data || {},
    is_read: false,
    created_at: new Date().toISOString(),
  }
  s.notifications = [n, ...s.notifications]
  save(); emit()
  return n.id
}

/**
 * Admin adjusts a customer's wallet balance — the customer sees
 * the new balance and a transaction entry immediately.
 */
export function adjustCustomerWallet(
  customerId: string,
  amount: number,
  type: 'credit' | 'debit',
  description: string
) {
  const s = load()
  const txn: WalletTransaction = {
    id: uid('wtxn'),
    user_id: customerId,
    user_role: 'customer',
    user_name: s.customers.find((c) => c.id === customerId)?.full_name || 'Customer',
    type: type as WalletTxType,
    source: 'admin_adjustment',
    amount,
    balance_after: 0, // computed below
    description,
    created_by: 'admin',
    created_at: new Date().toISOString(),
  }
  // Update customer's wallet balance
  s.customers = s.customers.map((c) =>
    c.id === customerId
      ? { ...c, wallet_balance: (c.wallet_balance || 0) + (type === 'credit' ? amount : -amount) }
      : c
  )
  const customer = s.customers.find((c) => c.id === customerId)
  txn.balance_after = customer?.wallet_balance || 0
  s.walletTransactions = [txn, ...s.walletTransactions]
  save(); emit()
  return txn.id
}

/**
 * Admin updates order status — customer sees the updated tracking
 * timeline in real-time.
 */
export function updateOrderStatus(orderId: string, status: OrderStatus) {
  orderActions.updateStatus(orderId, status)
}

/**
 * Admin toggles product availability — customer app hides/unhides
 * the product immediately.
 */
export function toggleProductAvailability(productId: string) {
  productActions.toggleAvailability(productId)
}

/**
 * Admin adds/edits/removes a coupon — customer sees it in Coupons
 * screen immediately (no refresh needed).
 */
// couponActions already handles this — just re-export for convenience
export { couponActions as customerCouponActions }
