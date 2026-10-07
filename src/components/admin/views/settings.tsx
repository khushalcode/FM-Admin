'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import {
  PageHeader, StatusBadge, Field, SelectField, Toggle,
  PrimaryButton,
} from '../shared'
import {
  Database, Flame as FirebaseIcon, Save, Check, AlertCircle,
  Settings as SettingsIcon, Bell, Shield, CreditCard,
} from 'lucide-react'
import { isSupabaseConfigured } from '@/lib/supabase'
import { isFirebaseConfigured } from '@/lib/firebase'
import { useAdminState, settingsActions } from '@/lib/admin-data'
import { toast } from 'sonner'

export function SettingsView() {
  const [tab, setTab] = useState<'general' | 'integrations' | 'notifications' | 'security' | 'commission'>('general')
  const settings = useAdminState((s) => s.settings)

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Manage your platform configuration"
      />

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-border overflow-x-auto">
        {([
          { id: 'general', label: 'General', icon: SettingsIcon },
          { id: 'integrations', label: 'Integrations', icon: Database },
          { id: 'notifications', label: 'Notifications', icon: Bell },
          { id: 'security', label: 'Security', icon: Shield },
          { id: 'commission', label: 'Commission', icon: CreditCard },
        ] as const).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
              tab === t.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'general' && <GeneralTab settings={settings} />}
      {tab === 'integrations' && <IntegrationsTab />}
      {tab === 'notifications' && <NotificationsTab settings={settings} />}
      {tab === 'security' && <SecurityTab settings={settings} />}
      {tab === 'commission' && <CommissionTab settings={settings} />}
    </div>
  )
}

function GeneralTab({ settings }: { settings: ReturnType<typeof settingsActions.get> }) {
  const [form, setForm] = useState(settings)

  useEffect(() => { setForm(settings) }, [settings])

  const update = (k: string, v: string) => setForm({ ...form, [k]: v })

  const save = () => {
    settingsActions.update(form)
    toast.success('Settings saved', { description: 'General configuration updated' })
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <Card className="p-6 premium-shadow border-border/50">
        <h3 className="text-base font-semibold text-foreground mb-4">Platform Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="App Name" value={form.appName} onChange={(v) => update('appName', v)} />
          <Field label="Support Email" value={form.supportEmail} onChange={(v) => update('supportEmail', v)} />
          <Field label="Support Phone" value={form.supportPhone} onChange={(v) => update('supportPhone', v)} />
          <Field label="Default City" value={form.defaultCity} onChange={(v) => update('defaultCity', v)} />
        </div>
      </Card>

      <Card className="p-6 premium-shadow border-border/50">
        <h3 className="text-base font-semibold text-foreground mb-4">Localization</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SelectField
            label="Currency"
            value={form.currency}
            onChange={(v) => update('currency', v)}
            options={[
              { value: 'INR', label: 'INR (₹)' },
              { value: 'USD', label: 'USD ($)' },
              { value: 'EUR', label: 'EUR (€)' },
              { value: 'AED', label: 'AED (د.إ)' },
            ]}
          />
          <SelectField
            label="Timezone"
            value={form.timezone}
            onChange={(v) => update('timezone', v)}
            options={[
              { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST)' },
              { value: 'Asia/Dubai', label: 'Asia/Dubai (GST)' },
              { value: 'UTC', label: 'UTC' },
            ]}
          />
          <SelectField
            label="Default Language"
            value={form.language}
            onChange={(v) => update('language', v)}
            options={[
              { value: 'en', label: 'English' },
              { value: 'hi', label: 'हिन्दी (Hindi)' },
              { value: 'kn', label: 'ಕನ್ನಡ (Kannada)' },
              { value: 'ta', label: 'தமிழ் (Tamil)' },
              { value: 'te', label: 'తెలుగు (Telugu)' },
            ]}
          />
        </div>
      </Card>

      <Card className="p-6 premium-shadow border-border/50">
        <h3 className="text-base font-semibold text-foreground mb-4">Order & Delivery Settings</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Minimum Order Value (₹)" value={form.minOrderValue} onChange={(v) => update('minOrderValue', v)} type="number" />
          <Field label="Max Delivery Radius (km)" value={form.maxDeliveryRadius} onChange={(v) => update('maxDeliveryRadius', v)} type="number" />
          <Field label="Default Delivery Fee (₹)" value={form.deliveryFee} onChange={(v) => update('deliveryFee', v)} type="number" />
          <Field label="Tax Rate (%)" value={form.taxRate} onChange={(v) => update('taxRate', v)} type="number" />
        </div>
      </Card>

      <div className="flex justify-end gap-2">
        <button
          onClick={() => { settingsActions.reset(); toast.info('Settings reset to defaults') }}
          className="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted"
        >
          Reset to defaults
        </button>
        <PrimaryButton onClick={save}>
          <Save className="h-4 w-4" /> Save Changes
        </PrimaryButton>
      </div>
    </div>
  )
}

function IntegrationsTab() {
  const env = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  return (
    <div className="space-y-6 max-w-3xl">
      {/* Supabase */}
      <Card className="p-6 premium-shadow border-border/50">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Database className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">Supabase</h3>
              <p className="text-sm text-muted-foreground">Postgres database + storage + realtime</p>
            </div>
          </div>
          <StatusBadge status={isSupabaseConfigured ? 'active' : 'inactive'} label={isSupabaseConfigured ? 'Connected' : 'Not Connected'} />
        </div>
        <Field label="Supabase URL" value={env || 'https://dhmeyycjosacuwgtdhfo.supabase.co'} onChange={() => {}} readOnly />
        <div className="mt-3">
          <Field label="Supabase Anon Key" value={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '(set in .env.local)'} onChange={() => {}} readOnly />
        </div>
      </Card>

      {/* Firebase */}
      <Card className="p-6 premium-shadow border-border/50">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center">
              <FirebaseIcon className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">Firebase</h3>
              <p className="text-sm text-muted-foreground">Cloud Messaging (push notifications)</p>
            </div>
          </div>
          <StatusBadge status={isFirebaseConfigured ? 'active' : 'inactive'} label={isFirebaseConfigured ? 'Connected' : 'Not Connected'} />
        </div>
        <div className="space-y-3">
          <Field label="Project ID" value="food-munch-2bcfb" onChange={() => {}} readOnly />
          <Field label="App ID" value="1:229260810980:web:a3dfcfe1ae6e76f71daaf1" onChange={() => {}} readOnly />
        </div>
      </Card>

      {/* Razorpay */}
      <Card className="p-6 premium-shadow border-border/50">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-violet-50 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">Razorpay</h3>
              <p className="text-sm text-muted-foreground">Payment gateway (cards, UPI, wallets)</p>
            </div>
          </div>
          <StatusBadge status="active" label="Connected" />
        </div>
        <Field label="Key ID" value="rzp_test_1DP5mmOlF5G5ag" onChange={() => {}} readOnly />
      </Card>

      {/* Twilio / MSG91 */}
      <Card className="p-6 premium-shadow border-border/50">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Bell className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">SMS (MSG91 / Twilio)</h3>
              <p className="text-sm text-muted-foreground">OTP & transactional SMS</p>
            </div>
          </div>
          <StatusBadge status="active" label="Configured" />
        </div>
        <Field label="Provider" value="MSG91" onChange={() => {}} readOnly />
      </Card>
    </div>
  )
}

function NotificationsTab({ settings }: { settings: ReturnType<typeof settingsActions.get> }) {
  const [form, setForm] = useState(settings)
  useEffect(() => { setForm(settings) }, [settings])
  const update = (k: string, v: boolean) => setForm({ ...form, [k]: v })
  const save = () => {
    settingsActions.update(form)
    toast.success('Notification preferences saved')
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <Card className="p-6 premium-shadow border-border/50">
        <h3 className="text-base font-semibold text-foreground mb-4">Notification Events</h3>
        <div className="space-y-3">
          <Toggle label="New Order Received" desc="When a customer places a new order" checked={form.newOrder} onChange={(v) => update('newOrder', v)} />
          <Toggle label="Order Status Updates" desc="When order status changes (accept, prepare, deliver)" checked={form.orderStatusUpdate} onChange={(v) => update('orderStatusUpdate', v)} />
          <Toggle label="Low Stock Alert" desc="When a product stock goes below threshold" checked={form.lowStock} onChange={(v) => update('lowStock', v)} />
          <Toggle label="Vendor Registration" desc="When a new vendor signs up" checked={form.vendorRegistration} onChange={(v) => update('vendorRegistration', v)} />
          <Toggle label="Payout Request" desc="When a vendor/delivery man requests a payout" checked={form.payoutRequest} onChange={(v) => update('payoutRequest', v)} />
          <Toggle label="Payment Failure" desc="When an online payment fails" checked={form.paymentFailure} onChange={(v) => update('paymentFailure', v)} />
        </div>
      </Card>

      <Card className="p-6 premium-shadow border-border/50">
        <h3 className="text-base font-semibold text-foreground mb-4">Reports</h3>
        <div className="space-y-3">
          <Toggle label="Daily Summary" desc="Daily summary at 9 AM" checked={form.dailySummary} onChange={(v) => update('dailySummary', v)} />
          <Toggle label="Weekly Report" desc="Comprehensive weekly report every Monday" checked={form.weeklyReport} onChange={(v) => update('weeklyReport', v)} />
        </div>
      </Card>

      <Card className="p-6 premium-shadow border-border/50">
        <h3 className="text-base font-semibold text-foreground mb-4">Delivery Channels</h3>
        <div className="space-y-3">
          <Toggle label="Push Notifications" desc="Via Firebase Cloud Messaging (FCM)" checked={form.pushChannel} onChange={(v) => update('pushChannel', v)} />
          <Toggle label="Email" desc="Via SMTP / SendGrid / Postmark" checked={form.emailChannel} onChange={(v) => update('emailChannel', v)} />
          <Toggle label="SMS" desc="Via Twilio / MSG91" checked={form.smsChannel} onChange={(v) => update('smsChannel', v)} />
        </div>
      </Card>

      <div className="flex justify-end">
        <PrimaryButton onClick={save}>
          <Save className="h-4 w-4" /> Save Preferences
        </PrimaryButton>
      </div>
    </div>
  )
}

function SecurityTab({ settings }: { settings: ReturnType<typeof settingsActions.get> }) {
  const [form, setForm] = useState(settings)
  useEffect(() => { setForm(settings) }, [settings])
  const update = (k: string, v: boolean) => setForm({ ...form, [k]: v })
  const save = () => {
    settingsActions.update(form)
    toast.success('Security settings saved')
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <Card className="p-6 premium-shadow border-border/50">
        <h3 className="text-base font-semibold text-foreground mb-4">Authentication</h3>
        <div className="space-y-3">
          <Toggle label="Require Email Verification" desc="New users must verify email before first login" checked={form.emailVerification} onChange={(v) => update('emailVerification', v)} />
          <Toggle label="Require Phone Verification (OTP)" desc="Send OTP to phone on registration" checked={form.phoneVerification} onChange={(v) => update('phoneVerification', v)} />
          <Toggle label="Two-Factor Authentication" desc="Require 2FA for admin accounts" checked={form.twoFactor} onChange={(v) => update('twoFactor', v)} />
          <Toggle label="Google Sign-In" desc="Allow customers to sign in with Google" checked={form.googleSignIn} onChange={(v) => update('googleSignIn', v)} />
        </div>
      </Card>

      <Card className="p-6 premium-shadow border-border/50">
        <h3 className="text-base font-semibold text-foreground mb-4">Access Control</h3>
        <div className="space-y-3">
          <Toggle label="Auto-approve Vendors" desc="Skip manual vendor approval" checked={form.autoApproveVendors} onChange={(v) => update('autoApproveVendors', v)} />
          <Toggle label="Auto-approve Delivery Men" desc="Skip manual delivery man approval" checked={form.autoApproveDelivery} onChange={(v) => update('autoApproveDelivery', v)} />
          <Toggle label="Auto-approve Products" desc="Skip manual product approval" checked={form.autoApproveProducts} onChange={(v) => update('autoApproveProducts', v)} />
        </div>
      </Card>

      <div className="flex justify-end">
        <PrimaryButton onClick={save}>
          <Save className="h-4 w-4" /> Save Security Settings
        </PrimaryButton>
      </div>
    </div>
  )
}

function CommissionTab({ settings }: { settings: ReturnType<typeof settingsActions.get> }) {
  const [form, setForm] = useState(settings)
  useEffect(() => { setForm(settings) }, [settings])
  const update = (k: string, v: string) => setForm({ ...form, [k]: v })
  const save = () => {
    settingsActions.update(form)
    toast.success('Commission settings saved')
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <Card className="p-6 premium-shadow border-border/50">
        <h3 className="text-base font-semibold text-foreground mb-4">Commission Structure</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Default Commission %" value={form.defaultCommission} onChange={(v) => update('defaultCommission', v)} type="number" />
          <SelectField
            label="Vendor Subscription Plan"
            value={form.vendorSubscriptionPlan}
            onChange={(v) => update('vendorSubscriptionPlan', v)}
            options={[
              { value: 'free', label: 'Free (0₹/mo)' },
              { value: 'standard', label: 'Standard (₹999/mo)' },
              { value: 'pro', label: 'Pro (₹2999/mo)' },
              { value: 'enterprise', label: 'Enterprise (Custom)' },
            ]}
          />
        </div>
      </Card>

      <Card className="p-6 premium-shadow border-border/50">
        <h3 className="text-base font-semibold text-foreground mb-4">Plan Details</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-border">
            <span className="text-muted-foreground">Free</span>
            <span className="font-medium">5% commission · 1 store · 50 products</span>
          </div>
          <div className="flex justify-between py-2 border-b border-border">
            <span className="text-muted-foreground">Standard</span>
            <span className="font-medium">10% commission · 3 stores · 500 products</span>
          </div>
          <div className="flex justify-between py-2 border-b border-border">
            <span className="text-muted-foreground">Pro</span>
            <span className="font-medium">8% commission · Unlimited stores · Priority support</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-muted-foreground">Enterprise</span>
            <span className="font-medium">Custom · SLA · Dedicated manager</span>
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <PrimaryButton onClick={save}>
          <Save className="h-4 w-4" /> Save Commission Settings
        </PrimaryButton>
      </div>
    </div>
  )
}
