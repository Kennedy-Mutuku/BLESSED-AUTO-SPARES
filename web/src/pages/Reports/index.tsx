import { useQuery } from '@tanstack/react-query'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'
import { api } from '@/lib/api'

const PIE_COLORS = ['#dc2626', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#06b6d4']

export function ReportsPage() {
  const { data, isLoading } = useQuery<{ sales: any[]; products: any[]; settings: any[] }>({
    queryKey: ['shopData'],
    queryFn:  () => api.get('/api/sync/all'),
  })

  const sales    = data?.sales    ?? []
  const products = data?.products ?? []
  const currency = data?.settings?.find((s: any) => s.key === 'currencySymbol')?.value ?? 'KES'
  const fmt = (n: number) => `${currency} ${n.toLocaleString('en-KE')}`

  // Last 30 days revenue by day
  const now = Date.now()
  const monthData = Array.from({ length: 30 }, (_, i) => {
    const d     = new Date(now - (29 - i) * 86_400_000)
    const start = new Date(d).setHours(0, 0, 0, 0)
    const end   = new Date(d).setHours(23, 59, 59, 999)
    const daySales = sales.filter((s: any) => s.soldAt >= start && s.soldAt <= end)
    return {
      day:     d.toLocaleDateString('en-KE', { day: '2-digit', month: 'short' }),
      revenue: daySales.reduce((a: number, s: any) => a + (s.subtotal ?? 0), 0),
      profit:  daySales.reduce((a: number, s: any) => a + (s.totalProfit ?? 0), 0),
    }
  })

  // Payment method breakdown
  const pmBreakdown: Record<string, number> = {}
  for (const s of sales) {
    pmBreakdown[s.paymentMethod ?? 'other'] = (pmBreakdown[s.paymentMethod ?? 'other'] ?? 0) + (s.subtotal ?? 0)
  }
  const pmData = Object.entries(pmBreakdown).map(([name, value]) => ({ name, value }))

  // Top 10 products by revenue
  const revByProduct: Record<string, { name: string; revenue: number; profit: number }> = {}
  for (const sale of sales) {
    for (const item of sale.items ?? []) {
      if (!revByProduct[item.productId]) {
        revByProduct[item.productId] = { name: item.productName, revenue: 0, profit: 0 }
      }
      revByProduct[item.productId].revenue += item.lineTotal ?? 0
      revByProduct[item.productId].profit  += item.lineProfit ?? 0
    }
  }
  const topByRev = Object.values(revByProduct).sort((a, b) => b.revenue - a.revenue).slice(0, 10)

  // Stock valuation
  const stockWorth    = products.reduce((a: number, p: any) => a + (p.buyingPrice ?? 0) * (p.stockQuantity ?? 0), 0)
  const stockRetail   = products.reduce((a: number, p: any) => a + (p.sellingPrice ?? 0) * (p.stockQuantity ?? 0), 0)
  const expectedProfit = stockRetail - stockWorth

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-7 h-7 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="p-6 lg:p-8 space-y-6">

      {/* Branded header */}
      <div className="relative rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f172a 60%, #1f0505 100%)' }}>
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-red-950/30 to-transparent" />
        <div className="relative z-10 px-6 py-6">
          <p className="text-red-500/60 text-[10px] font-black uppercase tracking-widest mb-1.5">Blessed Auto Spares</p>
          <h1 className="text-2xl font-black text-white tracking-tight">Business Performance</h1>
          <p className="text-slate-400 text-sm mt-1.5">Revenue trends, profit margins &amp; stock intelligence for all synced data</p>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue',      value: fmt(sales.reduce((a: number, s: any) => a + (s.subtotal ?? 0), 0)),    color: 'text-blue-600'   },
          { label: 'Total Profit',       value: fmt(sales.reduce((a: number, s: any) => a + (s.totalProfit ?? 0), 0)), color: 'text-green-600'  },
          { label: 'Parts Inventory Value', value: fmt(stockWorth),                                                     color: 'text-slate-700'  },
          { label: 'Potential Profit',      value: fmt(expectedProfit),                                                 color: 'text-emerald-600' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <p className={`text-xl font-black ${k.color}`}>{k.value}</p>
            <p className="text-slate-400 text-xs mt-1 font-medium">{k.label}</p>
          </div>
        ))}
      </div>

      {/* 30-day area chart */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <h2 className="text-sm font-bold text-slate-700 mb-4">Revenue &amp; Profit — Last 30 Days</h2>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={monthData}>
            <defs>
              <linearGradient id="gRev30" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#dc2626" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gPro30" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval={4} />
            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={65} tickFormatter={v => `${v.toLocaleString()}`} />
            <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} formatter={(v: any) => [`${currency} ${Number(v).toLocaleString()}`, '']} />
            <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#dc2626" strokeWidth={2} fill="url(#gRev30)" />
            <Area type="monotone" dataKey="profit"  name="Profit"  stroke="#22c55e" strokeWidth={2} fill="url(#gPro30)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Top products bar */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <h2 className="text-sm font-bold text-slate-700 mb-4">Top-Selling Parts by Revenue</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={topByRev} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `${v.toLocaleString()}`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} width={120}
                tickFormatter={(v: string) => v.length > 16 ? v.slice(0, 16) + '…' : v}
              />
              <Tooltip formatter={(v: any) => [`${currency} ${Number(v).toLocaleString()}`, '']} contentStyle={{ borderRadius: 12 }} />
              <Bar dataKey="revenue" name="Revenue" fill="#dc2626" radius={[0, 6, 6, 0]} />
              <Bar dataKey="profit"  name="Profit"  fill="#22c55e" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Payment method pie */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <h2 className="text-sm font-bold text-slate-700 mb-4">Sales by Payment Method</h2>
          {pmData.length === 0 ? (
            <div className="flex items-center justify-center h-60 text-slate-300 text-sm">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={pmData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3}>
                  {pmData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                <Tooltip formatter={(v: any) => [`${currency} ${Number(v).toLocaleString()}`, '']} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

    </div>
  )
}
