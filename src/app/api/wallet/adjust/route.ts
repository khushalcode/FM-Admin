import { NextRequest } from 'next/server'
import { getServerState, jsonResponse, uid } from '@/lib/server/admin-store'
import { WalletTxType } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const { userId, role, type, amount, description, adminId } = body as {
    userId: string
    role: 'customer' | 'vendor' | 'delivery'
    type: WalletTxType
    amount: number
    description?: string
    adminId?: string
  }
  if (!userId || !role || !type || !amount) {
    return jsonResponse({ error: 'userId, role, type, amount required' }, 400)
  }
  const state = getServerState()
  const list = role === 'customer' ? state.customers : role === 'vendor' ? state.vendors : state.deliveryMen
  const user = list.find((u) => u.id === userId)
  if (!user) return jsonResponse({ error: 'user not found' }, 404)
  const balanceAfter =
    type === 'credit' ? user.wallet_balance + Number(amount) : Math.max(0, user.wallet_balance - Number(amount))
  user.wallet_balance = balanceAfter
  const tx = {
    id: uid('wtx'),
    user_id: userId,
    user_role: role,
    user_name: user.full_name,
    type,
    source: 'adjustment',
    amount: Number(amount),
    balance_after: balanceAfter,
    description: description || (type === 'credit' ? 'Admin credit' : 'Admin debit'),
    created_by: adminId || 'admin',
    created_at: new Date().toISOString(),
  }
  state.walletTransactions = [tx, ...state.walletTransactions]
  return jsonResponse(tx, 201)
}
