import { NextRequest } from 'next/server'
import { getServerState, jsonResponse, uid } from '@/lib/server/admin-store'
import { DeliveryMan } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function GET() {
  const state = getServerState()
  return jsonResponse(state.deliveryMen)
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const state = getServerState()
  const item: DeliveryMan = {
    id: uid('dm'),
    firebase_uid: uid('uid'),
    full_name: body.full_name || 'Untitled',
    email: body.email || '',
    phone: body.phone || '',
    avatar_url: body.avatar_url,
    vehicle_type: body.vehicle_type || 'bike',
    is_online: false,
    is_active: true,
    is_approved: false,
    rating: 0,
    total_deliveries: 0,
    current_order_id: null,
    latitude: body.latitude ?? 12.9716,
    longitude: body.longitude ?? 77.5946,
    wallet_balance: 0,
    created_at: new Date().toISOString(),
  }
  state.deliveryMen = [item, ...state.deliveryMen]
  return jsonResponse(item, 201)
}

export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const state = getServerState()
  const { id, ...patch } = body
  if (!id) return jsonResponse({ error: 'id required' }, 400)
  state.deliveryMen = state.deliveryMen.map((d) => (d.id === id ? { ...d, ...patch } : d))
  return jsonResponse({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return jsonResponse({ error: 'id required' }, 400)
  const state = getServerState()
  state.deliveryMen = state.deliveryMen.filter((d) => d.id !== id)
  return jsonResponse({ ok: true })
}
