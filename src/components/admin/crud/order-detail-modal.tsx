'use client'

import { useState } from 'react'
import { Modal, StatusBadge, formatCurrency, timeAgo, PrimaryButton, SelectField } from '../shared'
import { Order, OrderStatus } from '@/lib/types'
import { useAdminState, orderActions, deliveryManActions } from '@/lib/admin-data'

const STATUS_FLOW: Array<{ status: OrderStatus; label: string; next?: OrderStatus }> = [
  { status: 'pending', label: 'Pending', next: 'accepted' },
  { status: 'accepted', label: 'Accepted', next: 'preparing' },
  { status: 'preparing', label: 'Preparing', next: 'ready' },
  { status: 'ready', label: 'Ready', next: 'picked_up' },
  { status: 'picked_up', label: 'Picked Up', next: 'on_the_way' },
  { status: 'on_the_way', label: 'On The Way', next: 'delivered' },
  { status: 'delivered', label: 'Delivered' },
]

export function OrderDetailModal({
  order, onClose,
}: {
  order: Order | null
  onClose: () => void
}) {
  const deliveryMen = useAdminState((s) => s.deliveryMen)
  const [assignMan, setAssignMan] = useState('')

  if (!order) return null

  const current = STATUS_FLOW.find((s) => s.status === order.status)
  const next = current?.next

  const assign = () => {
    if (!assignMan) return
    orderActions.assignDelivery(order.id, assignMan)
  }

  return (
    <Modal open={!!order} onClose={onClose} title={order.order_code} description={`Placed ${timeAgo(order.created_at)}`} size="md">
      <div className="space-y-5">
        <div className="flex items-center gap-2">
          <StatusBadge status={order.status} />
          <StatusBadge status={order.payment_status} />
          <StatusBadge status={order.payment_method} label={order.payment_method.toUpperCase()} />
        </div>

        <Section title="Customer">
          <p className="text-sm font-medium text-foreground">{order.customer_name}</p>
          <p className="text-sm text-muted-foreground">{order.customer_phone}</p>
          <p className="text-sm text-muted-foreground mt-1">{order.delivery_address}</p>
        </Section>

        <Section title="Store">
          <p className="text-sm font-medium text-foreground">{order.store_name}</p>
          {order.delivery_man_name && (
            <p className="text-sm text-muted-foreground mt-1">Delivery: {order.delivery_man_name}</p>
          )}
        </Section>

        <Section title={`Items (${order.items.length})`}>
          <div className="space-y-2">
            {order.items.map((it, i) => (
              <div key={i} className="flex justify-between text-sm">
                <div className="flex-1">
                  <p className="text-foreground">{it.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {it.quantity} × {formatCurrency(it.price)} · {it.unit}
                  </p>
                </div>
                <p className="font-medium text-foreground">
                  {formatCurrency(it.price * it.quantity)}
                </p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Bill Summary">
          <Line label="Subtotal" value={formatCurrency(order.subtotal)} />
          <Line label="Delivery Fee" value={formatCurrency(order.delivery_fee)} />
          {order.discount > 0 && (
            <Line label="Discount" value={`- ${formatCurrency(order.discount)}`} accent="emerald" />
          )}
          <Line label="Tax" value={formatCurrency(order.tax)} />
          <div className="border-t border-border mt-2 pt-2">
            <Line label="Total" value={formatCurrency(order.total)} bold />
          </div>
        </Section>

        {order.note && (
          <Section title="Customer Note">
            <p className="text-sm text-foreground italic">"{order.note}"</p>
          </Section>
        )}

        {/* Status actions */}
        <Section title="Update Status">
          <div className="flex flex-wrap gap-2">
            {next && (
              <PrimaryButton onClick={() => orderActions.setStatus(order.id, next)}>
                Mark as {STATUS_FLOW.find((s) => s.status === next)?.label}
              </PrimaryButton>
            )}
            {order.status !== 'cancelled' && order.status !== 'delivered' && (
              <button
                onClick={() => orderActions.setStatus(order.id, 'cancelled')}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50"
              >
                Cancel Order
              </button>
            )}
          </div>
        </Section>

        {/* Assign delivery man */}
        {order.status !== 'delivered' && order.status !== 'cancelled' && (
          <Section title="Assign Delivery Man">
            <div className="flex gap-2">
              <SelectField
                label=""
                value={assignMan}
                onChange={setAssignMan}
                options={[
                  { value: '', label: 'Select delivery man…' },
                  ...deliveryMen.filter((d) => d.is_active && d.is_approved).map((d) => ({
                    value: d.id,
                    label: `${d.full_name} (${d.vehicle_type})${d.is_online ? ' · Online' : ''}`,
                  })),
                ]}
              />
              <button
                onClick={assign}
                disabled={!assignMan}
                className="self-end px-3 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                Assign
              </button>
            </div>
          </Section>
        )}

        <div className="flex justify-end pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted">Close</button>
        </div>
      </div>
    </Modal>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
        {title}
      </h3>
      {children}
    </div>
  )
}

function Line({
  label, value, bold, accent,
}: {
  label: string; value: string; bold?: boolean; accent?: 'emerald'
}) {
  return (
    <div className="flex justify-between text-sm py-0.5">
      <span className={bold ? 'font-semibold text-foreground' : 'text-muted-foreground'}>
        {label}
      </span>
      <span
        className={`${bold ? 'font-semibold text-foreground' : 'text-foreground'} ${
          accent === 'emerald' ? 'text-emerald-600' : ''
        }`}
      >
        {value}
      </span>
    </div>
  )
}
