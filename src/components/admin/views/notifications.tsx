'use client'

import { useState, useMemo } from 'react'
import { Bell, BellOff, CheckCheck, Trash2, Send, Plus } from 'lucide-react'
import { Card } from '@/components/ui/card'
import {
  PageHeader, SearchInput, EmptyState, FilterChips,
  timeAgo,
} from '../shared'
import { useAdminState, notificationActions, sendCustomerNotification } from '@/lib/admin-data'
import { Notification } from '@/lib/types'

const TYPE_COLORS: Record<string, string> = {
  order: 'bg-amber-50 text-amber-600',
  offer: 'bg-violet-50 text-violet-600',
  promo: 'bg-violet-50 text-violet-600',
  wallet: 'bg-emerald-50 text-emerald-600',
  system: 'bg-blue-50 text-blue-600',
  chat: 'bg-emerald-50 text-emerald-600',
}

const TYPE_ICONS: Record<string, string> = {
  order: '🛍️',
  offer: '🎁',
  promo: '🎁',
  wallet: '💰',
  system: '⚙️',
  chat: '💬',
}

export function NotificationsView() {
  const items = useAdminState((s) => s.notifications)
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all')
  const [search, setSearch] = useState('')
  const [showSend, setShowSend] = useState(false)
  const [notifTitle, setNotifTitle] = useState('')
  const [notifBody, setNotifBody] = useState('')
  const [notifType, setNotifType] = useState<'order' | 'offer' | 'wallet' | 'system'>('offer')

  const filtered = useMemo(() => {
    return items.filter((n) => {
      if (filter === 'unread' && n.is_read) return false
      if (filter === 'read' && !n.is_read) return false
      if (search) {
        const q = search.toLowerCase()
        return n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q)
      }
      return true
    })
  }, [items, filter, search])

  const unreadCount = items.filter((n) => !n.is_read).length

  const handleSend = () => {
    if (!notifTitle.trim() || !notifBody.trim()) return
    sendCustomerNotification({
      title: notifTitle,
      body: notifBody,
      type: notifType,
    })
    setNotifTitle('')
    setNotifBody('')
    setShowSend(false)
  }

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle={`${unreadCount} unread of ${items.length} total · Sent to customer app in real-time`}
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => setShowSend(!showSend)}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
            >
              <Send className="h-4 w-4" />
              Send to Customers
            </button>
            <button
              onClick={() => notificationActions.markAllRead()}
              disabled={unreadCount === 0}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </button>
          </div>
        }
      />

      {showSend && (
        <Card className="p-4 mb-4 premium-shadow border-border/50 bg-emerald-50/30">
          <h3 className="text-sm font-bold text-foreground mb-3">Send Push Notification to All Customers</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Type</label>
              <div className="mt-1 flex gap-2">
                {(['offer', 'order', 'wallet', 'system'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setNotifType(t)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize ${notifType === t ? 'bg-emerald-600 text-white' : 'bg-muted text-muted-foreground'}`}
                  >
                    {TYPE_ICONS[t]} {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Title</label>
              <input
                value={notifTitle}
                onChange={(e) => setNotifTitle(e.target.value)}
                placeholder="e.g. 50% OFF this weekend!"
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Message</label>
              <textarea
                value={notifBody}
                onChange={(e) => setNotifBody(e.target.value)}
                placeholder="Use code WEEKEND50 for 25% off on all orders above ₹299..."
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
                rows={2}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSend}
                disabled={!notifTitle.trim() || !notifBody.trim()}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
              >
                Send Now
              </button>
              <button
                onClick={() => setShowSend(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </Card>
      )}

      <Card className="p-4 mb-4 premium-shadow border-border/50">
        <div className="flex flex-col sm:flex-row gap-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Search notifications..." className="flex-1" />
          <FilterChips
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'all', label: 'All', count: items.length },
              { value: 'unread', label: 'Unread', count: unreadCount },
              { value: 'read', label: 'Read', count: items.length - unreadCount },
            ]}
          />
        </div>
      </Card>

      <Card className="premium-shadow border-border/50 overflow-hidden">
        <div className="divide-y divide-border">
          {filtered.map((n) => (
            <div
              key={n.id}
              className={`p-4 flex items-start gap-3 hover:bg-muted/30 transition-colors cursor-pointer ${!n.is_read ? 'bg-primary/5' : ''}`}
              onClick={() => notificationActions.markRead(n.id)}
            >
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${TYPE_COLORS[n.type] || TYPE_COLORS.system}`}>
                {TYPE_ICONS[n.type] || '🔔'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-foreground text-sm">{n.title}</p>
                  {!n.is_read && <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />}
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{n.body}</p>
                <p className="text-xs text-muted-foreground mt-1">{timeAgo(n.created_at)}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); notificationActions.remove(n.id) }}
                className="text-muted-foreground hover:text-rose-600 p-1"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        {filtered.length === 0 && (
          <EmptyState
            icon={BellOff}
            title="No notifications"
            description="You're all caught up!"
          />
        )}
      </Card>
    </div>
  )
}
