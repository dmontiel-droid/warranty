import { NextResponse } from 'next/server'
import { getLatestSnapshot } from '@/lib/kv'

export async function GET() {
  const snapshot = await getLatestSnapshot()
  if (!snapshot) {
    return NextResponse.json({ error: 'No data yet' }, { status: 404 })
  }
  return NextResponse.json(snapshot)
}
