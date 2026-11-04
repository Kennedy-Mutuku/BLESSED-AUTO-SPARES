import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Package, Receipt, BarChart2, LogOut, Phone, MapPin } from 'lucide-react'
import { clearAuth, getUser } from '@/lib/api'

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard',    desc: 'Overview & live stats' },
  { to: '/inventory', icon: Package,         label: 'Parts Catalog', desc: 'Stock & pricing'      },
  { to: '/sales',     icon: Receipt,         label: 'Transactions',  desc: 'Sales history'        },
  { to: '/reports',   icon: BarChart2,       label: 'Performance',   desc: 'Revenue & profit'     },
]

export function Sidebar() {
  const navigate = useNavigate()
  const user     = getUser()

  function logout() {
    clearAuth()
    navigate('/login', { replace: true })
  }

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-slate-950 shrink-0 border-r border-white/[0.05]">

      {/* Brand header */}
      <div className="px-5 pt-7 pb-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-2xl bg-red-600 flex items-center justify-center shrink-0 shadow-xl shadow-red-600/25">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <p className="text-white font-black text-[14px] leading-tight">Blessed Auto Spares</p>
            <p className="text-red-500/60 text-[9px] font-bold uppercase tracking-[0.12em] mt-0.5">Management Portal</p>
          </div>
        </div>

        <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl px-3.5 py-3">
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Genuine parts &amp; accessories for Toyota, Nissan, Mitsubishi, Isuzu and more.
          </p>
        </div>
      </div>

      <div className="mx-5 border-t border-white/[0.06] mb-2" />

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-0.5">
        {NAV.map(({ to, icon: Icon, label, desc }) => (
          <NavLink key={to} to={to} end={to === '/'}>
            {({ isActive }) => (
              <div className={`flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all cursor-pointer ${
                isActive
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
              }`}>
                <Icon className="w-4 h-4 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold leading-tight">{label}</p>
                  <p className={`text-[10px] leading-tight mt-0.5 ${isActive ? 'text-red-100/60' : 'text-slate-600'}`}>{desc}</p>
                </div>
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-4 pb-5 pt-3 space-y-3 border-t border-white/[0.06]">

        <div className="bg-red-950/40 border border-red-900/30 rounded-xl px-3.5 py-3">
          <p className="text-red-400/60 text-[9px] font-bold uppercase tracking-widest mb-2">Get in touch</p>
          <div className="flex items-center gap-2 mb-1.5">
            <Phone className="w-3 h-3 text-red-500/50 shrink-0" />
            <span className="text-slate-300 text-[11px] font-medium">+254 700 225849</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-3 h-3 text-red-500/50 shrink-0" />
            <span className="text-slate-500 text-[10px]">Sondu, Nyamira County, Kenya</span>
          </div>
        </div>

        {user && (
          <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl px-3.5 py-2.5">
            <p className="text-white text-[12px] font-semibold truncate">{user.shopName}</p>
            <p className="text-slate-500 text-[10px] truncate mt-0.5">{user.email}</p>
          </div>
        )}

        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:text-red-400 hover:bg-white/[0.05] transition-all"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
