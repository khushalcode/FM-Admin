import { NextRequest } from 'next/server'
import { getServerState, jsonResponse } from '@/lib/server/admin-store'
import { AppSettings } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function GET() {
  const state = getServerState()
  return jsonResponse(state.settings)
}

export async function PUT(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as Partial<AppSettings>
  const state = getServerState()
  state.settings = { ...state.settings, ...body }
  return jsonResponse(state.settings)
}
