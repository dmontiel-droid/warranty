'use client'

import { useState, useMemo } from 'react'
import { WarrantySnapshot, ClaimEntry } from '@/lib/kv'
import { format, parseISO } from 'date-fns'

const STATUS_COLOR: Record<string, string> = {
  'Not Handled': '#e0874a',
  'Open': '#e8c547',
  'Closed': '#4aae7f',
  'Denied': '#e05a4a',
  'New Info': '#5a9ae0',
}

const THRESHOLD_DAYS = 7

function Badge({ status }: { status: string }) {
  const color = STATUS_COLOR[status] ?? '#888'
  return (
    <span style={{
      background: `${color}18`,
      color,
      border: `1px solid ${color}44`,
      padding: '2px 8px',
      borderRadius: '2px',
      fontSize: '11px',
      fontWeight: 600,
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
      whiteSpace: 'nowrap',
    }}>
      {status}
    </span>
  )
}

function StatCard({ label, value, color, sub }: { label: string; value: number; color: string; sub?: string }) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: `1px solid var(--border)`,
      borderTop: `2px solid ${color}`,
      padding: '20px 24px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontSize: '36px', fontFamily: 'var(--font-display)', color, lineHeight: 1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 6 }}>{sub}</div>}
      <div style={{
        position: 'absolute', bottom: 0, right: 0,
        width: 60, height: 60,
        background: `${color}08`,
        borderRadius: '60px 0 0 0',
      }} />
    </div>
  )
}

export default function DashboardClient({ snapshot }: { snapshot: WarrantySnapshot | null }) {
  const [activeStatus, setActiveStatus] = useState<string>('All')
  const [sortBy, setSortBy] = useState<'submittedAt' | 'daysOpen' | 'status'>('daysOpen')
  const [onlyOverThreshold, setOnlyOverThreshold] = useState(false)
  const [search, setSearch] = useState('')

  const statuses = ['All', 'Not Handled', 'Open', 'Closed', 'Denied', 'New Info']

  const filtered = useMemo(() => {
    if (!snapshot) return []
    let list = snapshot.claims
    if (activeStatus !== 'All') list = list.filter(c => c.status === activeStatus)
    if (onlyOverThreshold) list = list.filter(c => (c.daysOpen ?? 0) >= THRESHOLD_DAYS)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(c =>
        c.prefixedId.toLowerCase().includes(q) ||
        c.claimantName.toLowerCase().includes(q) ||
        c.incidentType.toLowerCase().includes(q) ||
        c.handler.toLowerCase().includes(q)
      )
    }
    return [...list].sort((a, b) => {
      if (sortBy === 'daysOpen') return (b.daysOpen ?? 0) - (a.daysOpen ?? 0)
      if (sortBy === 'submittedAt') return (b.submittedAt ?? '').localeCompare(a.submittedAt ?? '')
      return a.status.localeCompare(b.status)
    })
  }, [snapshot, activeStatus, onlyOverThreshold, search, sortBy])

  const overThreshold = snapshot?.claims.filter(c => (c.daysOpen ?? 0) >= THRESHOLD_DAYS).length ?? 0
  const openClaims = snapshot?.summary['Open'] ?? 0

  if (!snapshot) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: '11px', letterSpacing: '0.2em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
          No data ingested yet
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Run the shortcut or POST to <code style={{ color: 'var(--accent)' }}>/api/ingest</code>
        </div>
      </div>
    )
  }

  const fetchedLabel = snapshot.fetchedAt
    ? format(parseISO(snapshot.fetchedAt), 'MMM d, yyyy · HH:mm')
    : '—'

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 24px' }}>

      {/* Header */}
      <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 24, marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: '11px', letterSpacing: '0.2em', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 6 }}>
            Kanguro · Pet Claims
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', letterSpacing: '-0.01em', lineHeight: 1 }}>
            Warranty Claims
          </h1>
        </div>
        <div style={{ textAlign: 'right', fontSize: '11px', color: 'var(--text-muted)' }}>
          <div style={{ marginBottom: 2 }}>LAST SYNC</div>
          <div style={{ color: 'var(--text)', fontWeight: 500 }}>{fetchedLabel}</div>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 32 }}>
        <StatCard label="Total" value={snapshot.summary['Total'] ?? 0} color="#e8c547" />
        <StatCard label="Open" value={openClaims} color={STATUS_COLOR['Open']} />
        <StatCard label="Not Handled" value={snapshot.summary['Not Handled'] ?? 0} color={STATUS_COLOR['Not Handled']} />
        <StatCard label="New Info" value={snapshot.summary['New Info'] ?? 0} color={STATUS_COLOR['New Info']} />
        <StatCard label="Closed" value={snapshot.summary['Closed'] ?? 0} color={STATUS_COLOR['Closed']} />
        <StatCard label="Denied" value={snapshot.summary['Denied'] ?? 0} color={STATUS_COLOR['Denied']} />
        <StatCard label={`≥${THRESHOLD_DAYS} Days Open`} value={overThreshold} color="#e05a4a" sub="need attention" />
      </div>

      {/* Filters bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16, alignItems: 'center' }}>
        {/* Status tabs */}
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {statuses.map(s => (
            <button key={s} onClick={() => setActiveStatus(s)} style={{
              background: activeStatus === s ? (STATUS_COLOR[s] ?? 'var(--accent)') : 'var(--surface)',
              color: activeStatus === s ? '#000' : 'var(--text-muted)',
              border: `1px solid ${activeStatus === s ? (STATUS_COLOR[s] ?? 'var(--accent)') : 'var(--border)'}`,
              padding: '5px 12px',
              fontSize: '11px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              borderRadius: '2px',
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
              transition: 'all 0.15s',
            }}>
              {s} {s !== 'All' && snapshot.summary[s] !== undefined ? `(${snapshot.summary[s]})` : ''}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, minWidth: 200 }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search ID, name, incident, handler…"
            style={{
              width: '100%',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              padding: '6px 12px',
              fontSize: '12px',
              fontFamily: 'var(--font-mono)',
              borderRadius: '2px',
              outline: 'none',
            }}
          />
        </div>

        <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          color: 'var(--text)', padding: '6px 10px', fontSize: '11px',
          fontFamily: 'var(--font-mono)', borderRadius: '2px', cursor: 'pointer',
        }}>
          <option value="daysOpen">Sort: Days Open</option>
          <option value="submittedAt">Sort: Submitted</option>
          <option value="status">Sort: Status</option>
        </select>

        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '11px', color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none' }}>
          <input
            type="checkbox"
            checked={onlyOverThreshold}
            onChange={e => setOnlyOverThreshold(e.target.checked)}
            style={{ accentColor: 'var(--red)' }}
          />
          Only ≥{THRESHOLD_DAYS} days
        </label>
      </div>

      {/* Count */}
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: 12, letterSpacing: '0.05em' }}>
        {filtered.length} claim{filtered.length !== 1 ? 's' : ''} shown
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['REF', 'CLAIMANT', 'INCIDENT TYPE', 'HANDLER', 'SUBMITTED', 'DAYS OPEN', 'STATUS'].map(h => (
                <th key={h} style={{
                  padding: '8px 12px', textAlign: 'left', fontSize: '10px',
                  letterSpacing: '0.12em', color: 'var(--text-muted)', fontWeight: 600,
                  whiteSpace: 'nowrap',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((c, i) => {
              const isAlert = (c.daysOpen ?? 0) >= THRESHOLD_DAYS && (c.statusId === 0 || c.statusId === 1 || c.statusId === 4)
              return (
                <tr key={c.prefixedId + i} style={{
                  borderBottom: '1px solid var(--border)',
                  background: isAlert ? 'rgba(224,90,74,0.04)' : 'transparent',
                  transition: 'background 0.1s',
                }}>
                  <td style={{ padding: '10px 12px', color: 'var(--accent)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {c.prefixedId}
                  </td>
                  <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>{c.claimantName || '—'}</td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-muted)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.incidentType || '—'}
                  </td>
                  <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>{c.handler || '—'}</td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {c.submittedAt ? format(parseISO(c.submittedAt), 'MMM d, yyyy') : '—'}
                  </td>
                  <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                    {c.daysOpen !== undefined ? (
                      <span style={{
                        color: isAlert ? 'var(--red)' : c.daysOpen >= 3 ? 'var(--orange)' : 'var(--text)',
                        fontWeight: isAlert ? 700 : 400,
                      }}>
                        {isAlert && '⚠ '}{c.daysOpen}d
                      </span>
                    ) : '—'}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <Badge status={c.status} />
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                  No claims match current filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div style={{ marginTop: 40, paddingTop: 16, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
        <span>KANGURO SEGURO · WARRANTY MONITORING · CLAIM TYPE 1 · LABEL ID 29</span>
        <span>THRESHOLD: {THRESHOLD_DAYS} DAYS</span>
      </div>
    </div>
  )
}
