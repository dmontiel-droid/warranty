import { Redis } from '@upstash/redis'

export const KV_KEY = 'warranty_claims_latest'
export const KV_HISTORY_KEY = 'warranty_claims_history'

const redis = new Redis({
    url: process.env.REDIS_REST_API_URL!,
    token: process.env.REDIS_REST_API_TOKEN!,
})

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
    await redis.set(KV_KEY, JSON.stringify(snapshot))
    // keep last 30 daily snapshots
  const historyRaw = await redis.get<string>(KV_HISTORY_KEY)
    const history: WarrantySnapshot[] = historyRaw ? JSON.parse(historyRaw) : []
        history.unshift(snapshot)
    if (history.length > 30) history.pop()
    await redis.set(KV_HISTORY_KEY, JSON.stringify(history))
}

export async function getLatestSnapshot(): Promise<WarrantySnapshot | null> {
    const raw = await redis.get<string>(KV_KEY)
    return raw ? JSON.parse(raw) : null
}
