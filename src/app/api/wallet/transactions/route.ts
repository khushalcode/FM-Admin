import { NextRequest } from 'next/server'
import { getServerState, jsonResponse } from '@/lib/server/admin-store'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('user_id')
  const role = searchParams.get('role')
  const state = getServerState()
  let txs = state.walletTransactions
  if (userId) txs = txs.filter((t) => t.user_id === userId)
  if (role) txs = txs.filter((t) => t.user_role === role)
  txs = [...txs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  return jsonResponse(txs)
}
