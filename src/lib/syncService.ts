import { db } from '@/db/database'
import { api } from './api'

export interface SyncState {
  isSyncing: boolean
  pct: number          // 0-100
  lastSyncAt: number | null
  error: string | null
}

const TABLES = ['products', 'categories', 'sales', 'stockHistory', 'settings'] as const

/** Count every local record across all Dexie tables */
export async function countLocalRecords(): Promise<number> {
  const counts = await Promise.all([
    db.products.count(),
    db.categories.count(),
    db.sales.count(),
    db.stockHistory.count(),
    db.settings.count(),
  ])
  return counts.reduce((a, b) => a + b, 0)
}

/** Pull the last successful sync timestamp from Dexie */
export async function getLastSyncAt(): Promise<number | null> {
  const row = await db.settings.get('lastSyncAt')
  return row ? parseInt(row.value, 10) : null
}

/**
 * Push all local Dexie records to the server in batches of 200.
 * Returns the number of records the server accepted.
 */
export async function pushToCloud(
  onProgress?: (pct: number) => void,
): Promise<number> {
  const tokenRow = await db.settings.get('authToken')
  if (!tokenRow?.value) throw new Error('Not authenticated')

  type SyncPayload = { table: string; localId: string; data: unknown; clientTs: number }
  const records: SyncPayload[] = []

  for (const table of TABLES) {
    const items: any[] = await (db as any)[table].toArray()
    for (const item of items) {
      records.push({
        table,
        localId:  String(item.id ?? item.key),
        data:     item,
        clientTs: item.updatedAt ?? item.createdAt ?? Date.now(),
      })
    }
  }

  if (records.length === 0) {
    await db.settings.put({ key: 'lastSyncAt', value: String(Date.now()) })
    return 0
  }

  const BATCH = 200
  let synced = 0
  for (let i = 0; i < records.length; i += BATCH) {
    const batch = records.slice(i, i + BATCH)
    const res   = await api.post<{ synced: number }>('/api/sync/push', { records: batch })
    synced += res.synced
    onProgress?.(Math.min(99, Math.round(((i + batch.length) / records.length) * 100)))
  }

  onProgress?.(100)
  await db.settings.put({ key: 'lastSyncAt', value: String(Date.now()) })
  return synced
}

/**
 * Pull records from the server that changed since the last sync
 * and apply them to Dexie (last-write-wins).
 */
export async function pullFromCloud(): Promise<void> {
  const since = await getLastSyncAt()
  const res   = await api.get<{ records: any[]; serverTime: number }>(
    `/api/sync/pull?since=${since ?? 0}`
  )

  for (const record of res.records) {
    const table = record.table as typeof TABLES[number]
    if (!TABLES.includes(table)) continue
    const tbl = (db as any)[table]
    if (record.deletedAt) {
      await tbl.delete(record.localId).catch(() => null)
    } else if (record.data) {
      await tbl.put(record.data).catch(() => null)
    }
  }
}
