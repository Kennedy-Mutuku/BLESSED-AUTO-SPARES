import { useNavigate } from 'react-router-dom'
import {
  Package,
  ShoppingCart,
  BarChart2,
  AlertTriangle,
  FileText,
  Settings,
  Menu,
  TrendingUp,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { useDashboardStats } from '@/hooks/useDashboardStats'
import { useStockAlerts } from '@/hooks/useStockAlerts'
import { useSettings } from '@/hooks/useLocalSettings'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export function DashboardPage() {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const { data: stats } = useDashboardStats()
  const { data: alerts } = useStockAlerts()
  const { data: settings } = useSettings()

  const currency = settings?.currencySymbol ?? 'KES'
  const shopName = settings?.shopName ?? 'Blessed Auto Spares'

  const menuItems = [
    { icon: FileText, label: 'Sales Log', path: '/sales' },
    { icon: AlertTriangle, label: 'Stock Alerts', path: '/alerts', badge: alerts?.totalAlerts },
    { icon: BarChart2, label: 'Reports', path: '/reports' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ]

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-blue-700 dark:bg-blue-900 text-white px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold leading-tight">{shopName}</h1>
          <p className="text-blue-200 text-xs">Inventory & POS</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-blue-600"
          onClick={() => setMenuOpen(true)}
        >
          <Menu className="h-6 w-6" />
        </Button>
      </header>

      {/* Main Buttons */}
      <div className="flex-1 flex flex-col gap-4 p-4">
        <div className="grid grid-cols-2 gap-4 flex-1">
          {/* Stock Entry */}
          <button
            onClick={() => navigate('/inventory')}
            className="flex flex-col items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-2xl p-6 shadow-lg transition-colors min-h-[160px] touch-manipulation"
          >
            <Package className="w-12 h-12" strokeWidth={1.5} />
            <div className="text-center">
              <div className="text-lg font-bold">STOCK</div>
              <div className="text-lg font-bold">ENTRY</div>
              <div className="text-xs text-blue-200 mt-1">Manage inventory</div>
            </div>
          </button>

          {/* Selling */}
          <button
            onClick={() => navigate('/pos')}
            className="flex flex-col items-center justify-center gap-3 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white rounded-2xl p-6 shadow-lg transition-colors min-h-[160px] touch-manipulation"
          >
            <ShoppingCart className="w-12 h-12" strokeWidth={1.5} />
            <div className="text-center">
              <div className="text-lg font-bold">SELLING</div>
              <div className="text-xs text-green-200 mt-1">Process a sale</div>
            </div>
          </button>
        </div>

        {/* Today's Summary */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Today's Summary</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <div className="text-lg font-bold text-slate-900 dark:text-white">
                {formatCurrency(stats?.todayRevenue ?? 0, currency)}
              </div>
              <div className="text-xs text-slate-500">Revenue</div>
            </div>
            <div className="text-center border-x border-slate-100 dark:border-slate-700">
              <div className="text-lg font-bold text-green-600">
                {formatCurrency(stats?.todayProfit ?? 0, currency)}
              </div>
              <div className="text-xs text-slate-500">Profit</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-slate-900 dark:text-white">
                {stats?.todaySalesCount ?? 0}
              </div>
              <div className="text-xs text-slate-500">Sales</div>
            </div>
          </div>
        </div>

        {/* Stock Alert Banner */}
        {(alerts?.totalAlerts ?? 0) > 0 && (
          <button
            onClick={() => navigate('/alerts')}
            className="flex items-center gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 text-left w-full"
          >
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
            <span className="text-sm text-amber-700 dark:text-amber-400">
              <strong>{alerts?.totalAlerts}</strong> item{alerts?.totalAlerts !== 1 ? 's' : ''} need restocking
            </span>
            <span className="ml-auto text-xs text-amber-500">View &rarr;</span>
          </button>
        )}
      </div>

      {/* Slide-over Menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMenuOpen(false)} />
          <div className="relative ml-auto w-64 bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
              <span className="font-semibold text-slate-900 dark:text-slate-100">Menu</span>
              <button onClick={() => setMenuOpen(false)}>
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
