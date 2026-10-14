'use client'

import { useState, useEffect } from 'react'
import {
  LayoutDashboard, ShoppingBag, Package, Store, Tag, Users,
  Truck, Ticket, Image as ImageIcon, Bell, BarChart3, Settings,
  ShoppingBag as Logo, Search, ChevronDown, LogOut, Menu, X,
  CheckCircle2, Circle, AlertCircle, Wallet, FileBarChart, Star,
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
import { useAdminState, notificationActions } from '@/lib/admin-data'

type View =
  | 'dashboard' | 'orders' | 'products' | 'stores' | 'categories'
  | 'customers' | 'vendors' | 'delivery-men' | 'coupons' | 'banners'
  | 'notifications' | 'analytics' | 'settings' | 'reports'
  | 'wallets-customers' | 'wallets-vendors' | 'wallets-delivery'
  | 'live-tracking' | 'reviews' | 'refunds' | 'payouts' | 'push-campaigns'

const NAV: Array<{ id: View; label: string; icon: typeof LayoutDashboard; group: string }> = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, group: 'Overview' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, group: 'Overview' },
  { id: 'reports', label: 'Reports', icon: FileBarChart, group: 'Overview' },
  { id: 'orders', label: 'Orders', icon: ShoppingBag, group: 'Catalog & Orders' },
  { id: 'products', label: 'Products', icon: Package, group: 'Catalog & Orders' },
  { id: 'categories', label: 'Categories', icon: Tag, group: 'Catalog & Orders' },
  { id: 'stores', label: 'Stores', icon: Store, group: 'Catalog & Orders' },
  { id: 'coupons', label: 'Coupons', icon: Ticket, group: 'Catalog & Orders' },
  { id: 'banners', label: 'Banners', icon: ImageIcon, group: 'Catalog & Orders' },
  { id: 'customers', label: 'Customers', icon: Users, group: 'People' },
  { id: 'vendors', label: 'Vendors', icon: Store, group: 'People' },
  { id: 'delivery-men', label: 'Delivery Men', icon: Truck, group: 'People' },
  { id: 'wallets-customers', label: 'Customer Wallets', icon: Wallet, group: 'Wallets' },
  { id: 'wallets-vendors', label: 'Vendor Wallets', icon: Wallet, group: 'Wallets' },
  { id: 'wallets-delivery', label: 'Delivery Wallets', icon: Wallet, group: 'Wallets' },
  { id: 'live-tracking', label: 'Live Tracking', icon: Truck, group: 'Operations' },
  { id: 'reviews', label: 'Reviews', icon: Star, group: 'Operations' },
  { id: 'refunds', label: 'Refunds', icon: AlertCircle, group: 'Operations' },
  { id: 'payouts', label: 'Payouts', icon: Wallet, group: 'Operations' },
  { id: 'push-campaigns', label: 'Push Campaigns', icon: Bell, group: 'Marketing' },
  { id: 'notifications', label: 'Notifications', icon: Bell, group: 'System' },
  { id: 'settings', label: 'Settings', icon: Settings, group: 'System' },
]

export function AdminShell() {
  const { user, loading, signOut } = useAuth()
  const [authed, setAuthed] = useState(false)
  const [view, setView] = useState<View>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)

  const unreadCount = useAdminState((s) => s.notifications.filter((n) => !n.is_read).length)
  const recentNotifs = useAdminState((s) => s.notifications.slice(0, 4))

  // Sync local authed state with auth state
  useEffect(() => {
    if (!loading) {
      setAuthed(!!user)
    }
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

  const grouped = NAV.reduce((acc, item) => {
    if (!acc[item.group]) acc[item.group] = []
    acc[item.group].push(item)
    return acc
  }, {} as Record<string, typeof NAV>)

  const navigate = (v: string) => {
    setView(v as View)
    setSidebarOpen(false)
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
            {Object.entries(grouped).map(([group, items]) => (
              <div key={group} className="mb-5">
                <p className="px-3 mb-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {group}
                </p>
                <div className="space-y-0.5">
                  {items.map((item) => {
                    const active = view === item.id
                    const isNotif = item.id === 'notifications'
                    return (
                      <button
                        key={item.id}
                        onClick={() => navigate(item.id)}
                        className={cn(
                          'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                          active
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                        )}
                      >
                        <item.icon className="h-4 w-4 flex-shrink-0" />
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
                  })}
                </div>
              </div>
            ))}
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
              placeholder="Search the admin console..."
              className="w-full pl-10 pr-3 py-2 text-sm bg-muted/50 border border-transparent rounded-lg focus:outline-none focus:bg-background focus:border-border focus:ring-2 focus:ring-ring/20 transition-all"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const v = (e.target as HTMLInputElement).value.toLowerCase()
                  if (v.includes('order')) navigate('orders')
                  else if (v.includes('product')) navigate('products')
                  else if (v.includes('customer')) navigate('customers')
                  else if (v.includes('vendor')) navigate('vendors')
                  else if (v.includes('deliver')) navigate('delivery-men')
                  else if (v.includes('store')) navigate('stores')
                  else if (v.includes('wallet')) navigate('wallets-customers')
                  else if (v.includes('report')) navigate('reports')
                  else if (v.includes('analytic')) navigate('analytics')
                  else if (v.includes('setting')) navigate('settings')
                }
              }}
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
          {view === 'dashboard' && <DashboardView onNavigate={navigate} />}
          {view === 'orders' && <OrdersView />}
          {view === 'products' && <ProductsView />}
          {view === 'stores' && <StoresView />}
          {view === 'categories' && <CategoriesView />}
          {view === 'customers' && <CustomersView />}
          {view === 'vendors' && <VendorsView />}
          {view === 'delivery-men' && <DeliveryMenView />}
          {view === 'coupons' && <CouponsView />}
          {view === 'banners' && <BannersView />}
          {view === 'notifications' && <NotificationsView />}
          {view === 'analytics' && <AnalyticsView />}
          {view === 'reports' && <ReportsView />}
          {view === 'settings' && <SettingsView />}
          {view === 'wallets-customers' && <WalletsCustomersView />}
          {view === 'wallets-vendors' && <WalletsVendorsView />}
          {view === 'wallets-delivery' && <WalletsDeliveryView />}
          {view === 'live-tracking' && <LiveTrackingView />}
          {view === 'reviews' && <ReviewsView />}
          {view === 'refunds' && <RefundsView />}
          {view === 'payouts' && <PayoutsView />}
          {view === 'push-campaigns' && <PushCampaignsView />}
        </main>
      </div>
    </div>
  )
}
