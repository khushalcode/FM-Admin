/**
 * Server-side in-memory data store.
 *
 * Used by API routes when Supabase isn't configured. The data resets on
 * server restart — for production, configure Supabase env vars.
 */
import {
  customers as seedCustomers,
  vendors as seedVendors,
  deliveryMen as seedDeliveryMen,
  stores as seedStores,
  deliveryAreas as seedDeliveryAreas,
  orders as seedOrders,
  walletTransactions as seedWalletTx,
  defaultSettings,
} from '@/lib/mock-data'
import {
  Banner, Category, Coupon, Customer, DeliveryArea, DeliveryMan,
  Notification, Order, Product, Store, Vendor, WalletTransaction,
  AppSettings,
} from '@/lib/types'
import { notifications as seedNotifs, coupons as seedCoupons, banners as seedBanners, categories as seedCats, products as seedProducts } from '@/lib/mock-data'

export interface ServerState {
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

const g = globalThis as unknown as { __adminState?: ServerState }

function seed(): ServerState {
  return {
    stores: JSON.parse(JSON.stringify(seedStores)),
    deliveryAreas: JSON.parse(JSON.stringify(seedDeliveryAreas)),
    categories: JSON.parse(JSON.stringify(seedCats)),
    products: JSON.parse(JSON.stringify(seedProducts)),
    customers: JSON.parse(JSON.stringify(seedCustomers)),
    vendors: JSON.parse(JSON.stringify(seedVendors)),
    deliveryMen: JSON.parse(JSON.stringify(seedDeliveryMen)),
    orders: JSON.parse(JSON.stringify(seedOrders)),
    coupons: JSON.parse(JSON.stringify(seedCoupons)),
    banners: JSON.parse(JSON.stringify(seedBanners)),
    notifications: JSON.parse(JSON.stringify(seedNotifs)),
    walletTransactions: JSON.parse(JSON.stringify(seedWalletTx)),
    settings: { ...defaultSettings },
  }
}

export function getServerState(): ServerState {
  if (!g.__adminState) g.__adminState = seed()
  return g.__adminState
}

export function uid(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

export function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export function csvResponse(rows: Array<Record<string, any>>, filename: string) {
  if (!rows.length) {
    return new Response('No data', { status: 400, headers: { 'Content-Type': 'text/plain' } })
  }
  const headers = Object.keys(rows[0])
  const escape = (v: any) => {
    const s = v === null || v === undefined ? '' : String(v)
    return `"${s.replace(/"/g, '""')}"`
  }
  const csv = [
    headers.join(','),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(',')),
  ].join('\n')
  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
