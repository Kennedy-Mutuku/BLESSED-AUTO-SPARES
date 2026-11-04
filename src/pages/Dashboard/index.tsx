import { useNavigate } from 'react-router-dom'
import { BarChart2, AlertTriangle, FileText, Menu, X, Settings, Lock,
         Cloud, CloudOff, CheckCircle2, Upload, RefreshCw, AlertCircle, WifiOff } from 'lucide-react'
import { useState } from 'react'
import { useDashboardStats } from '@/hooks/useDashboardStats'
import { useStockAlerts } from '@/hooks/useStockAlerts'
import { useSettings } from '@/hooks/useLocalSettings'
import { formatCurrency } from '@/lib/utils'
import { useSyncStatus } from '@/hooks/useSyncStatus'
import logoImg from '@/assets/logo.png'
import carouselImg from '@/assets/carousel 1.jpg'
import dominionLogo from '@/assets/dominion softwares main logo.png'

// ── Sync Button ───────────────────────────────────────────────────────────────

function SyncButton() {
  const { state, progress, pendingCount, lastSyncAt, errorMsg, isOnline, isConfigured, sync } = useSyncStatus()
  const [showPanel, setShowPanel] = useState(false)

  // Visual config per state
  const cfg = {
    syncing:      { icon: RefreshCw,    iconCls: 'animate-spin text-blue-200',  pillCls: 'bg-blue-500/30 border-blue-400/40',   label: `${progress}%`,                dot: 'bg-blue-400' },
    synced:       { icon: CheckCircle2, iconCls: 'text-green-300',              pillCls: 'bg-green-500/25 border-green-400/40', label: '100%',                         dot: 'bg-green-400' },
    pending:      { icon: Upload,       iconCls: 'text-amber-200',              pillCls: 'bg-amber-500/25 border-amber-400/40', label: `${pendingCount} pending`,       dot: 'bg-amber-400 animate-pulse' },
    error:        { icon: AlertCircle,  iconCls: 'text-red-300',                pillCls: 'bg-red-500/25 border-red-400/40',     label: 'Retry',                        dot: 'bg-red-400' },
    offline:      { icon: WifiOff,      iconCls: 'text-slate-300',              pillCls: 'bg-white/10 border-white/20',         label: 'Offline',                      dot: 'bg-slate-400' },
    unconfigured: { icon: Cloud,        iconCls: 'text-white/40',               pillCls: 'bg-white/10 border-white/20',         label: 'No server',                    dot: 'bg-white/30' },
  }[state]

  const Icon      = cfg.icon
  const lastLabel = lastSyncAt
    ? new Date(lastSyncAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Never'

  const syncPct = state === 'synced' ? 100 : state === 'syncing' ? progress : 0

  return (
    <div className="relative">
      {/* ── Compact pill button in header ── */}
      <button
        onClick={() => setShowPanel(v => !v)}
        className={`flex items-center gap-1.5 h-8 px-2.5 rounded-full border transition-all touch-manipulation ${cfg.pillCls}`}
        aria-label="Sync status"
      >
        <Icon className={`w-3.5 h-3.5 shrink-0 ${cfg.iconCls}`} />
        <span className="text-[11px] font-semibold text-white/90 leading-none whitespace-nowrap">
          {cfg.label}
        </span>
        {/* Live dot */}
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
      </button>

      {/* ── Detail panel (dropdown below button) ── */}
      {showPanel && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setShowPanel(false)} />

          <div className="absolute right-0 top-10 z-50 w-72 bg-slate-900 rounded-2xl shadow-2xl border border-white/10 overflow-hidden">

            {/* Header */}
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                <span className="text-white font-bold text-[13px]">Cloud Sync</span>
              </div>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                state === 'synced'  ? 'bg-green-500/20 text-green-300' :
                state === 'pending' ? 'bg-amber-500/20 text-amber-300' :
                state === 'syncing' ? 'bg-blue-500/20 text-blue-300'   :
                state === 'error'   ? 'bg-red-500/20 text-red-300'     :
                'bg-white/10 text-white/50'
              }`}>
                {state === 'synced'       ? 'In Sync'        :
                 state === 'pending'      ? `${pendingCount} pending` :
                 state === 'syncing'      ? 'Syncing…'       :
                 state === 'error'        ? 'Failed'         :
                 state === 'offline'      ? 'Offline'        :
                 'Not configured'}
              </span>
            </div>

            {/* Progress bar (syncing or synced) */}
            {(state === 'syncing' || state === 'synced') && (
              <div className="px-4 pt-3">
                <div className="flex justify-between text-[11px] text-white/50 mb-1.5">
                  <span>Upload progress</span>
                  <span className="text-white font-semibold">{syncPct}%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      state === 'synced' ? 'bg-green-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${syncPct}%` }}
                  />
                </div>
              </div>
            )}

            {/* Stats grid */}
            <div className="px-4 py-3 grid grid-cols-2 gap-2">
              <div className="bg-white/5 rounded-xl px-3 py-2.5">
                <p className="text-[9px] text-white/40 uppercase tracking-wider font-semibold mb-0.5">Pending</p>
                <p className={`text-[16px] font-black ${pendingCount > 0 ? 'text-amber-300' : 'text-green-300'}`}>
                  {pendingCount}
                </p>
                <p className="text-[9px] text-white/30">items to sync</p>
              </div>
              <div className="bg-white/5 rounded-xl px-3 py-2.5">
                <p className="text-[9px] text-white/40 uppercase tracking-wider font-semibold mb-0.5">Last Sync</p>
                <p className="text-[13px] font-black text-white/80">{lastLabel}</p>
                <p className="text-[9px] text-white/30">{isOnline ? 'Online' : 'Offline'}</p>
              </div>
            </div>

            {/* Error message */}
            {state === 'error' && errorMsg && (
              <div className="mx-4 mb-3 bg-red-500/15 border border-red-500/30 rounded-xl px-3 py-2.5">
                <p className="text-[11px] text-red-300 leading-relaxed">{errorMsg}</p>
              </div>
            )}

            {/* Unconfigured help */}
            {state === 'unconfigured' && (
              <div className="mx-4 mb-3 bg-white/5 rounded-xl px-3 py-2.5">
                <p className="text-[11px] text-white/50 leading-relaxed">
                  Set <span className="text-white/80 font-mono text-[10px]">VITE_API_URL</span> in your{' '}
                  <span className="text-white/80 font-mono text-[10px]">.env</span> file to enable cloud sync.
                </p>
              </div>
            )}

            {/* Sync Now button */}
            {(state === 'pending' || state === 'error') && (
              <div className="px-4 pb-4">
                <button
                  onClick={() => { sync(); setShowPanel(false) }}
                  className="w-full h-10 bg-red-600 hover:bg-red-500 rounded-xl text-white text-[13px] font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Sync {pendingCount > 0 ? `${pendingCount} items` : 'Now'}
                </button>
              </div>
            )}

            {state === 'syncing' && (
              <div className="px-4 pb-4">
                <div className="w-full h-10 bg-blue-600/30 rounded-xl text-blue-300 text-[13px] font-semibold flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Syncing… {progress}%
                </div>
              </div>
            )}

            {state === 'synced' && (
              <div className="px-4 pb-4">
                <div className="w-full h-10 bg-green-600/20 rounded-xl text-green-300 text-[13px] font-semibold flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Fully in sync — 100%
                </div>
              </div>
            )}

            {state === 'offline' && (
              <div className="px-4 pb-4">
                <div className="w-full h-10 bg-white/5 rounded-xl text-white/40 text-[13px] font-semibold flex items-center justify-center gap-2">
                  <CloudOff className="w-4 h-4" />
                  Will sync when online
                </div>
              </div>
            )}

          </div>
        </>
      )}
    </div>
  )
}

export function DashboardPage() {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const { data: stats } = useDashboardStats()
  const { data: alerts } = useStockAlerts()
  const { data: settings } = useSettings()

  const currency = settings?.currencySymbol ?? 'KES'
  const shopName = settings?.shopName ?? 'Blessed Auto Spares'

  const menuItems = [
    { icon: FileText,      label: 'Sales Log',    path: '/sales' },
    { icon: AlertTriangle, label: 'Stock Alerts', path: '/alerts', badge: alerts?.totalAlerts },
    { icon: BarChart2,     label: 'Reports',      path: '/reports' },
    { icon: Settings,      label: 'Settings',     path: '/settings' },
  ]

  return (
    <div className="h-dvh bg-white flex flex-col overflow-hidden">

      {/* ── HEADER ── */}
      <div className="flex items-center justify-between px-5 py-3 bg-red-600 shadow-md shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden shadow-sm shrink-0">
            <img src={logoImg} alt="logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="text-[17px] font-black tracking-wide text-white uppercase leading-none drop-shadow-sm">
              {shopName}
            </p>
            <p className="text-[9px] text-red-100 tracking-widest uppercase mt-0.5 font-semibold">
              AUTO PARTS &amp; ACCESSORIES
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <SyncButton />
          <button
            onClick={() => setMenuOpen(true)}
            className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors shrink-0"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* ── HERO IMAGE ── */}
      <div className="flex items-center justify-center px-6 py-1" style={{ height: 'clamp(165px, 34vh, 250px)' }}>
        <img
          src={carouselImg}
          alt="Auto mechanic"
          className="h-full w-auto max-w-full object-contain"
        />
      </div>

      {/* ── BOTTOM BLOCK — fixed height content ── */}
      <div className="shrink-0 px-5 pb-4 space-y-2.5">

        {/* Headline */}
        <div className="text-center">
          <h1 className="text-[22px] font-extrabold text-slate-900 leading-tight tracking-tight">
            Your Auto Spares
          </h1>
          <h1 className="text-[22px] font-extrabold text-red-600 leading-tight tracking-tight">
            At Your Fingertips
          </h1>
          <p className="text-slate-400 text-[11px] mt-1">
            Manage stock &middot; Process sales &middot; Track profit
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden">
          <div className="text-center px-3 py-2 border-r border-b border-slate-200">
            <div className="text-[12px] font-bold text-slate-900 tabular-nums leading-tight">
              {formatCurrency(stats?.todayRevenue ?? 0, currency)}
            </div>
            <div className="text-[9px] uppercase tracking-wide text-slate-400 mt-0.5">Today's Revenue</div>
          </div>
          <div className="text-center px-3 py-2 border-b border-slate-200">
            <div className="text-[12px] font-bold text-green-600 tabular-nums leading-tight">
              {formatCurrency(stats?.todayProfit ?? 0, currency)}
            </div>
            <div className="text-[9px] uppercase tracking-wide text-slate-400 mt-0.5">Today's Profit</div>
          </div>
          <div className="text-center px-3 py-2 border-r border-b border-slate-200">
            <div className="text-[12px] font-bold text-slate-900 tabular-nums leading-tight">
              {stats?.todaySalesCount ?? 0}
            </div>
            <div className="text-[9px] uppercase tracking-wide text-slate-400 mt-0.5">Today's Sales</div>
          </div>
          <div className="text-center px-3 py-2 border-b border-slate-200">
            <div className="text-[12px] font-bold text-blue-600 tabular-nums leading-tight">
              {formatCurrency(stats?.totalStockWorth ?? 0, currency)}
            </div>
            <div className="text-[9px] uppercase tracking-wide text-slate-400 mt-0.5">Stock Worth</div>
          </div>
          <div className="col-span-2 text-center px-3 py-2 bg-emerald-50 border-t border-emerald-100">
            <div className="text-[13px] font-extrabold text-emerald-700 tabular-nums leading-tight">
              {formatCurrency(stats?.expectedProfit ?? 0, currency)}
            </div>
            <div className="text-[9px] uppercase tracking-wide text-emerald-500 mt-0.5">Expected Profit if All Stock Sold</div>
          </div>
        </div>

        {/* Low stock alert */}
        {(alerts?.totalAlerts ?? 0) > 0 && (
          <button
            onClick={() => navigate('/alerts')}
            className="w-full flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-left"
          >
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="text-xs text-amber-700">
              <strong>{alerts?.totalAlerts}</strong> item{alerts?.totalAlerts !== 1 ? 's' : ''} need restocking
            </span>
            <span className="ml-auto text-xs text-amber-500">View &#8594;</span>
          </button>
        )}

        {/* SELL NOW */}
        <button
          onClick={() => navigate('/pos')}
          className="w-full h-12 rounded-2xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-[15px] font-bold shadow-md active:scale-[0.98] transition-all touch-manipulation"
        >
          SELL NOW
        </button>

        {/* STOCK ENTRY */}
        <button
          onClick={() => navigate('/inventory')}
          className="w-full h-12 rounded-2xl bg-slate-900 hover:bg-slate-800 active:bg-slate-700 text-white text-[15px] font-bold shadow-md active:scale-[0.98] transition-all touch-manipulation"
        >
          STOCK ENTRY
        </button>

        {/* Powered by footer */}
        <div className="border-t border-slate-100 pt-2 flex justify-center">
          <a
            href="https://dominionsoftwares.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg hover:bg-slate-50 transition-colors group"
          >
            <span className="text-[9px] text-slate-400 uppercase tracking-widest font-medium">
              Powered by
            </span>
            <img
              src={dominionLogo}
              alt="Dominion Softwares"
              className="h-5 w-auto object-contain"
            />
            <span className="text-[10px] font-bold text-slate-500 group-hover:text-slate-700 tracking-wide">
              Dominion Softwares
            </span>
          </a>
        </div>

      </div>

      {/* ── DROPDOWN MENU ── */}
      {menuOpen && (
        <div className="fixed inset-0 z-50" onClick={() => setMenuOpen(false)}>
          <div className="absolute inset-0 bg-black/20" />

          {/* Card — flush right, exactly below the header */}
          <div
            className="absolute top-16 right-0 w-52 bg-white shadow-2xl border-l border-b border-slate-200 rounded-bl-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Nav items — no header, straight to the point */}
            <nav>
              {menuItems.map((item, i) => (
                <button
                  key={item.path}
                  onClick={() => { navigate(item.path); setMenuOpen(false) }}
                  className={`w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-red-50 text-left transition-colors ${i > 0 ? 'border-t border-slate-100' : ''}`}
                >
                  <item.icon className="w-4 h-4 text-red-500 shrink-0" />
                  <span className="text-[13px] font-semibold text-slate-800">{item.label}</span>
                  {item.badge != null && item.badge > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none">
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
              {/* Lock Screen */}
              <button
                onClick={() => { setMenuOpen(false); window.dispatchEvent(new CustomEvent('app:lock')) }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 border-t border-slate-200 hover:bg-red-50 text-left transition-colors"
              >
                <Lock className="w-4 h-4 text-red-500 shrink-0" />
                <span className="text-[13px] font-semibold text-slate-800">Lock Screen</span>
              </button>
              {/* Close row */}
              <button
                onClick={() => setMenuOpen(false)}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 border-t border-slate-100 hover:bg-slate-50 transition-colors"
              >
                <X className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-[13px] font-medium text-slate-400">Close</span>
              </button>
            </nav>
          </div>
        </div>
      )}
    </div>
  )
}
