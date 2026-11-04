import { useState, useEffect, useCallback, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { db } from '@/db/database'
import { pushToCloud, pullFromCloud } from '@/lib/syncService'

export type SyncState =
  | 'syncing'
  | 'synced'      // 0 pending after last sync
  | 'pending'     // items waiting to be pushed
  | 'error'
  | 'offline'
  | 'unconfigured'

// A real server URL means anything that isn't localhost / 127.0.0.1 / empty
const RAW_BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')
export const SYNC_CONFIGURED =
  !!RAW_BASE &&
  !RAW_BASE.includes('localhost') &&
  !RAW_BASE.includes('127.0.0.1')

// ── count local records not yet pushed to the server ─────────────────────────
async function countPending(): Promise<number> {
  const row      = await db.settings.get('lastSyncAt')
  const lastSync = row ? parseInt(row.value, 10) : 0

  const [p, s, c, h] = await Promise.all([
    db.products.filter(x =>
      Math.max(x.updatedAt ?? 0, x.createdAt ?? 0) > lastSync
    ).count(),
    db.sales.filter(x => x.soldAt > lastSync).count(),
    db.categories.filter(x => x.createdAt > lastSync).count(),
    db.stockHistory.filter(x => x.createdAt > lastSync).count(),
  ])

  return p + s + c + h
}

// ─────────────────────────────────────────────────────────────────────────────
export function useSyncStatus() {
  const qc          = useQueryClient()
  const syncingRef  = useRef(false)

  const [state,      setState]      = useState<SyncState>('pending')
  const [progress,   setProgress]   = useState(0)
  const [errorMsg,   setErrorMsg]   = useState('')
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(null)
  const [isOnline,   setIsOnline]   = useState(navigator.onLine)

  // Load last sync timestamp once on mount
  useEffect(() => {
    db.settings.get('lastSyncAt').then(row => {
      if (row?.value) setLastSyncAt(parseInt(row.value, 10))
    })
  }, [])

  // Track online / offline
  useEffect(() => {
    const goOn  = () => setIsOnline(true)
    const goOff = () => setIsOnline(false)
    window.addEventListener('online',  goOn)
    window.addEventListener('offline', goOff)
    return () => {
      window.removeEventListener('online',  goOn)
      window.removeEventListener('offline', goOff)
    }
  }, [])

  // Live pending count — refetched every 30 s and after any sync
  const { data: pendingCount = 0, refetch: refetchPending } = useQuery({
    queryKey:       ['sync-pending'],
    queryFn:        countPending,
    refetchInterval: 30_000,
  })

  // ── core sync function ────────────────────────────────────────────────────
  const sync = useCallback(async () => {
    if (syncingRef.current) return
    if (!SYNC_CONFIGURED) { setState('unconfigured'); return }
    if (!navigator.onLine) { setState('offline');      return }

    // Need a JWT token (saved after cloud account link in LoginScreen)
    const tokenRow = await db.settings.get('authToken')
    if (!tokenRow?.value) { setState('unconfigured'); return }

    syncingRef.current = true
    setState('syncing')
    setProgress(0)
    setErrorMsg('')

    try {
      // Push local → server  (0 – 80 %)
      await pushToCloud(pct => setProgress(Math.round(pct * 0.8)))
      setProgress(85)
      // Pull server → local  (80 – 100 %)
      await pullFromCloud()
      setProgress(100)

      const now = Date.now()
      setLastSyncAt(now)
      setState('synced')
      await refetchPending()
      qc.invalidateQueries()

      // Fade back to "synced/pending" state after showing 100 %
      setTimeout(() => {
        setState(prev => prev === 'synced' ? 'synced' : prev)
        setProgress(0)
      }, 2500)

    } catch (err: any) {
      setErrorMsg(err.message || 'Sync failed')
      setState('error')
      setProgress(0)
    } finally {
      syncingRef.current = false
    }
  }, [qc, refetchPending])

  // Auto-sync when device comes back online
  useEffect(() => {
    if (isOnline && SYNC_CONFIGURED) sync()
  // Only fire when online status changes — not on every render
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline])

  // Auto-sync every 5 minutes while the app is open and online
  useEffect(() => {
    if (!SYNC_CONFIGURED) return
    const id = setInterval(() => { if (navigator.onLine) sync() }, 5 * 60 * 1000)
    return () => clearInterval(id)
  }, [sync])

  // ── derive final display state ────────────────────────────────────────────
  const displayState: SyncState =
    !SYNC_CONFIGURED           ? 'unconfigured' :
    state === 'unconfigured'   ? 'unconfigured' :
    !isOnline                  ? 'offline'      :
    state === 'syncing'        ? 'syncing'      :
    state === 'error'          ? 'error'        :
    pendingCount > 0           ? 'pending'      :
                                 'synced'

  return {
    state: displayState,
    progress,
    pendingCount,
    lastSyncAt,
    errorMsg,
    isOnline,
    isConfigured: SYNC_CONFIGURED,
    sync,
  }
}
