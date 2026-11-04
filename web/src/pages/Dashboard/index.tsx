import { useQuery } from '@tanstack/react-query'
import { TrendingUp, TrendingDown, ShoppingCart, Package, RefreshCw } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { api } from '@/lib/api'
import { getUser } from '@/lib/api'

interface ShopData {
  products?: any[]
  sales?: any[]
  settings?: any[]
}

function fmt(n: number, cur = 'KES') {
  return `${cur} ${n.toLocaleString('en-KE', { minimumFractionDigits: 0 })}`
}

function getSetting(settings: any[] | undefined, key: string, fallback = '') {
  return settings?.find((s: any) => s.key === key)?.value ?? fallback
}

export function DashboardPage() {
  const user = getUser()

  const { data, isLoading, refetch, isFetching } = useQuery<ShopData>({
    queryKey: ['shopData'],
    queryFn:  () => api.get('/api/sync/all'),
  })

  const products = data?.products ?? []
  const sales    = data?.sales    ?? []
  const settings = data?.settings ?? []
  const currency = getSetting(settings, 'currencySymbol', 'KES')
  const shopName = getSetting(settings, 'shopName', user?.shopName ?? 'Blessed Auto Spares')

  // ── Stats ──────────────────────────────────────────────────────────────────
  const now         = Date.now()
  const startOfDay  = new Date().setHours(0, 0, 0, 0)
  const todaySales  = sales.filter((s: any) => s.soldAt >= startOfDay)
  const todayRev    = todaySales.reduce((a: number, s: any) => a + (s.subtotal ?? 0), 0)
  const todayProfit = todaySales.reduce((a: number, s: any) => a + (s.totalProfit ?? 0), 0)
  const totalStock  = products.reduce((a: number, p: any) => a + (p.buyingPrice ?? 0) * (p.stockQuantity ?? 0), 0)
  const lowStock    = products.filter((p: any) => (p.stockQuantity ?? 0) <= (p.reorderLevel ?? 5) && p.isActive).length

  const stats = [
    { label: "Today's Revenue", value: fmt(todayRev, currency),    color: 'text-blue-600',   bg: 'bg-blue-50',   icon: TrendingUp },
    { label: "Today's Profit",  value: fmt(todayProfit, currency),  color: 'text-green-600',  bg: 'bg-green-50',  icon: TrendingUp },
    { label: 'Parts Sold Today', value: String(todaySales.length),  color: 'text-purple-600', bg: 'bg-purple-50', icon: ShoppingCart },
    { label: 'Need Restocking',  value: String(lowStock),           color: 'text-red-600',    bg: 'bg-red-50',    icon: Package },
  ]

  // ── Revenue chart: last 7 days ─────────────────────────────────────────────
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const d     = new Date(now - (6 - i) * 86_400_000)
    const start = new Date(d).setHours(0, 0, 0, 0)
    const end   = new Date(d).setHours(23, 59, 59, 999)
    const daySales = sales.filter((s: any) => s.soldAt >= start && s.soldAt <= end)
    return {
      day:    d.toLocaleDateString('en-KE', { weekday: 'short' }),
      revenue: daySales.reduce((a: number, s: any) => a + (s.subtotal ?? 0), 0),
      profit:  daySales.reduce((a: number, s: any) => a + (s.totalProfit ?? 0), 0),
    }
  })

  // ── Top 5 products by quantity sold ───────────────────────────────────────
  const qtyByProduct: Record<string, { name: string; qty: number }> = {}
  for (const sale of sales) {
    for (const item of sale.items ?? []) {
      if (!qtyByProduct[item.productId]) {
        qtyByProduct[item.productId] = { name: item.productName, qty: 0 }
      }
      qtyByProduct[item.productId].qty += item.quantity ?? 0
    }
  }
  const topProducts = Object.values(qtyByProduct)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5)

  const PIE_COLORS = ['#dc2626', '#f97316', '#eab308', '#22c55e', '#3b82f6']

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-3 text-slate-400">
        <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm">Loading your data…</span>
      </div>
    </div>
  )

  return (
    <div className="p-6 lg:p-8 space-y-6">

      {/* Hero banner */}
      <div className="relative rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f172a 60%, #1f0505 100%)' }}>
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-red-950/40 to-transparent" />
        <div className="relative z-10 px-7 py-7 flex items-end justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block" />
              <span className="text-green-400/80 text-[10px] font-black uppercase tracking-widest">Live Dashboard</span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">{shopName}</h1>
            <p className="text-slate-400 text-sm mt-1.5">
              Auto parts &amp; accessories · Sondu, Nyamira County, Kenya
            </p>
            <p className="text-slate-600 text-xs mt-1">
              {new Date().toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white text-sm font-semibold hover:bg-white/[0.15] disabled:opacity-50 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-slate-400 text-xs mt-1 font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Revenue area chart */}
        <div className="xl:col-span-2 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <h2 className="text-sm font-bold text-slate-700 mb-4">Revenue &amp; Profit — Last 7 Days</h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#dc2626" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gPro" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={60} tickFormatter={v => `${currency} ${v.toLocaleString()}`} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,.08)' }}
                formatter={(v: any) => [`${currency} ${Number(v).toLocaleString()}`, '']}
              />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#dc2626" strokeWidth={2} fill="url(#gRev)" />
              <Area type="monotone" dataKey="profit"  name="Profit"  stroke="#22c55e" strokeWidth={2} fill="url(#gPro)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Top products pie */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <h2 className="text-sm font-bold text-slate-700 mb-4">Top-Selling Parts</h2>
          {topProducts.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-slate-300 text-sm">No sales data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={topProducts}
                  dataKey="qty"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                >
                  {topProducts.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 11 }}
                  formatter={(v: string) => v.length > 18 ? v.slice(0, 18) + '…' : v}
                />
                <Tooltip formatter={(v: any) => [`${v} units`, '']} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent sales */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-700">Recent Transactions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50">
                {['Receipt', 'Date', 'Items', 'Revenue', 'Profit', 'Method'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {sales.slice().sort((a: any, b: any) => b.soldAt - a.soldAt).slice(0, 10).map((s: any) => (
                <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3.5 font-mono text-xs text-slate-500">{s.receiptNumber}</td>
                  <td className="px-6 py-3.5 text-slate-600">
                    {new Date(s.soldAt).toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-3.5 text-slate-600">{s.items?.length ?? 0}</td>
                  <td className="px-6 py-3.5 font-semibold text-slate-800">{fmt(s.subtotal ?? 0, currency)}</td>
                  <td className="px-6 py-3.5 font-semibold text-green-600">{fmt(s.totalProfit ?? 0, currency)}</td>
                  <td className="px-6 py-3.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                      s.paymentMethod === 'cash'  ? 'bg-green-50 text-green-700'  :
                      s.paymentMethod === 'mpesa' ? 'bg-blue-50 text-blue-700'   :
                      s.paymentMethod === 'card'  ? 'bg-purple-50 text-purple-700' :
                      'bg-amber-50 text-amber-700'
                    }`}>
                      {s.paymentMethod}
                    </span>
                  </td>
                </tr>
              ))}
              {sales.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-300 text-sm">
                    No sales synced yet. Make a sale on the app then tap Sync.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
