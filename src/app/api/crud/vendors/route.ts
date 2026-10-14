import { NextRequest } from 'next/server'
import { getServerState, jsonResponse, uid } from '@/lib/server/admin-store'
import { Vendor } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function GET() {
  const state = getServerState()
  return jsonResponse(state.vendors)
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const state = getServerState()
  const item: Vendor = {
    id: uid('vendor'),
    firebase_uid: uid('uid'),
    full_name: body.full_name || 'Untitled',
    email: body.email || '',
    phone: body.phone || '',
    avatar_url: body.avatar_url,
    is_active: true,
    is_approved: false,
    total_sales: 0,
    total_orders: 0,
    rating: 0,
    wallet_balance: 0,
    created_at: new Date().toISOString(),
  }
  state.vendors = [item, ...state.vendors]
  return jsonResponse(item, 201)
}

export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const state = getServerState()
  const { id, ...patch } = body
  if (!id) return jsonResponse({ error: 'id required' }, 400)
  state.vendors = state.vendors.map((v) => (v.id === id ? { ...v, ...patch } : v))
  return jsonResponse({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return jsonResponse({ error: 'id required' }, 400)
  const state = getServerState()
  state.vendors = state.vendors.filter((v) => v.id !== id)
  return jsonResponse({ ok: true })
}
