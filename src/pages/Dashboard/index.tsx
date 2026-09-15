import { useNavigate } from 'react-router-dom'
import { BarChart2, AlertTriangle, FileText, Settings, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useDashboardStats } from '@/hooks/useDashboardStats'
import { useStockAlerts } from '@/hooks/useStockAlerts'
import { useSettings } from '@/hooks/useLocalSettings'
import { formatCurrency } from '@/lib/utils'
import logoImg from '@/assets/logo.png'
import carouselImg from '@/assets/carousel 1.jpg'
import dominionLogo from '@/assets/dominion softwares main logo.png'

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
    <div className="flex flex-col min-h-screen bg-white overflow-y-auto">

      {/* ── TOP BAR ── */}
      <div className="flex items-center justify-between px-5 py-4 bg-slate-900 shadow-md shrink-0">
        {/* Logo mark + shop name */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-red-500 shadow-sm">
            <img src={logoImg} alt="logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="text-[18px] font-black tracking-wide text-white uppercase leading-none drop-shadow-sm">
              {shopName}
            </p>
            <p className="text-[9px] text-red-400 tracking-widest uppercase mt-1 font-semibold">
              AUTO PARTS &amp; ACCESSORIES
            </p>
          </div>
        </div>

        {/* Hamburger */}
        <button
          onClick={() => setMenuOpen(true)}
          className="w-10 h-10 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* ── HERO IMAGE ── */}
      <div className="flex justify-center px-6 pt-5 pb-2">
        <img
          src={carouselImg}
          alt="Auto mechanic"
          className="w-full max-w-[320px] object-contain"
        />
      </div>

      {/* ── HEADLINE ── */}
      <div className="text-center px-6 pb-1">
        <h1 className="text-[27px] font-extrabold text-slate-900 dark:text-white leading-snug tracking-tight">
          Your Auto Spares
        </h1>
        <h1 className="text-[27px] font-extrabold text-red-600 leading-snug tracking-tight">
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
          className="mx-5 mt-3 flex items-center gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 text-left"
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
        {/* Primary */}
        <button
          onClick={() => navigate('/pos')}
          className="w-full h-14 rounded-2xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-base font-bold shadow-lg active:scale-[0.98] transition-all touch-manipulation"
        >
          SELL NOW
        </button>

        {/* Secondary */}
        <button
          onClick={() => navigate('/inventory')}
          className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 active:bg-slate-700 text-white text-base font-bold shadow-md active:scale-[0.98] transition-all touch-manipulation"
        >
          STOCK ENTRY
        </button>
      </div>

      {/* ── POWERED BY FOOTER ── */}
      <div className="mt-6 mb-2">
        <div className="border-t border-slate-100 pt-4 flex justify-center">
          <a
            href="https://dominionsoftwares.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-slate-50 transition-colors group"
          >
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-medium group-hover:text-slate-500">
              Powered by
            </span>
            <img
              src={dominionLogo}
              alt="Dominion Softwares"
              className="h-6 w-auto object-contain"
            />
            <span className="text-[11px] font-bold text-slate-600 group-hover:text-slate-800 tracking-wide">
              Dominion Softwares
            </span>
          </a>
        </div>
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
