'use client'

import { useState, useMemo } from 'react'
import { Bell, BellOff, CheckCheck, Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import {
  PageHeader, SearchInput, EmptyState, FilterChips,
  timeAgo,
} from '../shared'
import { useAdminState, notificationActions } from '@/lib/admin-data'
import { Notification } from '@/lib/types'

const TYPE_COLORS: Record<string, string> = {
  order: 'bg-amber-50 text-amber-600',
  promo: 'bg-violet-50 text-violet-600',
  system: 'bg-blue-50 text-blue-600',
  chat: 'bg-emerald-50 text-emerald-600',
}

const TYPE_ICONS: Record<string, string> = {
  order: '🛍️',
  promo: '🎁',
  system: '⚙️',
  chat: '💬',
}

export function NotificationsView() {
  const items = useAdminState((s) => s.notifications)
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all')
  const [search, setSearch] = useState('')

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

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle={`${unreadCount} unread of ${items.length} total`}
        actions={
          <button
            onClick={() => notificationActions.markAllRead()}
            disabled={unreadCount === 0}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </button>
        }
      />

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
