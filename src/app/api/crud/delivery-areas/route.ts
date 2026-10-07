import { NextRequest } from 'next/server'
import { getServerState, jsonResponse, uid } from '@/lib/server/admin-store'
import { DeliveryArea } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const storeId = searchParams.get('store_id')
  const state = getServerState()
  const list = storeId ? state.deliveryAreas.filter((d) => d.store_id === storeId) : state.deliveryAreas
  return jsonResponse(list)
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const state = getServerState()
  const item: DeliveryArea = {
    id: uid('da'),
    store_id: body.store_id || '',
    pincode: body.pincode || '',
    delivery_fee: body.delivery_fee ?? 30,
    delivery_time_minutes: body.delivery_time_minutes ?? 35,
    is_active: body.is_active ?? true,
    created_at: new Date().toISOString(),
  }
  state.deliveryAreas = [item, ...state.deliveryAreas]
  return jsonResponse(item, 201)
}

export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const state = getServerState()
  const { id, ...patch } = body
  if (!id) return jsonResponse({ error: 'id required' }, 400)
  state.deliveryAreas = state.deliveryAreas.map((d) => (d.id === id ? { ...d, ...patch } : d))
  return jsonResponse({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return jsonResponse({ error: 'id required' }, 400)
  const state = getServerState()
  state.deliveryAreas = state.deliveryAreas.filter((d) => d.id !== id)
  return jsonResponse({ ok: true })
}
