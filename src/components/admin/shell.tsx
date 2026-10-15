'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  LayoutDashboard, ShoppingBag, Package, Store, Tag, Users,
  Truck, Ticket, Image as ImageIcon, Bell, BarChart3, Settings,
  Search, ChevronDown, LogOut, Menu, X,
  CheckCircle2, Circle, AlertCircle, Wallet, FileBarChart, Star,
  CreditCard, FolderTree, Utensils, UtensilsCrossed, MapPin,
  FileText, Megaphone, Gift, DollarSign, PiggyBank, Phone,
  MessageSquare, Mail, AlertTriangle, Receipt, Globe, Lock,
  Headset, X as XIcon, Zap, UserCog, Database, ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { isSupabaseConfigured } from '@/lib/supabase'
import { isFirebaseConfigured } from '@/lib/firebase'
import { useAuth } from '@/lib/auth-context'
import { LoginScreen } from './login'
import { DashboardView } from './views/dashboard'
import { OrdersView } from './views/orders'
import { ProductsView } from './views/products'
import { StoresView } from './views/stores'
import { CategoriesView } from './views/categories'
import { CustomersView } from './views/customers'
import { VendorsView } from './views/vendors'
import { DeliveryMenView } from './views/delivery-men'
import { CouponsView } from './views/coupons'
import { BannersView } from './views/banners'
import { NotificationsView } from './views/notifications'
import { AnalyticsView } from './views/analytics'
import { SettingsView } from './views/settings'
import { ReportsView } from './views/reports'
import {
  WalletsCustomersView,
  WalletsVendorsView,
  WalletsDeliveryView,
} from './views/wallets'
import {
  LiveTrackingView,
  ReviewsView,
  RefundsView,
  PayoutsView,
  PushCampaignsView,
} from './views/new-views'
import {
  PointOfSaleView,
  FoodApprovalView,
  AddonsView,
  ZoneSetupView,
  RestaurantsJoiningRequestView,
  RestaurantsUnregisteredView,
  RestaurantsReviewsView,
  RestaurantsComplaintsView,
  RestaurantsSettingsView,
  SubscriptionSettingsView,
  SubscriptionBillingView,
  OrdersByStatusView,
  OrderDetectDeliveryView,
  ReferralSettingsView,
  SupportTicketsView,
  FeeSettingsView,
  DeliveryWithdrawalView,
  DeliveryBoyWalletView,
  DeliveryEmergencyHelpView,
  DeliverySupportTicketsView,
  DeliveryOrderReassignmentRequestsView,
  DeliveryPartnersJoinRequestView,
  DeliveryPartnersReviewsView,
  DeliveryPartnersBonusView,
  DeliveryPartnersEarningAddonView,
  DeliveryPartnersEarningAddonHistoryView,
  DeliveryPartnersEarningsView,
  ContactMessagesView,
  SafetyEmergencyReportsView,
  TransactionReportView,
  OrderReportView,
  TaxReportView,
  RestaurantReportView,
  CustomerReportView,
  RestaurantWithdrawsView,
  HeroBannerManagementView,
  PromotionalBannerView,
  BroadcastNotificationView,
  BusinessSetupView,
  FeatureSettingsView,
  PowerScanningView,
  EmployeesView,
  EmployeeRoleView,
  PagesSocialMediaView,
} from './views/switcheats-views'
import { useAdminState, notificationActions } from '@/lib/admin-data'

type View =
  // Top-level
  | 'dashboard' | 'point-of-sale'
  // Food management
  | 'food-approval' | 'foods' | 'addons' | 'categories'
  // Restaurant management
  | 'zone-setup' | 'restaurants' | 'restaurants-joining-request'
  | 'restaurants-unregistered' | 'restaurants-reviews' | 'restaurants-complaints'
  | 'restaurants-settings' | 'subscription-settings' | 'subscription-billing'
  // Order management
  | 'orders-all' | 'orders-pending' | 'orders-processing' | 'orders-food-on-the-way'
  | 'orders-delivered' | 'orders-canceled' | 'orders-restaurant-cancelled'
  | 'orders-payment-failed' | 'orders-refunded' | 'orders-offline-payments'
  | 'orders-user-carts' | 'order-detect-delivery'
  // Promotions & rewards
  | 'coupons' | 'referral-settings'
  // Customer management
  | 'customers' | 'support-tickets'
  // Deliveryman management
  | 'fee-settings' | 'delivery-withdrawal' | 'delivery-boy-wallet'
  | 'delivery-emergency-help' | 'delivery-support-tickets'
  | 'delivery-order-reassignment-requests'
  | 'delivery-partners-join-request' | 'delivery-partners'
  | 'live-tracking' | 'delivery-partners-reviews' | 'delivery-partners-bonus'
  | 'delivery-partners-earning-addon' | 'delivery-partners-earning-addon-history'
  | 'delivery-partners-earnings'
  // Help & support
  | 'contact-messages' | 'safety-emergency-reports'
  // Report management
  | 'transaction-report' | 'order-report' | 'tax-report'
  | 'restaurant-report' | 'customer-report'
  // Transaction management
  | 'restaurant-withdraws'
  // Banner management
  | 'hero-banner-management' | 'promotional-banner'
  // System settings
  | 'broadcast-notification' | 'business-setup'
  // Super powers
  | 'feature-settings' | 'power-scanning'
  // Admin access
  | 'employees' | 'employee-role'
  // Pages & social media
  | 'pages-social-media'
  // Legacy/extra (kept for completeness)
  | 'notifications' | 'settings' | 'analytics' | 'reports'
  | 'wallets-customers' | 'wallets-vendors' | 'wallets-delivery'
  | 'reviews' | 'refunds' | 'payouts' | 'push-campaigns'

type NavItem =
  | { type: 'link'; id: View; label: string; icon: typeof LayoutDashboard }
  | { type: 'section'; label: string; items: NavChild[] }

interface NavChild {
  type: 'link' | 'expandable'
  id?: View
  label: string
  icon?: typeof LayoutDashboard
  subItems?: { id: View; label: string }[]
}

const NAV: NavItem[] = [
  { type: 'link', id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { type: 'link', id: 'point-of-sale', label: 'Point of Sale', icon: CreditCard },

  {
    type: 'section',
    label: 'FOOD MANAGEMENT',
    items: [
      { type: 'link', id: 'food-approval', label: 'Food Approval', icon: CheckCircle2 },
      {
        type: 'expandable',
        label: 'Foods',
        icon: Utensils,
        subItems: [
          { id: 'foods', label: 'Restaurant Foods List' },
          { id: 'addons', label: 'Restaurant Addons List' },
        ],
      },
      { type: 'link', id: 'categories', label: 'Categories', icon: FolderTree },
    ],
  },

  {
    type: 'section',
    label: 'RESTAURANT MANAGEMENT',
    items: [
      { type: 'link', id: 'zone-setup', label: 'Zone Setup', icon: MapPin },
      {
        type: 'expandable',
        label: 'Restaurants',
        icon: UtensilsCrossed,
        subItems: [
          { id: 'restaurants', label: 'Restaurants List' },
          { id: 'restaurants-joining-request', label: 'New Joining Request' },
          { id: 'restaurants-unregistered', label: 'Unregistered Restaurants' },
          { id: 'restaurants-reviews', label: 'Restaurant Reviews' },
          { id: 'restaurants-complaints', label: 'Restaurant Complaints' },
          { id: 'restaurants-settings', label: 'Restaurant Settings' },
          { id: 'subscription-settings', label: 'Subscription Settings' },
          { id: 'subscription-billing', label: 'Subscription Billing' },
        ],
      },
    ],
  },

  {
    type: 'section',
    label: 'ORDER MANAGEMENT',
    items: [
      {
        type: 'expandable',
        label: 'Orders',
        icon: FileText,
        subItems: [
          { id: 'orders-all', label: 'All' },
          { id: 'orders-pending', label: 'Pending' },
          { id: 'orders-processing', label: 'Processing' },
          { id: 'orders-food-on-the-way', label: 'Food On The Way' },
          { id: 'orders-delivered', label: 'Delivered' },
          { id: 'orders-canceled', label: 'Cancelled' },
          { id: 'orders-restaurant-cancelled', label: 'Restaurant cancelled' },
          { id: 'orders-payment-failed', label: 'Payment Failed' },
          { id: 'orders-refunded', label: 'Refunded' },
          { id: 'orders-offline-payments', label: 'Offline Payments' },
          { id: 'orders-user-carts', label: 'User Carts' },
        ],
      },
      { type: 'link', id: 'order-detect-delivery', label: 'Order Detect Delivery', icon: Truck },
    ],
  },

  {
    type: 'section',
    label: 'PROMOTIONS MANAGEMENT',
    items: [
      { type: 'link', id: 'coupons', label: 'Restaurant Coupons & Offers', icon: Gift },
    ],
  },

  {
    type: 'section',
    label: 'REFERRAL & REWARDS',
    items: [
      { type: 'link', id: 'referral-settings', label: 'Referral Settings', icon: Gift },
    ],
  },

  {
    type: 'section',
    label: 'CUSTOMER MANAGEMENT',
    items: [
      { type: 'link', id: 'customers', label: 'Customers', icon: Users },
      { type: 'link', id: 'support-tickets', label: 'Support Tickets (User & Restaurant)', icon: MessageSquare },
    ],
  },

  {
    type: 'section',
    label: 'DELIVERYMAN MANAGEMENT',
    items: [
      { type: 'link', id: 'fee-settings', label: 'Delivery & Platform Fee', icon: DollarSign },
      { type: 'link', id: 'delivery-withdrawal', label: 'Delivery Withdrawal', icon: Wallet },
      { type: 'link', id: 'delivery-boy-wallet', label: 'Delivery boy Wallet', icon: PiggyBank },
      { type: 'link', id: 'delivery-emergency-help', label: 'Delivery Emergency Help', icon: Phone },
      { type: 'link', id: 'delivery-support-tickets', label: 'Delivery Support Tickets', icon: MessageSquare },
      { type: 'link', id: 'delivery-order-reassignment-requests', label: 'Order Reassignment Requests', icon: AlertTriangle },
      {
        type: 'expandable',
        label: 'Deliveryman',
        icon: Package,
        subItems: [
          { id: 'delivery-partners-join-request', label: 'New Join Request' },
          { id: 'delivery-partners', label: 'Deliveryman List' },
          { id: 'live-tracking', label: 'Live Tracking' },
          { id: 'delivery-partners-reviews', label: 'Deliveryman Reviews' },
          { id: 'delivery-partners-bonus', label: 'Bonus' },
          { id: 'delivery-partners-earning-addon', label: 'Earning Addon' },
          { id: 'delivery-partners-earning-addon-history', label: 'Earning Addon History' },
          { id: 'delivery-partners-earnings', label: 'Delivery Earning' },
        ],
      },
    ],
  },

  {
    type: 'section',
    label: 'HELP & SUPPORT',
    items: [
      { type: 'link', id: 'contact-messages', label: 'User Feedback', icon: Mail },
      { type: 'link', id: 'safety-emergency-reports', label: 'Safety Emergency Reports', icon: AlertTriangle },
    ],
  },

  {
    type: 'section',
    label: 'REPORT MANAGEMENT',
    items: [
      { type: 'link', id: 'transaction-report', label: 'Transaction Report', icon: FileText },
      { type: 'link', id: 'order-report', label: 'Order Report', icon: FileText },
      { type: 'link', id: 'tax-report', label: 'Tax Report', icon: Receipt },
      {
        type: 'expandable',
        label: 'Restaurant Report',
        icon: FileText,
        subItems: [
          { id: 'restaurant-report', label: 'Restaurant Report' },
        ],
      },
      {
        type: 'expandable',
        label: 'Customer Report',
        icon: FileText,
        subItems: [
          { id: 'customer-report', label: 'Feedback Experience' },
        ],
      },
    ],
  },

  {
    type: 'section',
    label: 'TRANSACTION MANAGEMENT',
    items: [
      { type: 'link', id: 'restaurant-withdraws', label: 'Restaurant Withdraws', icon: CreditCard },
    ],
  },

  {
    type: 'section',
    label: 'BANNER SETTINGS',
    items: [
      { type: 'link', id: 'hero-banner-management', label: 'Landing Page Management', icon: ImageIcon },
      { type: 'link', id: 'promotional-banner', label: 'Promotional Banners', icon: Megaphone },
    ],
  },

  {
    type: 'section',
    label: 'SYSTEM SETTINGS',
    items: [
      { type: 'link', id: 'broadcast-notification', label: 'Broadcast Notification', icon: Bell },
      { type: 'link', id: 'business-setup', label: 'Business Setup', icon: Settings },
    ],
  },

  {
    type: 'section',
    label: 'SUPER POWERS',
    items: [
      { type: 'link', id: 'feature-settings', label: 'Feature Settings', icon: Settings },
      { type: 'link', id: 'power-scanning', label: 'Power Scanning', icon: Zap },
    ],
  },

  {
    type: 'section',
    label: 'ADMIN ACCESS',
    items: [
      { type: 'link', id: 'employees', label: 'Sub Admin List', icon: UserCog },
      { type: 'link', id: 'employee-role', label: 'Employee Role', icon: UserCog },
    ],
  },

  {
    type: 'section',
    label: 'PAGES & SOCIAL MEDIA',
    items: [
      { type: 'link', id: 'pages-social-media', label: 'About Us', icon: Globe },
    ],
  },

  {
    type: 'section',
    label: 'MORE',
    items: [
      { type: 'link', id: 'notifications', label: 'Notifications', icon: Bell },
      { type: 'link', id: 'analytics', label: 'Analytics', icon: BarChart3 },
      { type: 'link', id: 'reports', label: 'Reports', icon: FileBarChart },
      { type: 'link', id: 'wallets-customers', label: 'Customer Wallets', icon: Wallet },
      { type: 'link', id: 'wallets-vendors', label: 'Vendor Wallets', icon: Wallet },
      { type: 'link', id: 'wallets-delivery', label: 'Delivery Wallets', icon: Wallet },
      { type: 'link', id: 'reviews', label: 'Reviews (legacy)', icon: Star },
      { type: 'link', id: 'refunds', label: 'Refunds (legacy)', icon: AlertCircle },
      { type: 'link', id: 'payouts', label: 'Payouts (legacy)', icon: Wallet },
      { type: 'link', id: 'push-campaigns', label: 'Push Campaigns (legacy)', icon: Bell },
      { type: 'link', id: 'settings', label: 'Settings', icon: Settings },
    ],
  },
]

// Search keyword map
const SEARCH_MAP: Record<string, View> = {
  order: 'orders-all', orders: 'orders-all',
  product: 'foods', food: 'foods', foods: 'foods',
  addon: 'addons',
  category: 'categories', categories: 'categories',
  store: 'restaurants', restaurant: 'restaurants', 'restaurants list': 'restaurants',
  customer: 'customers', vendor: 'restaurants', 'delivery': 'delivery-partners',
  wallet: 'wallets-customers',
  coupon: 'coupons', banner: 'hero-banner-management',
  notification: 'notifications', broadcast: 'broadcast-notification',
  report: 'reports', analytic: 'analytics', analytics: 'analytics',
  setting: 'settings', settings: 'settings',
  zone: 'zone-setup', 'point of sale': 'point-of-sale', pos: 'point-of-sale',
  approval: 'food-approval',
  referral: 'referral-settings', ticket: 'support-tickets', support: 'support-tickets',
  employee: 'employees', 'sub admin': 'employees', 'sub-admin': 'employees',
  'feature': 'feature-settings', 'power': 'power-scanning',
  'business': 'business-setup', 'tax': 'tax-report', 'transaction': 'transaction-report',
  'payout': 'payouts', 'refund': 'refunds',
  'live': 'live-tracking', 'tracking': 'live-tracking',
  'about': 'pages-social-media', 'terms': 'pages-social-media', 'privacy': 'pages-social-media',
}

function flattenLinks(): Array<{ id: View; label: string }> {
  const out: Array<{ id: View; label: string }> = []
  for (const item of NAV) {
    if (item.type === 'link') out.push({ id: item.id, label: item.label })
    else for (const child of item.items) {
      if (child.type === 'link' && child.id) out.push({ id: child.id, label: child.label })
      else if (child.subItems) for (const sub of child.subItems) out.push({ id: sub.id, label: sub.label })
    }
  }
  return out
}

const ALL_LINKS = flattenLinks()

export function AdminShell() {
  const { user, loading, signOut } = useAuth()
  const [authed, setAuthed] = useState(false)
  const [view, setView] = useState<View>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
    // Auto-expand sections containing the current view
    const out: Record<string, boolean> = {}
    for (const item of NAV) {
      if (item.type === 'section') {
        const key = item.label.toLowerCase().replace(/\s+/g, '')
        out[key] = false
      }
    }
    return out
  })
  const [search, setSearch] = useState('')

  const unreadCount = useAdminState((s) => s.notifications.filter((n) => !n.is_read).length)
  const recentNotifs = useAdminState((s) => s.notifications.slice(0, 4))

  useEffect(() => {
    if (!loading) setAuthed(!!user)
  }, [user, loading])

  const handleSignOut = async () => {
    try {
      await signOut()
      setAuthed(false)
      setProfileOpen(false)
    } catch (e) {
      console.error('sign out failed:', e)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  if (!authed) return <LoginScreen onLogin={() => setAuthed(true)} />

  const toggleSection = (label: string) => {
    const key = label.toLowerCase().replace(/\s+/g, '')
    setExpandedSections((s) => ({ ...s, [key]: !s[key] }))
  }

  const navigate = (v: string) => {
    setView(v as View)
    setSidebarOpen(false)
    // Auto-expand section containing this view
    for (const item of NAV) {
      if (item.type !== 'section') continue
      const contains = item.items.some((c) => {
        if (c.type === 'link') return c.id === v
        return c.subItems?.some((s) => s.id === v)
      })
      if (contains) {
        const key = item.label.toLowerCase().replace(/\s+/g, '')
        setExpandedSections((s) => ({ ...s, [key]: true }))
      }
    }
  }

  const handleSearch = (v: string) => {
    setSearch(v)
    if (v.trim()) {
      const q = v.toLowerCase().trim()
      // Auto-expand any section whose labels include the query
      setExpandedSections((s) => {
        const next = { ...s }
        for (const item of NAV) {
          if (item.type !== 'section') continue
          const key = item.label.toLowerCase().replace(/\s+/g, '')
          const sectionMatches =
            item.label.toLowerCase().includes(q) ||
            item.items.some((c) => {
              if (c.label.toLowerCase().includes(q)) return true
              return c.subItems?.some((sub) => sub.label.toLowerCase().includes(q))
            })
          if (sectionMatches) next[key] = true
        }
        return next
      })
    }
  }

  const submitSearch = () => {
    const q = search.toLowerCase().trim()
    if (!q) return
    for (const [key, val] of Object.entries(SEARCH_MAP)) {
      if (q.includes(key)) {
        navigate(val)
        return
      }
    }
    // Try direct label match
    const match = ALL_LINKS.find((l) => l.label.toLowerCase().includes(q))
    if (match) navigate(match.id)
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:sticky top-0 left-0 z-40 h-screen w-64 bg-sidebar border-r border-sidebar-border flex-shrink-0 transition-transform duration-300',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-5 border-b border-sidebar-border flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <img src="/food-munch-logo.jpg" alt="Food Munch" className="h-9 w-9 rounded-xl object-cover" />
              <div>
                <p className="text-sm font-bold text-foreground">Food Munch</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Admin Console</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto py-4 px-3">
            {NAV.map((item) => {
              if (item.type === 'link') {
                const active = view === item.id
                const isNotif = item.id === 'notifications'
                const Icon = item.icon
                return (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.id)}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-0.5',
                      active
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span className="flex-1 text-left">{item.label}</span>
                    {isNotif && unreadCount > 0 ? (
                      <span className={cn(
                        'inline-flex items-center justify-center h-5 min-w-5 px-1.5 text-[10px] font-semibold rounded-full',
                        active ? 'bg-primary-foreground text-primary' : 'bg-primary text-primary-foreground'
                      )}>
                        {unreadCount}
                      </span>
                    ) : null}
                  </button>
                )
              }
              // Section
              const key = item.label.toLowerCase().replace(/\s+/g, '')
              const expanded = expandedSections[key] || false
              return (
                <div key={item.label} className="mb-3">
                  <button
                    onClick={() => toggleSection(item.label)}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground"
                  >
                    <span>{item.label}</span>
                    <ChevronRight className={cn('h-3 w-3 transition-transform', expanded && 'rotate-90')} />
                  </button>
                  {expanded && (
                    <div className="space-y-0.5 mt-1">
                      {item.items.map((child) => {
                        if (child.type === 'link' && child.id) {
                          const active = view === child.id
                          const isNotif = child.id === 'notifications'
                          const Icon = child.icon
                          return (
                            <button
                              key={child.id}
                              onClick={() => navigate(child.id!)}
                              className={cn(
                                'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                                active
                                  ? 'bg-primary text-primary-foreground shadow-sm'
                                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                              )}
                            >
                              {Icon ? <Icon className="h-4 w-4 flex-shrink-0" /> : <Circle className="h-3 w-3 flex-shrink-0 opacity-40" />}
                              <span className="flex-1 text-left">{child.label}</span>
                              {isNotif && unreadCount > 0 ? (
                                <span className={cn(
                                  'inline-flex items-center justify-center h-5 min-w-5 px-1.5 text-[10px] font-semibold rounded-full',
                                  active ? 'bg-primary-foreground text-primary' : 'bg-primary text-primary-foreground'
                                )}>
                                  {unreadCount}
                                </span>
                              ) : null}
                            </button>
                          )
                        }
                        // Expandable
                        const subExpanded = expandedSections[(child.label || '').toLowerCase().replace(/\s+/g, '')] || false
                        const subActive = child.subItems?.some((s) => s.id === view)
                        const Icon = child.icon
                        const subKey = (child.label || '').toLowerCase().replace(/\s+/g, '')
                        return (
                          <div key={child.label}>
                            <button
                              onClick={() => {
                                if (subActive) {
                                  // navigate to first subitem
                                  const first = child.subItems?.[0]
                                  if (first) navigate(first.id)
                                } else {
                                  toggleSection(child.label || '')
                                }
                              }}
                              className={cn(
                                'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                                subActive
                                  ? 'bg-primary/10 text-primary'
                                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                              )}
                            >
                              {Icon ? <Icon className="h-4 w-4 flex-shrink-0" /> : <Circle className="h-3 w-3 flex-shrink-0 opacity-40" />}
                              <span className="flex-1 text-left">{child.label}</span>
                              {child.subItems && child.subItems.length > 0 && (
                                <ChevronRight className={cn('h-3 w-3 transition-transform', subExpanded && 'rotate-90')} />
                              )}
                            </button>
                            {subExpanded && child.subItems && child.subItems.length > 0 && (
                              <div className="ml-5 mt-0.5 space-y-0.5 border-l border-sidebar-border/60 pl-2">
                                {child.subItems.map((sub) => {
                                  const active = view === sub.id
                                  return (
                                    <button
                                      key={sub.id}
                                      onClick={() => navigate(sub.id)}
                                      className={cn(
                                        'w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors',
                                        active
                                          ? 'bg-primary text-primary-foreground shadow-sm'
                                          : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                                      )}
                                    >
                                      <span className={cn(
                                        'h-1.5 w-1.5 rounded-full flex-shrink-0',
                                        active ? 'bg-primary-foreground' : 'bg-muted-foreground/40'
                                      )} />
                                      <span className="flex-1 text-left truncate">{sub.label}</span>
                                    </button>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </nav>

          {/* Status footer */}
          <div className="p-3 border-t border-sidebar-border">
            <div className="bg-sidebar-accent/50 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Supabase</span>
                {isSupabaseConfigured ? (
                  <span className="flex items-center gap-1 text-emerald-600 font-medium">
                    <CheckCircle2 className="h-3 w-3" /> Connected
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-amber-600 font-medium">
                    <AlertCircle className="h-3 w-3" /> Mock
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Firebase</span>
                {isFirebaseConfigured ? (
                  <span className="flex items-center gap-1 text-emerald-600 font-medium">
                    <CheckCircle2 className="h-3 w-3" /> Connected
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-amber-600 font-medium">
                    <AlertCircle className="h-3 w-3" /> Mock
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Sidebar overlay (mobile) */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
        />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 border-b border-border bg-background/95 backdrop-blur sticky top-0 z-20 flex items-center px-4 lg:px-6 gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-muted-foreground hover:text-foreground"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Search */}
          <div className="hidden md:flex relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search the admin console..."
              className="w-full pl-10 pr-3 py-2 text-sm bg-muted/50 border border-transparent rounded-lg focus:outline-none focus:bg-background focus:border-border focus:ring-2 focus:ring-ring/20 transition-all"
              onKeyDown={(e) => { if (e.key === 'Enter') submitSearch() }}
            />
          </div>

          <div className="flex-1 md:hidden" />

          {/* Quick actions */}
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false) }}
                className="relative h-9 w-9 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 h-4 min-w-4 px-1 inline-flex items-center justify-center text-[10px] font-bold rounded-full bg-rose-500 text-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setNotifOpen(false)} />
                  <div className="absolute right-0 mt-2 w-80 bg-background border border-border rounded-xl shadow-xl z-40 overflow-hidden">
                    <div className="p-3 border-b border-border flex items-center justify-between">
                      <p className="text-sm font-semibold">Notifications</p>
                      <button
                        onClick={() => { setNotifOpen(false); navigate('notifications') }}
                        className="text-xs text-primary hover:underline"
                      >
                        View all
                      </button>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {recentNotifs.length === 0 && (
                        <p className="p-4 text-sm text-muted-foreground text-center">No notifications</p>
                      )}
                      {recentNotifs.map((n) => (
                        <div
                          key={n.id}
                          className={cn(
                            'p-3 border-b border-border/50 hover:bg-muted/50 cursor-pointer',
                            !n.is_read && 'bg-primary/5'
                          )}
                          onClick={() => { notificationActions.markRead(n.id); setNotifOpen(false); navigate('notifications') }}
                        >
                          <p className="text-sm font-medium text-foreground">{n.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Profile */}
            <div className="relative">
              <button
                onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false) }}
                className="flex items-center gap-2 h-9 pl-1 pr-2 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-semibold">
                  {(user?.email || 'AD').split('@')[0].slice(0, 2).toUpperCase()}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-medium text-foreground">
                    {user?.email?.split('@')[0] || 'Admin'}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{user?.email || 'admin@foodmunch.com'}</p>
                </div>
                <ChevronDown className="h-3 w-3 text-muted-foreground hidden sm:block" />
              </button>

              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setProfileOpen(false)} />
                  <div className="absolute right-0 mt-2 w-56 bg-background border border-border rounded-xl shadow-xl z-40 overflow-hidden">
                    <div className="p-3 border-b border-border">
                      <p className="text-sm font-semibold">Admin User</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                    <div className="p-1.5">
                      <button
                        onClick={() => { setProfileOpen(false); navigate('settings') }}
                        className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-muted text-left"
                      >
                        <Settings className="h-4 w-4 text-muted-foreground" />
                        Settings
                      </button>
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-rose-50 text-rose-600 text-left"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-x-hidden">
          {/* Top-level */}
          {view === 'dashboard' && <DashboardView onNavigate={navigate} />}
          {view === 'point-of-sale' && <PointOfSaleView />}

          {/* Food management */}
          {view === 'food-approval' && <FoodApprovalView />}
          {view === 'foods' && <ProductsView />}
          {view === 'addons' && <AddonsView />}
          {view === 'categories' && <CategoriesView />}

          {/* Restaurant management */}
          {view === 'zone-setup' && <ZoneSetupView />}
          {view === 'restaurants' && <StoresView />}
          {view === 'restaurants-joining-request' && <RestaurantsJoiningRequestView />}
          {view === 'restaurants-unregistered' && <RestaurantsUnregisteredView />}
          {view === 'restaurants-reviews' && <RestaurantsReviewsView />}
          {view === 'restaurants-complaints' && <RestaurantsComplaintsView />}
          {view === 'restaurants-settings' && <RestaurantsSettingsView />}
          {view === 'subscription-settings' && <SubscriptionSettingsView />}
          {view === 'subscription-billing' && <SubscriptionBillingView />}

          {/* Order management */}
          {view === 'orders-all' && <OrdersByStatusView status="all" />}
          {view === 'orders-pending' && <OrdersByStatusView status="pending" />}
          {view === 'orders-processing' && <OrdersByStatusView status="processing" />}
          {view === 'orders-food-on-the-way' && <OrdersByStatusView status="food-on-the-way" />}
          {view === 'orders-delivered' && <OrdersByStatusView status="delivered" />}
          {view === 'orders-canceled' && <OrdersByStatusView status="canceled" />}
          {view === 'orders-restaurant-cancelled' && <OrdersByStatusView status="restaurant-cancelled" />}
          {view === 'orders-payment-failed' && <OrdersByStatusView status="payment-failed" />}
          {view === 'orders-refunded' && <OrdersByStatusView status="refunded" />}
          {view === 'orders-offline-payments' && <OrdersByStatusView status="offline-payments" />}
          {view === 'orders-user-carts' && <OrdersByStatusView status="user-carts" />}
          {view === 'order-detect-delivery' && <OrderDetectDeliveryView />}

          {/* Promotions & rewards */}
          {view === 'coupons' && <CouponsView />}
          {view === 'referral-settings' && <ReferralSettingsView />}

          {/* Customer management */}
          {view === 'customers' && <CustomersView />}
          {view === 'support-tickets' && <SupportTicketsView />}

          {/* Deliveryman management */}
          {view === 'fee-settings' && <FeeSettingsView />}
          {view === 'delivery-withdrawal' && <DeliveryWithdrawalView />}
          {view === 'delivery-boy-wallet' && <DeliveryBoyWalletView />}
          {view === 'delivery-emergency-help' && <DeliveryEmergencyHelpView />}
          {view === 'delivery-support-tickets' && <DeliverySupportTicketsView />}
          {view === 'delivery-order-reassignment-requests' && <DeliveryOrderReassignmentRequestsView />}
          {view === 'delivery-partners-join-request' && <DeliveryPartnersJoinRequestView />}
          {view === 'delivery-partners' && <DeliveryMenView />}
          {view === 'live-tracking' && <LiveTrackingView />}
          {view === 'delivery-partners-reviews' && <DeliveryPartnersReviewsView />}
          {view === 'delivery-partners-bonus' && <DeliveryPartnersBonusView />}
          {view === 'delivery-partners-earning-addon' && <DeliveryPartnersEarningAddonView />}
          {view === 'delivery-partners-earning-addon-history' && <DeliveryPartnersEarningAddonHistoryView />}
          {view === 'delivery-partners-earnings' && <DeliveryPartnersEarningsView />}

          {/* Help & support */}
          {view === 'contact-messages' && <ContactMessagesView />}
          {view === 'safety-emergency-reports' && <SafetyEmergencyReportsView />}

          {/* Report management */}
          {view === 'transaction-report' && <TransactionReportView />}
          {view === 'order-report' && <OrderReportView />}
          {view === 'tax-report' && <TaxReportView />}
          {view === 'restaurant-report' && <RestaurantReportView />}
          {view === 'customer-report' && <CustomerReportView />}

          {/* Transaction management */}
          {view === 'restaurant-withdraws' && <RestaurantWithdrawsView />}

          {/* Banner management */}
          {view === 'hero-banner-management' && <HeroBannerManagementView />}
          {view === 'promotional-banner' && <PromotionalBannerView />}
          {view === 'banners' && <BannersView />}

          {/* System settings */}
          {view === 'broadcast-notification' && <BroadcastNotificationView />}
          {view === 'business-setup' && <BusinessSetupView />}

          {/* Super powers */}
          {view === 'feature-settings' && <FeatureSettingsView />}
          {view === 'power-scanning' && <PowerScanningView />}

          {/* Admin access */}
          {view === 'employees' && <EmployeesView />}
          {view === 'employee-role' && <EmployeeRoleView />}

          {/* Pages & social media */}
          {view === 'pages-social-media' && <PagesSocialMediaView />}

          {/* More / legacy */}
          {view === 'notifications' && <NotificationsView />}
          {view === 'analytics' && <AnalyticsView />}
          {view === 'reports' && <ReportsView />}
          {view === 'settings' && <SettingsView />}
          {view === 'wallets-customers' && <WalletsCustomersView />}
          {view === 'wallets-vendors' && <WalletsVendorsView />}
          {view === 'wallets-delivery' && <WalletsDeliveryView />}
          {view === 'reviews' && <ReviewsView />}
          {view === 'refunds' && <RefundsView />}
          {view === 'payouts' && <PayoutsView />}
          {view === 'push-campaigns' && <PushCampaignsView />}
        </main>
      </div>
    </div>
  )
}
