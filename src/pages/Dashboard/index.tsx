import { useNavigate } from 'react-router-dom'
import { BarChart2, AlertTriangle, FileText, Settings, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useDashboardStats } from '@/hooks/useDashboardStats'
import { useStockAlerts } from '@/hooks/useStockAlerts'
import { useSettings } from '@/hooks/useLocalSettings'
import { formatCurrency } from '@/lib/utils'
import logoImg from '@/assets/logo.png'
import carouselImg from '@/assets/carousel 1.jpg'

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
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col px-6 pt-8 pb-8">

      {/* ── LOGO BAR ── */}
      <div className="relative flex items-center justify-center mb-1">
        {/* Centred brand */}
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-2">
            <img
              src={logoImg}
              alt="logo"
              className="w-8 h-8 rounded-full object-cover border-2 border-red-600"
            />
            <span className="text-[15px] font-extrabold tracking-widest text-slate-900 dark:text-white uppercase">
              {shopName}
            </span>
          </div>
          <p className="text-[9px] tracking-[0.18em] text-slate-400 uppercase">
            WE STOCK IT ALL.
          </p>
        </div>

        {/* Menu — absolute so it doesn't push logo off-centre */}
        <button
          onClick={() => setMenuOpen(true)}
          className="absolute right-0 top-0 w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center"
          aria-label="Open menu"
        >
          <Menu className="w-4 h-4 text-slate-600 dark:text-slate-300" />
        </button>
      </div>

      {/* ── HERO IMAGE ── */}
      <div className="flex-1 flex items-center justify-center py-3 min-h-0">
        <img
          src={carouselImg}
          alt="Auto mechanic"
          className="w-full max-w-[300px] max-h-[260px] object-contain"
        />
      </div>

      {/* ── HEADLINE ── */}
      <div className="text-center mb-4">
        <h1 className="text-[26px] font-extrabold text-slate-900 dark:text-white leading-tight">
          Your Auto Spares
        </h1>
        <h1 className="text-[26px] font-extrabold text-red-600 leading-tight">
          At Your Fingertips
        </h1>
        <p className="text-slate-400 dark:text-slate-500 text-[13px] mt-2">
          Manage stock &middot; Process sales &middot; Track profit
        </p>
      </div>

      {/* ── TODAY'S STATS ── */}
      <div className="grid grid-cols-3 mb-4 bg-slate-50 dark:bg-slate-800 rounded-2xl px-3 py-3 border border-slate-100 dark:border-slate-700">
        <div className="text-center">
          <div className="text-[13px] font-bold text-slate-900 dark:text-white tabular-nums leading-tight">
            {formatCurrency(stats?.todayRevenue ?? 0, currency)}
          </div>
          <div className="text-[9px] uppercase tracking-widest text-slate-400 mt-0.5">Revenue</div>
        </div>
        <div className="text-center border-x border-slate-200 dark:border-slate-700">
          <div className="text-[13px] font-bold text-green-600 tabular-nums leading-tight">
            {formatCurrency(stats?.todayProfit ?? 0, currency)}
          </div>
          <div className="text-[9px] uppercase tracking-widest text-slate-400 mt-0.5">Profit</div>
        </div>
        <div className="text-center">
          <div className="text-[13px] font-bold text-slate-900 dark:text-white tabular-nums leading-tight">
            {stats?.todaySalesCount ?? 0}
          </div>
          <div className="text-[9px] uppercase tracking-widest text-slate-400 mt-0.5">Sales</div>
        </div>
      </div>

      {/* ── DOTS ── */}
      <div className="flex justify-center gap-2 mb-5">
        <div className="w-2.5 h-2.5 rounded-full bg-red-600" />
        <div className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-slate-700" />
      </div>

      {/* ── LOW STOCK ALERT (conditional) ── */}
      {(alerts?.totalAlerts ?? 0) > 0 && (
        <button
          onClick={() => navigate('/alerts')}
          className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-2.5 mb-4 text-left w-full"
        >
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
          <span className="text-xs text-amber-700 dark:text-amber-400">
            <strong>{alerts?.totalAlerts}</strong> item{alerts?.totalAlerts !== 1 ? 's' : ''} need restocking
          </span>
          <span className="ml-auto text-xs text-amber-500">View &#8594;</span>
        </button>
      )}

      {/* ── PRIMARY BUTTON ── */}
      <button
        onClick={() => navigate('/pos')}
        className="w-full h-14 rounded-2xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-[15px] font-bold tracking-wide shadow-md active:scale-[0.98] transition-all touch-manipulation"
      >
        SELL NOW
      </button>

      {/* ── SECONDARY LINK ── */}
      <p className="text-center mt-4 text-[13px] text-slate-400 dark:text-slate-500">
        Need to add stock?{' '}
        <button
          onClick={() => navigate('/inventory')}
          className="text-red-600 font-semibold"
        >
          Stock Entry
        </button>
      </p>

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
