import { useState, useEffect, useRef, useCallback } from 'react'
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { App as CapApp } from '@capacitor/app'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppShell } from '@/components/layout/AppShell'
import { UpdateBanner } from '@/components/shared/UpdateBanner'
import { DashboardPage } from '@/pages/Dashboard'
import { InventoryPage } from '@/pages/Inventory'
import { POSPage } from '@/pages/POS'
import { SalesLogPage } from '@/pages/SalesLog'
import { StockAlertsPage } from '@/pages/StockAlerts'
import { ReportsPage } from '@/pages/Reports'
import { SettingsPage } from '@/pages/Settings'
import { PinLock } from '@/components/PinLock'
import { LoginScreen } from '@/components/LoginScreen'
import { LandingPage } from '@/pages/Landing'
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
  const location = useLocation()
  const prevUnlocked = useRef(false)

  useEffect(() => {
    if (unlocked && !prevUnlocked.current) {
      navigate('/', { replace: true })
    }
    prevUnlocked.current = unlocked
  }, [unlocked, navigate])

  // Android hardware back button
  useEffect(() => {
    const listener = CapApp.addListener('backButton', () => {
      if (location.pathname === '/') {
        CapApp.exitApp()
      } else {
        navigate(-1)
      }
    })
    return () => { listener.then(h => h.remove()) }
  }, [location.pathname, navigate])

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/pos" element={<POSPage />} />
        <Route path="/sales" element={<SalesLogPage />} />
        <Route path="/alerts" element={<StockAlertsPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  const [unlocked, setUnlocked]           = useState(false)
  const [dbReady, setDbReady]             = useState(false)
  const [showLanding, setShowLanding]     = useState(true)   // landing page shown on first load
  const [showPin, setShowPin]             = useState(false)  // PIN shown after clicking Login
  // showCloudLink: shown once after PIN unlock when user has no cloud account yet
  const [showCloudLink, setShowCloudLink] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Ensure real product catalog is in the database before rendering.
  useEffect(() => {
    let cancelled = false
    async function initCatalog() {
      await db.open()
      const seeded = await db.settings.get('catalogSeeded')
      if (!seeded) {
        const existingCount = await db.products.count()
        if (existingCount === 0) {
          await db.settings.put({ key: 'catalogSeeded', value: '1' })
          await seedRealInventory()
        } else {
          await db.settings.put({ key: 'catalogSeeded', value: '1' })
        }
      }
      if (!cancelled) setDbReady(true)
    }
    initCatalog()
    return () => { cancelled = true }
  }, [])

  /** After PIN unlock, decide whether to prompt for email setup */
  async function handleUnlock() {
    setUnlocked(true)
    const emailRow = await db.settings.get('authEmail')
    if (emailRow?.value) return // email already saved, never ask again

    // Check snooze — don't nag if user dismissed within the last 24 h
    const snoozeRow = await db.settings.get('cloudLinkSnoozedUntil')
    const snoozedUntil = snoozeRow ? parseInt(snoozeRow.value, 10) : 0
    if (Date.now() < snoozedUntil) return

    setShowCloudLink(true)
  }

  const lock = useCallback(() => setUnlocked(false), [])

  // Allow any page to trigger a lock via: window.dispatchEvent(new CustomEvent('app:lock'))
  useEffect(() => {
    const handler = () => { lock(); setShowPin(true); setShowLanding(false) }
    window.addEventListener('app:lock', handler)
    return () => window.removeEventListener('app:lock', handler)
  }, [lock])

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

  // Landing page on first visit — user hasn't clicked Login yet
  if (showLanding && !unlocked) {
    return (
      <LandingPage onLogin={() => { setShowLanding(false); setShowPin(true) }} />
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      {/* PIN screen — shown after clicking Login or when locked by inactivity */}
      {(!unlocked && showPin) && <PinLock onUnlock={handleUnlock} />}

      {/* Email setup prompt — one-time, shown after first unlock */}
      {unlocked && showCloudLink && (
        <LoginScreen onAuth={() => setShowCloudLink(false)} />
      )}

      <div className={!unlocked ? 'blur-sm pointer-events-none select-none' : ''}>
        <BrowserRouter>
          <AppRoutes unlocked={unlocked} />
        </BrowserRouter>
      </div>
      <UpdateBanner />
    </QueryClientProvider>
  )
}
