import { getLatestSnapshot } from '@/lib/kv'
import DashboardClient from '@/components/DashboardClient'

export const revalidate = 0

export default async function Home() {
  const snapshot = await getLatestSnapshot()
  return <DashboardClient snapshot={snapshot} />
}
