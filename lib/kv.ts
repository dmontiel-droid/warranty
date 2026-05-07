import { kv } from '@vercel/kv'

export const KV_KEY = 'warranty_claims_latest'
export const KV_HISTORY_KEY = 'warranty_claims_history'

export interface ClaimEntry {
  prefixedId: string
  claimantName: string
  incidentType: string
  handler: string
  submittedAt: string
  status: string
  statusId: number
  daysOpen?: number
}

export interface WarrantySnapshot {
  fetchedAt: string
  summary: Record<string, number>
  claims: ClaimEntry[]
}

export async function saveSnapshot(snapshot: WarrantySnapshot) {
  await kv.set(KV_KEY, JSON.stringify(snapshot))
  // keep last 30 daily snapshots
  const historyRaw = await kv.get<string>(KV_HISTORY_KEY)
  const history: WarrantySnapshot[] = historyRaw ? JSON.parse(historyRaw) : []
  history.unshift(snapshot)
  if (history.length > 30) history.pop()
  await kv.set(KV_HISTORY_KEY, JSON.stringify(history))
}

export async function getLatestSnapshot(): Promise<WarrantySnapshot | null> {
  const raw = await kv.get<string>(KV_KEY)
  return raw ? JSON.parse(raw) : null
}
