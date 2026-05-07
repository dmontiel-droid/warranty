import { NextRequest, NextResponse } from 'next/server'
import { saveSnapshot, WarrantySnapshot } from '@/lib/kv'
import { differenceInDays, parseISO } from 'date-fns'

const STATUS_NAMES: Record<number, string> = {
  0: 'Not Handled',
  1: 'Open',
  2: 'Closed',
  3: 'Denied',
  4: 'New Info',
}

export async function POST(req: NextRequest) {
  // Verify secret to prevent unauthorized pushes
  const authHeader = req.headers.get('authorization')
  const secret = process.env.INGEST_SECRET
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  // body: { claims: [...raw CI claim objects] }
  const rawClaims = body.claims ?? []

  const summary: Record<string, number> = {
    'Not Handled': 0, Open: 0, Closed: 0, Denied: 0, 'New Info': 0, Total: 0,
  }

  const claims = rawClaims.map((c: any) => {
    const statusId: number = c.claimHandling?.statusId ?? c.statusId ?? -1
    const statusName = STATUS_NAMES[statusId] ?? 'Unknown'
    if (summary[statusName] !== undefined) summary[statusName]++
    summary['Total']++

    const submittedAt = c.submittedAt ?? c.createdAt ?? ''
    const daysOpen = submittedAt
      ? differenceInDays(new Date(), parseISO(submittedAt))
      : undefined

    return {
      prefixedId: c.prefixedId ?? c.id ?? '',
      claimantName: [c.claimant?.firstName, c.claimant?.lastName].filter(Boolean).join(' ') ||
        c.claimantName || '',
      incidentType: c.incidentType?.name ?? c.incidentType ?? '',
      handler: c.claimHandling?.handler?.name ?? c.handler ?? '',
      submittedAt,
      status: statusName,
      statusId,
      daysOpen,
    }
  })

  const snapshot: WarrantySnapshot = {
    fetchedAt: new Date().toISOString(),
    summary,
    claims,
  }

  await saveSnapshot(snapshot)

  return NextResponse.json({ ok: true, total: claims.length, fetchedAt: snapshot.fetchedAt })
}
