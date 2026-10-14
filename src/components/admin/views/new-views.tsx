'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Truck, Clock, Navigation } from 'lucide-react';
import { useAdminState } from '@/lib/admin-data';
import { getStoreImage } from '@/lib/customer-store';
import { formatINR } from '@/lib/utils';

export function LiveTrackingView() {
  const orders = useAdminState((s) => s.orders.filter((o: any) => !['delivered', 'cancelled'].includes(o.status)));
  const stores = useAdminState((s) => s.stores);
  const [selected, setSelected] = useState<string | null>(orders[0]?.id || null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick((t) => t + 1), 2000);
    return () => clearInterval(t);
  }, []);

  const activeOrders = orders.slice(0, 8);
  const currentOrder = orders.find((o: any) => o.id === selected) || orders[0];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Live Order Tracking</h1>
        <p className="text-sm text-slate-500">Real-time tracking of {activeOrders.length} active orders</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Active orders list */}
        <div className="lg:col-span-1 space-y-2">
          <h2 className="text-sm font-semibold text-slate-700">Active Orders</h2>
          {activeOrders.map((o: any) => (
            <button
              key={o.id}
              onClick={() => setSelected(o.id)}
              className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all ${selected === o.id ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}
            >
              <img src={getStoreImage(o.store_id)} alt="" className="h-10 w-10 rounded-lg object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">{o.store_name}</p>
                <p className="text-xs text-slate-500">#{o.order_code} · {o.customer_name}</p>
                <div className="mt-0.5 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-medium text-emerald-600">{o.status.replace(/_/g, ' ').toUpperCase()}</span>
                </div>
              </div>
              <span className="text-xs font-bold text-slate-900">{formatINR(o.total)}</span>
            </button>
          ))}
        </div>

        {/* Map */}
        <div className="lg:col-span-2">
          <div className="relative h-[400px] overflow-hidden rounded-2xl border border-slate-200 bg-emerald-50">
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 400" preserveAspectRatio="none">
              <line x1="0" y1="80" x2="400" y2="80" stroke="#D4D4D8" strokeWidth="4" />
              <line x1="0" y1="200" x2="400" y2="200" stroke="#D4D4D8" strokeWidth="4" />
              <line x1="0" y1="320" x2="400" y2="320" stroke="#D4D4D8" strokeWidth="4" />
              <line x1="100" y1="0" x2="100" y2="400" stroke="#D4D4D8" strokeWidth="4" />
              <line x1="250" y1="0" x2="250" y2="400" stroke="#D4D4D8" strokeWidth="4" />
              <rect x="120" y="100" width="100" height="60" fill="#86EFAC" opacity="0.3" />
              <rect x="270" y="220" width="100" height="60" fill="#86EFAC" opacity="0.3" />
              <path d="M 80 60 Q 150 120, 200 180 T 350 300" stroke="#10B981" strokeWidth="4" fill="none" strokeDasharray="8 6" strokeLinecap="round" />
              <path d="M 80 60 Q 150 120, 200 180 T 350 300" stroke="#10B981" strokeWidth="12" fill="none" opacity="0.1" strokeLinecap="round" />
            </svg>

            {/* Restaurant marker */}
            <div className="absolute left-[70px] top-[50px]">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-lg shadow-lg ring-2 ring-emerald-500">🍽️</div>
              <span className="mt-1 block rounded-full bg-slate-900/80 px-2 py-0.5 text-[9px] font-semibold text-white">{currentOrder?.store_name}</span>
            </div>

            {/* Animated rider */}
            <motion.div
              animate={{ left: `${20 + (tick % 5) * 18}%`, top: `${15 + (tick % 5) * 15}%` }}
              transition={{ duration: 2 }}
              className="absolute"
            >
              <div className="relative">
                <motion.span animate={{ scale: [1, 1.5, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="absolute -inset-3 rounded-full bg-emerald-400/20" />
                <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-xl text-white shadow-lg ring-2 ring-white">🛵</div>
              </div>
            </motion.div>

            {/* Home marker */}
            <div className="absolute right-[30px] bottom-[50px]">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-lg text-white shadow-lg ring-2 ring-white">🏠</div>
              <span className="mt-1 block rounded-full bg-slate-900/80 px-2 py-0.5 text-[9px] font-semibold text-white">Customer</span>
            </div>

            {/* ETA */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-slate-900 px-4 py-1.5 text-xs font-bold text-white shadow-lg">
              🛵 ETA: {Math.max(3, 15 - (tick % 5) * 3)} min
            </div>
          </div>

          {currentOrder && (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="flex items-center gap-1 text-xs text-slate-500"><Truck size={12} /><span>Rider</span></div>
                <p className="mt-1 text-sm font-bold text-slate-900">Rahul Kumar</p>
                <p className="text-[10px] text-slate-400">⭐ 4.8</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="flex items-center gap-1 text-xs text-slate-500"><Clock size={12} /><span>Time</span></div>
                <p className="mt-1 text-sm font-bold text-slate-900">{currentOrder.delivery_time || 25} min</p>
                <p className="text-[10px] text-emerald-600">In progress</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="flex items-center gap-1 text-xs text-slate-500"><Navigation size={12} /><span>Distance</span></div>
                <p className="mt-1 text-sm font-bold text-slate-900">{(1.2 + (tick % 5) * 0.3).toFixed(1)} km</p>
                <p className="text-[10px] text-slate-400">from store</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="flex items-center gap-1 text-xs text-slate-500"><MapPin size={12} /><span>Address</span></div>
                <p className="mt-1 text-sm font-bold text-slate-900 truncate">MG Road</p>
                <p className="text-[10px] text-slate-400 truncate">Bangalore 560001</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ReviewsView() {
  const products = useAdminState((s) => s.products);
  const stores = useAdminState((s) => s.stores);

  const reviews = [
    { id: 'r1', customer: 'Aarav Sharma', avatar: '/images/user/avatar.jpg', targetType: 'product', targetId: products[0]?.id, targetName: products[0]?.name, rating: 5, comment: 'Absolutely delicious! The biryani was packed perfectly and arrived hot. Will order again!', date: '2 hours ago', isReply: false },
    { id: 'r2', customer: 'Ananya Rao', avatar: '', targetType: 'store', targetId: stores[0]?.id, targetName: stores[0]?.name, rating: 4, comment: 'Great food but delivery was a bit late. The packaging could be better.', date: '5 hours ago', isReply: false },
    { id: 'r3', customer: 'Vivaan Iyer', avatar: '', targetType: 'product', targetId: products[2]?.id, targetName: products[2]?.name, rating: 5, comment: 'Best burger in town! Juicy and flavorful. Highly recommend.', date: '1 day ago', isReply: false },
    { id: 'r4', customer: 'Diya Pillai', avatar: '', targetType: 'product', targetId: products[4]?.id, targetName: products[4]?.name, rating: 3, comment: 'It was okay. Not as spicy as I expected. Portion size was good though.', date: '2 days ago', isReply: true },
    { id: 'r5', customer: 'Arjun Gupta', avatar: '', targetType: 'store', targetId: stores[2]?.id, targetName: stores[2]?.name, rating: 5, comment: 'Amazing service and quick delivery. The pizza was fresh and cheesy!', date: '3 days ago', isReply: false },
  ];

  const avgRating = (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-slate-900">Reviews & Ratings</h1><p className="text-sm text-slate-500">Monitor and respond to customer reviews</p></div>
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2"><div className="text-center"><p className="text-2xl font-bold text-slate-900">{avgRating}</p><p className="text-[10px] text-slate-500">Avg rating</p></div><div className="h-8 w-px bg-slate-200" /><div className="text-center"><p className="text-2xl font-bold text-slate-900">{reviews.length}</p><p className="text-[10px] text-slate-500">Reviews</p></div></div>
      </div>
      <div className="grid gap-3">
        {reviews.map((r) => (
          <div key={r.id} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 overflow-hidden">{r.avatar ? <img src={r.avatar} alt="" className="h-full w-full object-cover" /> : <span className="text-sm font-bold text-slate-600">{r.customer[0]}</span>}</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between"><div><p className="text-sm font-semibold text-slate-900">{r.customer}</p><p className="text-[10px] text-slate-500">{r.date}</p></div><div className="flex items-center gap-0.5">{[1,2,3,4,5].map((i) => <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill={i <= r.rating ? '#F59E0B' : '#E4E4E7'}><path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>)}</div></div>
                <p className="mt-1 text-sm text-slate-700">{r.comment}</p>
                <div className="mt-2 flex items-center gap-2"><span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">{r.targetType === 'product' ? '🍽️' : '🏪'} {r.targetName}</span>{r.isReply && <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">REPLIED</span>}</div>
                <div className="mt-3 flex gap-2"><button className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50">Reply</button><button className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50">View order</button></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function RefundsView() {
  const refunds = [
    { id: 'rf1', orderId: 'ORD001', customer: 'Aarav Sharma', amount: 347, reason: 'Order cancelled by customer', status: 'pending', date: '2 hours ago' },
    { id: 'rf2', orderId: 'ORD005', customer: 'Saanvi Joshi', amount: 199, reason: 'Food quality issue', status: 'approved', date: '5 hours ago' },
    { id: 'rf3', orderId: 'ORD008', customer: 'Arjun Gupta', amount: 549, reason: 'Late delivery', status: 'pending', date: '1 day ago' },
    { id: 'rf4', orderId: 'ORD012', customer: 'Ananya Rao', amount: 129, reason: 'Wrong item delivered', status: 'rejected', date: '2 days ago' },
    { id: 'rf5', orderId: 'ORD015', customer: 'Vivaan Iyer', amount: 299, reason: 'Order not delivered', status: 'approved', date: '3 days ago' },
  ];
  const statusMeta: any = { pending: { color: '#F59E0B', bg: '#FEF3C7', label: 'Pending' }, approved: { color: '#10B981', bg: '#D1FAE5', label: 'Approved' }, rejected: { color: '#EF4444', bg: '#FEE2E2', label: 'Rejected' } };

  return (
    <div className="space-y-4">
      <div><h1 className="text-2xl font-bold text-slate-900">Refund Requests</h1><p className="text-sm text-slate-500">Process and manage customer refund requests</p></div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        {[{ label: 'Total', value: refunds.length, color: 'text-slate-900' }, { label: 'Pending', value: refunds.filter(r => r.status === 'pending').length, color: 'text-amber-600' }, { label: 'Approved', value: refunds.filter(r => r.status === 'approved').length, color: 'text-emerald-600' }, { label: 'Rejected', value: refunds.filter(r => r.status === 'rejected').length, color: 'text-red-600' }].map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4"><p className={`text-2xl font-bold ${s.color}`}>{s.value}</p><p className="text-xs text-slate-500">{s.label}</p></div>
        ))}
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50"><tr>{['Refund ID', 'Order ID', 'Customer', 'Amount', 'Reason', 'Status', 'Date', 'Action'].map((h) => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-600">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-slate-100">
            {refunds.map((r) => {
              const meta = statusMeta[r.status];
              return (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs text-slate-700">#{r.id}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-700">#{r.orderId}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{r.customer}</td>
                  <td className="px-4 py-3 font-bold text-slate-900">₹{r.amount}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">{r.reason}</td>
                  <td className="px-4 py-3"><span className="rounded-full px-2 py-1 text-[10px] font-bold" style={{ backgroundColor: meta.bg, color: meta.color }}>{meta.label}</span></td>
                  <td className="px-4 py-3 text-xs text-slate-500">{r.date}</td>
                  <td className="px-4 py-3">{r.status === 'pending' ? (<div className="flex gap-1"><button className="rounded bg-emerald-600 px-2 py-1 text-[10px] font-bold text-white">Approve</button><button className="rounded bg-red-600 px-2 py-1 text-[10px] font-bold text-white">Reject</button></div>) : <span className="text-xs text-slate-400">—</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function PayoutsView() {
  const payouts = [
    { id: 'po1', type: 'vendor', name: 'Spice Garden Restaurant', amount: 12450, status: 'pending', date: 'Due Oct 15' },
    { id: 'po2', type: 'vendor', name: 'Pizza Corner', amount: 8900, status: 'pending', date: 'Due Oct 15' },
    { id: 'po3', type: 'vendor', name: 'Burger Barn', amount: 6700, status: 'paid', date: 'Paid Oct 10' },
    { id: 'po4', type: 'delivery', name: 'Rahul Kumar', amount: 3450, status: 'paid', date: 'Paid Oct 10' },
    { id: 'po5', type: 'delivery', name: 'Amit Singh', amount: 2800, status: 'pending', date: 'Due Oct 15' },
  ];
  const statusMeta: any = { pending: { color: '#F59E0B', bg: '#FEF3C7' }, paid: { color: '#10B981', bg: '#D1FAE5' } };
  const totalPending = payouts.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0);
  const totalPaid = payouts.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-slate-900">Payouts</h1><p className="text-sm text-slate-500">Manage vendor and delivery partner payouts</p></div><button className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700">Process Payouts</button></div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-2xl font-bold text-amber-600">₹{totalPending.toLocaleString('en-IN')}</p><p className="text-xs text-slate-500">Pending payouts</p></div>
        <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-2xl font-bold text-emerald-600">₹{totalPaid.toLocaleString('en-IN')}</p><p className="text-xs text-slate-500">Paid this cycle</p></div>
        <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-2xl font-bold text-slate-900">₹{(totalPending + totalPaid).toLocaleString('en-IN')}</p><p className="text-xs text-slate-500">Total this month</p></div>
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50"><tr>{['Payout ID', 'Type', 'Name', 'Amount', 'Status', 'Schedule', 'Action'].map((h) => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-600">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-slate-100">
            {payouts.map((p) => {
              const meta = statusMeta[p.status];
              return (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs text-slate-700">#{p.id}</td>
                  <td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${p.type === 'vendor' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>{p.type === 'vendor' ? '🏪 Vendor' : '🛵 Delivery'}</span></td>
                  <td className="px-4 py-3 font-medium text-slate-900">{p.name}</td>
                  <td className="px-4 py-3 font-bold text-slate-900">₹{p.amount.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3"><span className="rounded-full px-2 py-1 text-[10px] font-bold" style={{ backgroundColor: meta.bg, color: meta.color }}>{p.status.toUpperCase()}</span></td>
                  <td className="px-4 py-3 text-xs text-slate-500">{p.date}</td>
                  <td className="px-4 py-3">{p.status === 'pending' ? <button className="rounded bg-emerald-600 px-2 py-1 text-[10px] font-bold text-white">Pay Now</button> : <span className="text-xs text-slate-400">—</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function PushCampaignsView() {
  const [showCreate, setShowCreate] = useState(false);
  const campaigns = [
    { id: 'pc1', title: 'Weekend Special — 25% OFF', sentTo: 'All customers', sent: 45000, opened: 18000, clicked: 5400, date: '2 days ago', status: 'completed' },
    { id: 'pc2', title: 'New store: Tandoori Nights', sentTo: 'Bengaluru users', sent: 12000, opened: 5600, clicked: 2100, date: '5 days ago', status: 'completed' },
    { id: 'pc3', title: 'Free delivery today only', sentTo: 'Inactive users (30d)', sent: 8000, opened: 2400, clicked: 680, date: '1 week ago', status: 'completed' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-slate-900">Push Campaigns</h1><p className="text-sm text-slate-500">Send targeted push notifications to customers</p></div><button onClick={() => setShowCreate(!showCreate)} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700">+ New Campaign</button></div>
      {showCreate && (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-bold text-slate-900">Create New Campaign</h3>
          <div className="mt-3 space-y-3">
            <div><label className="text-xs font-medium text-slate-600">Title</label><input className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="e.g. 50% OFF this weekend!" /></div>
            <div><label className="text-xs font-medium text-slate-600">Message</label><textarea className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" rows={2} placeholder="Use code WEEKEND50 for 25% off..." /></div>
            <div className="flex gap-3"><div className="flex-1"><label className="text-xs font-medium text-slate-600">Target audience</label><select className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"><option>All customers</option><option>Active customers (7d)</option><option>Inactive users (30d)</option><option>Gold members</option></select></div><div className="flex-1"><label className="text-xs font-medium text-slate-600">Schedule</label><select className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"><option>Send now</option><option>Schedule for later</option></select></div></div>
            <div className="flex gap-2"><button onClick={() => setShowCreate(false)} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white">Send Campaign</button><button onClick={() => setShowCreate(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Cancel</button></div>
          </div>
        </div>
      )}
      <div className="grid gap-3">
        {campaigns.map((c) => (
          <div key={c.id} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between">
              <div><p className="text-sm font-bold text-slate-900">{c.title}</p><p className="text-xs text-slate-500">To: {c.sentTo} · {c.date}</p></div>
              <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold text-emerald-700">COMPLETED</span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-slate-50 p-2 text-center"><p className="text-sm font-bold text-slate-900">{(c.sent / 1000).toFixed(0)}K</p><p className="text-[9px] text-slate-500">Sent</p></div>
              <div className="rounded-lg bg-slate-50 p-2 text-center"><p className="text-sm font-bold text-slate-900">{((c.opened / c.sent) * 100).toFixed(0)}%</p><p className="text-[9px] text-slate-500">Open rate</p></div>
              <div className="rounded-lg bg-slate-50 p-2 text-center"><p className="text-sm font-bold text-slate-900">{((c.clicked / c.sent) * 100).toFixed(1)}%</p><p className="text-[9px] text-slate-500">Click rate</p></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
