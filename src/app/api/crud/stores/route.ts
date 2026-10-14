import { NextRequest } from 'next/server'
import { getServerState, jsonResponse, uid } from '@/lib/server/admin-store'
import { Store } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function GET() {
  const state = getServerState()
  return jsonResponse(state.stores)
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const state = getServerState()
  const item: Store = {
    id: uid('store'),
    name: body.name || 'Untitled',
    slug: (body.name || 'untitled').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    description: body.description || '',
    address: body.address || '',
    latitude: body.latitude,
    longitude: body.longitude,
    phone: body.phone || '',
    email: body.email,
    vendor_id: body.vendor_id || state.vendors[0]?.id || '',
    is_active: body.is_active ?? true,
    is_open: body.is_open ?? true,
    rating: 0,
    reviews_count: 0,
    minimum_order: body.minimum_order ?? 200,
    delivery_fee: body.delivery_fee ?? 30,
    delivery_time_minutes: body.delivery_time_minutes ?? 35,
    commission_percentage: body.commission_percentage ?? 10,
    created_at: new Date().toISOString(),
  }
  state.stores = [item, ...state.stores]
  return jsonResponse(item, 201)
}

export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const state = getServerState()
  const { id, ...patch } = body
  if (!id) return jsonResponse({ error: 'id required' }, 400)
  state.stores = state.stores.map((s) => (s.id === id ? { ...s, ...patch } : s))
  return jsonResponse({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return jsonResponse({ error: 'id required' }, 400)
  const state = getServerState()
  state.stores = state.stores.filter((s) => s.id !== id)
  state.deliveryAreas = state.deliveryAreas.filter((d) => d.store_id !== id)
  return jsonResponse({ ok: true })
}
