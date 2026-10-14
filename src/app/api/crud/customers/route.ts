import { NextRequest } from 'next/server'
import { getServerState, jsonResponse, uid } from '@/lib/server/admin-store'
import { Customer } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function GET() {
  const state = getServerState()
  return jsonResponse(state.customers)
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const state = getServerState()
  const item: Customer = {
    id: uid('cust'),
    firebase_uid: uid('uid'),
    full_name: body.full_name || 'Untitled',
    email: body.email || '',
    phone: body.phone || '',
    avatar_url: body.avatar_url,
    is_active: true,
    is_blocked: false,
    total_orders: 0,
    total_spent: 0,
    wallet_balance: 0,
    loyalty_points: 0,
    created_at: new Date().toISOString(),
  }
  state.customers = [item, ...state.customers]
  return jsonResponse(item, 201)
}

export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const state = getServerState()
  const { id, ...patch } = body
  if (!id) return jsonResponse({ error: 'id required' }, 400)
  state.customers = state.customers.map((c) => (c.id === id ? { ...c, ...patch } : c))
  return jsonResponse({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return jsonResponse({ error: 'id required' }, 400)
  const state = getServerState()
  state.customers = state.customers.filter((c) => c.id !== id)
  return jsonResponse({ ok: true })
}
