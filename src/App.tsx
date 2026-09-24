import { useState, useEffect, useRef, useCallback } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppShell } from '@/components/layout/AppShell'
import { DashboardPage } from '@/pages/Dashboard'
import { InventoryPage } from '@/pages/Inventory'
import { POSPage } from '@/pages/POS'
import { SalesLogPage } from '@/pages/SalesLog'
import { StockAlertsPage } from '@/pages/StockAlerts'
import { ReportsPage } from '@/pages/Reports'
import { PinLock } from '@/components/PinLock'
import { db } from '@/db/database'
import { seedRealInventory } from '@/lib/seedData'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      retry: 1,
    },
  },
})

const INACTIVITY_MS = 60_000 // 1 minute

function AppRoutes({ unlocked }: { unlocked: boolean }) {
  const navigate = useNavigate()
  const prevUnlocked = useRef(false)
  useEffect(() => {
    if (unlocked && !prevUnlocked.current) {
      navigate('/', { replace: true })
    }
    prevUnlocked.current = unlocked
  }, [unlocked, navigate])

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/pos" element={<POSPage />} />
        <Route path="/sales" element={<SalesLogPage />} />
        <Route path="/alerts" element={<StockAlertsPage />} />
        <Route path="/reports" element={<ReportsPage />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  const [unlocked, setUnlocked] = useState(false)
  const [dbReady, setDbReady] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Ensure real product catalog is in the database before rendering
  useEffect(() => {
    async function initCatalog() {
      await db.open()
      const count = await db.products.count()
      if (count === 0) {
        await seedRealInventory()
      }
      setDbReady(true)
    }
    initCatalog()
  }, [])

  const lock = useCallback(() => setUnlocked(false), [])

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(lock, INACTIVITY_MS)
  }, [lock])

  // Start / reset inactivity timer on any user activity
  useEffect(() => {
    if (!unlocked) return
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click']
    events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }))
    resetTimer()
    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer))
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [unlocked, resetTimer])

  // Lock immediately when the tab/app is hidden
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') lock()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [lock])

  if (!dbReady) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Loading catalog…</span>
        </div>
      </div>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      {!unlocked && <PinLock onUnlock={() => setUnlocked(true)} />}
      <div className={!unlocked ? 'blur-sm pointer-events-none select-none' : ''}>
        <BrowserRouter>
          <AppRoutes unlocked={unlocked} />
        </BrowserRouter>
      </div>
    </QueryClientProvider>
  )
}
