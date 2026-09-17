import { useNavigate } from 'react-router-dom'
import { BarChart2, AlertTriangle, FileText, Menu, X } from 'lucide-react'
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
        <button
          onClick={() => setMenuOpen(true)}
          className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors shrink-0"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5 text-white" />
        </button>
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
        <div className="grid grid-cols-3 rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
          <div className="text-center">
            <div className="text-[12px] font-bold text-slate-900 tabular-nums leading-tight">
              {formatCurrency(stats?.todayRevenue ?? 0, currency)}
            </div>
            <div className="text-[9px] uppercase tracking-wide text-slate-400 mt-0.5">Revenue</div>
          </div>
          <div className="text-center border-x border-slate-200">
            <div className="text-[12px] font-bold text-green-600 tabular-nums leading-tight">
              {formatCurrency(stats?.todayProfit ?? 0, currency)}
            </div>
            <div className="text-[9px] uppercase tracking-wide text-slate-400 mt-0.5">Profit</div>
          </div>
          <div className="text-center">
            <div className="text-[12px] font-bold text-slate-900 tabular-nums leading-tight">
              {stats?.todaySalesCount ?? 0}
            </div>
            <div className="text-[9px] uppercase tracking-wide text-slate-400 mt-0.5">Sales</div>
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
              {/* Close row */}
              <button
                onClick={() => setMenuOpen(false)}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 border-t border-slate-200 hover:bg-slate-50 transition-colors"
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
