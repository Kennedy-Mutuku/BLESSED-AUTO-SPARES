import { useNavigate } from 'react-router-dom'
import { BarChart2, AlertTriangle, FileText, Settings, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useDashboardStats } from '@/hooks/useDashboardStats'
import { useStockAlerts } from '@/hooks/useStockAlerts'
import { useSettings } from '@/hooks/useLocalSettings'
import { formatCurrency } from '@/lib/utils'

// ── Inline SVG car illustration ─────────────────────────────────────────────
function CarIllustration() {
  return (
    <svg viewBox="0 0 320 200" className="w-full max-w-sm" xmlns="http://www.w3.org/2000/svg">
      {/* Background glow */}
      <ellipse cx="160" cy="110" rx="148" ry="96" fill="#eff6ff" />

      {/* Ground shadow */}
      <ellipse cx="155" cy="170" rx="118" ry="9" fill="#dbeafe" opacity="0.6" />

      {/* ── CAR BODY ── */}
      {/* Door / lower body */}
      <path d="M48 118 L48 152 Q48 156 53 156 L265 156 Q270 156 270 152 L270 118 Z" fill="#2563eb" />

      {/* Roof + cabin area */}
      <path d="M83 118 L100 76 L222 76 L242 118 Z" fill="#3b82f6" />

      {/* Windshield */}
      <path d="M203 118 L223 80 L241 80 L241 118 Z" fill="#bfdbfe" opacity="0.85" />

      {/* Middle door window */}
      <path d="M149 80 L200 80 L200 118 L149 118 Z" fill="#93c5fd" opacity="0.75" />

      {/* Rear window */}
      <path d="M104 118 L106 80 L146 80 L146 118 Z" fill="#93c5fd" opacity="0.75" />

      {/* Pillars */}
      <line x1="106" y1="80" x2="101" y2="118" stroke="#1d4ed8" strokeWidth="4" />
      <line x1="147" y1="79" x2="147" y2="118" stroke="#1d4ed8" strokeWidth="4" />
      <line x1="201" y1="79" x2="203" y2="118" stroke="#1d4ed8" strokeWidth="4" />

      {/* Hood */}
      <path d="M242 118 L274 120 L274 134 L242 132 Z" fill="#1d4ed8" />

      {/* Trunk */}
      <path d="M48 118 L48 132 L80 132 L80 118 Z" fill="#1d4ed8" />

      {/* Bumpers */}
      <rect x="268" y="134" width="9" height="16" rx="4" fill="#60a5fa" />
      <rect x="43" y="134" width="9" height="16" rx="4" fill="#60a5fa" />

      {/* Headlight */}
      <rect x="266" y="121" width="10" height="14" rx="3" fill="#fef3c7" />
      <rect x="263" y="123" width="5" height="10" rx="2" fill="#fde68a" />

      {/* Taillight */}
      <rect x="44" y="121" width="10" height="14" rx="3" fill="#fecaca" />
      <rect x="46" y="123" width="5" height="10" rx="2" fill="#f87171" />

      {/* Door line */}
      <line x1="147" y1="118" x2="147" y2="155" stroke="#1d4ed8" strokeWidth="2" />

      {/* Door handles */}
      <rect x="104" y="134" width="22" height="5" rx="2.5" fill="#1e40af" />
      <rect x="157" y="134" width="22" height="5" rx="2.5" fill="#1e40af" />

      {/* Sill */}
      <rect x="57" y="153" width="206" height="5" rx="2" fill="#1e40af" />

      {/* ── WHEELS ── */}
      {/* Rear */}
      <circle cx="82" cy="156" r="25" fill="#0f172a" />
      <circle cx="82" cy="156" r="18" fill="#1e293b" />
      <circle cx="82" cy="156" r="11" fill="#374151" />
      <circle cx="82" cy="156" r="5" fill="#64748b" />
      <line x1="82" y1="138" x2="82" y2="174" stroke="#4b5563" strokeWidth="2.5" />
      <line x1="64" y1="156" x2="100" y2="156" stroke="#4b5563" strokeWidth="2.5" />
      <line x1="70" y1="143" x2="94" y2="169" stroke="#4b5563" strokeWidth="1.5" />
      <line x1="94" y1="143" x2="70" y2="169" stroke="#4b5563" strokeWidth="1.5" />

      {/* Front */}
      <circle cx="235" cy="156" r="25" fill="#0f172a" />
      <circle cx="235" cy="156" r="18" fill="#1e293b" />
      <circle cx="235" cy="156" r="11" fill="#374151" />
      <circle cx="235" cy="156" r="5" fill="#64748b" />
      <line x1="235" y1="138" x2="235" y2="174" stroke="#4b5563" strokeWidth="2.5" />
      <line x1="217" y1="156" x2="253" y2="156" stroke="#4b5563" strokeWidth="2.5" />
      <line x1="222" y1="143" x2="248" y2="169" stroke="#4b5563" strokeWidth="1.5" />
      <line x1="248" y1="143" x2="222" y2="169" stroke="#4b5563" strokeWidth="1.5" />

      {/* ── DECORATIVE TOOLS ── */}

      {/* Wrench — top right */}
      <g transform="translate(291, 50) rotate(42)">
        <rect x="-4" y="-4" width="8" height="34" rx="4" fill="#f59e0b" />
        <path d="M -10 -4 Q -10 -20 0 -20 Q 10 -20 10 -4 Z" fill="#f59e0b" />
        <path d="M -10 30 Q -10 46 0 46 Q 10 46 10 30 Z" fill="#f59e0b" />
        <rect x="-3.5" y="-10" width="7" height="8" fill="#fef3c7" />
        <rect x="-3.5" y="32" width="7" height="8" fill="#fef3c7" />
      </g>

      {/* Gear — bottom left */}
      <g transform="translate(20, 156)">
        <circle cx="0" cy="0" r="16" fill="none" stroke="#93c5fd" strokeWidth="5" />
        <circle cx="0" cy="0" r="7" fill="#eff6ff" stroke="#93c5fd" strokeWidth="3" />
        <rect x="-3.5" y="-21" width="7" height="7" rx="2" fill="#93c5fd" />
        <rect x="-3.5" y="14" width="7" height="7" rx="2" fill="#93c5fd" />
        <rect x="-21" y="-3.5" width="7" height="7" rx="2" fill="#93c5fd" />
        <rect x="14" y="-3.5" width="7" height="7" rx="2" fill="#93c5fd" />
      </g>

      {/* Oil drop — top left */}
      <path d="M 28 60 Q 18 50 28 38 Q 38 50 28 60 Z" fill="#93c5fd" opacity="0.65" />

      {/* Bolt — left */}
      <g transform="translate(22, 90) rotate(-12)">
        <rect x="-5" y="-16" width="10" height="26" rx="3" fill="#c7d2fe" opacity="0.8" />
        <rect x="-9" y="-21" width="18" height="7" rx="2" fill="#a5b4fc" />
      </g>

      {/* Sparkle — right */}
      <g transform="translate(305, 102)">
        <line x1="0" y1="-7" x2="0" y2="7" stroke="#fbbf24" strokeWidth="2" />
        <line x1="-7" y1="0" x2="7" y2="0" stroke="#fbbf24" strokeWidth="2" />
        <line x1="-5" y1="-5" x2="5" y2="5" stroke="#fbbf24" strokeWidth="1.5" />
        <line x1="5" y1="-5" x2="-5" y2="5" stroke="#fbbf24" strokeWidth="1.5" />
        <circle cx="0" cy="0" r="2" fill="#fbbf24" />
      </g>
    </svg>
  )
}

// ── Page ────────────────────────────────────────────────────────────────────
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
    <div className="flex flex-col min-h-screen bg-white dark:bg-slate-950 overflow-y-auto">

      {/* ── TOP BAR ── */}
      <div className="flex items-center justify-between px-5 pt-6 pb-0 shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center shadow-sm">
            {/* Wrench SVG inline so no import needed for size */}
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
          </div>
          <div>
            <p className="text-[11px] font-extrabold tracking-widest text-blue-600 uppercase leading-none">
              {shopName}
            </p>
            <p className="text-[9px] text-slate-400 tracking-widest uppercase mt-0.5">
              AUTO PARTS &amp; ACCESSORIES
            </p>
          </div>
        </div>

        {/* Menu button */}
        <button
          onClick={() => setMenuOpen(true)}
          className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        </button>
      </div>

      {/* ── HERO ILLUSTRATION ── */}
      <div className="px-5 pt-5 pb-1 flex justify-center">
        <CarIllustration />
      </div>

      {/* ── HEADLINE ── */}
      <div className="text-center px-6 pb-1">
        <h1 className="text-[27px] font-extrabold text-slate-900 dark:text-white leading-snug tracking-tight">
          Your Auto Spares
        </h1>
        <h1 className="text-[27px] font-extrabold text-blue-600 leading-snug tracking-tight">
          At Your Fingertips
        </h1>
        <p className="text-slate-400 dark:text-slate-500 text-sm mt-2">
          Manage stock &middot; Process sales &middot; Track profit
        </p>
      </div>

      {/* ── TODAY'S STATS ── */}
      <div className="mx-5 mt-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 px-4 py-3 grid grid-cols-3">
        <div className="text-center">
          <div className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
            {formatCurrency(stats?.todayRevenue ?? 0, currency)}
          </div>
          <div className="text-[10px] uppercase tracking-wide text-slate-400 mt-0.5">Revenue</div>
        </div>
        <div className="text-center border-x border-slate-200 dark:border-slate-700">
          <div className="text-sm font-bold text-green-600 tabular-nums">
            {formatCurrency(stats?.todayProfit ?? 0, currency)}
          </div>
          <div className="text-[10px] uppercase tracking-wide text-slate-400 mt-0.5">Profit</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
            {stats?.todaySalesCount ?? 0}
          </div>
          <div className="text-[10px] uppercase tracking-wide text-slate-400 mt-0.5">Sales</div>
        </div>
      </div>

      {/* ── LOW STOCK ALERT ── */}
      {(alerts?.totalAlerts ?? 0) > 0 && (
        <button
          onClick={() => navigate('/alerts')}
          className="mx-5 mt-3 flex items-center gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 text-left w-auto"
        >
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
          <span className="text-xs text-amber-700 dark:text-amber-400">
            <strong>{alerts?.totalAlerts}</strong> item{alerts?.totalAlerts !== 1 ? 's' : ''} need restocking
          </span>
          <span className="ml-auto text-xs text-amber-500">View &#8594;</span>
        </button>
      )}

      {/* ── ACTION BUTTONS ── */}
      <div className="px-5 mt-5 pb-10 space-y-3">
        {/* Primary: Sell */}
        <button
          onClick={() => navigate('/pos')}
          className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-base font-bold shadow-lg active:scale-[0.98] transition-all touch-manipulation"
        >
          SELL NOW
        </button>

        {/* Secondary: Stock Entry */}
        <button
          onClick={() => navigate('/inventory')}
          className="w-full h-14 rounded-2xl border-2 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-base font-bold hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-[0.98] transition-all touch-manipulation"
        >
          STOCK ENTRY
        </button>
      </div>

      {/* ── SLIDE-OVER MENU ── */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMenuOpen(false)} />
          <div className="relative ml-auto w-64 bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
              <span className="font-semibold text-slate-900 dark:text-slate-100">Menu</span>
              <button onClick={() => setMenuOpen(false)} aria-label="Close menu">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <nav className="flex-1 p-4 space-y-1">
              {menuItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => { navigate(item.path); setMenuOpen(false) }}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors"
                >
                  <item.icon className="w-5 h-5 text-slate-500" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{item.label}</span>
                  {item.badge != null && item.badge > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}
    </div>
  )
}
