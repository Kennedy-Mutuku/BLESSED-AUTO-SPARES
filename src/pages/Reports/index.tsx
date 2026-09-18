import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { db } from '@/db/database'
import { useSettings } from '@/hooks/useLocalSettings'
import { PageHeader } from '@/components/shared/PageHeader'
import { formatCurrency } from '@/lib/utils'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'

export function ReportsPage() {
  const { data: settings } = useSettings()
  const currency = settings?.currencySymbol ?? 'KES'

  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const { data: stats, isLoading, isFetching } = useQuery({
    queryKey: ['rangeStats', fromDate, toDate],
    queryFn: async () => {
      const [sales, products] = await Promise.all([
        fromDate && toDate
          ? db.sales.where('soldAt').between(
              new Date(fromDate + 'T00:00:00').getTime(),
              new Date(toDate   + 'T23:59:59').getTime(),
              true, true
            ).toArray()
          : db.sales.toArray(),
        db.products.filter(p => p.isActive).toArray(),
      ])

      const profitEarned   = sales.reduce((s, sale) => s + sale.totalProfit, 0)
      const stockWorth     = products.reduce((s, p) => s + p.stockQuantity * p.buyingPrice, 0)
      const expectedProfit = products.reduce((s, p) => s + p.stockQuantity * (p.sellingPrice - p.buyingPrice), 0)

      // Build chart data — daily if range selected, monthly for all time
      type ChartEntry = { date: string; revenue: number; profit: number; sales: number }
      let chartData: ChartEntry[]

      if (fromDate && toDate) {
        const map = new Map<string, { revenue: number; profit: number; sales: number }>()
        const cur = new Date(fromDate + 'T00:00:00')
        const end = new Date(toDate + 'T00:00:00')
        while (cur <= end) {
          map.set(cur.toISOString().slice(0, 10), { revenue: 0, profit: 0, sales: 0 })
          cur.setDate(cur.getDate() + 1)
        }
        for (const sale of sales) {
          const key = new Date(sale.soldAt).toISOString().slice(0, 10)
          const e = map.get(key)
          if (e) { e.revenue += sale.subtotal; e.profit += sale.totalProfit; e.sales++ }
        }
        chartData = Array.from(map.entries()).map(([d, v]) => ({
          date: new Date(d + 'T00:00:00').toLocaleDateString('en-KE', { day: 'numeric', month: 'short' }),
          ...v,
        }))
      } else {
        const map = new Map<string, { revenue: number; profit: number; sales: number }>()
        for (const sale of sales) {
          const d = new Date(sale.soldAt)
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
          if (!map.has(key)) map.set(key, { revenue: 0, profit: 0, sales: 0 })
          const e = map.get(key)!
          e.revenue += sale.subtotal; e.profit += sale.totalProfit; e.sales++
        }
        chartData = Array.from(map.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([key, v]) => ({
            date: new Date(key + '-01T00:00:00').toLocaleDateString('en-KE', { month: 'short', year: '2-digit' }),
            ...v,
          }))
      }

      return { profitEarned, stockWorth, expectedProfit, salesCount: sales.length, chartData }
    },
  })

  const formatDisplay = (dateStr: string) =>
    new Date(dateStr + 'T00:00:00').toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })

  const chartData = stats?.chartData ?? []
  const tickInterval = Math.max(0, Math.ceil(chartData.length / 6) - 1)

  return (
    <div className="flex flex-col h-dvh bg-slate-50 overflow-hidden">

      {/* ── HEADER ── */}
      <div className="shrink-0 px-4 pt-4 bg-red-600">
        <PageHeader title="Reports" backTo="/" />
      </div>

      {/* ── CONTENT — scrollable ── */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

        {/* Date range card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 block mb-1.5">From</label>
              <input
                type="date"
                value={fromDate}
                max={toDate}
                onChange={e => setFromDate(e.target.value)}
                className="w-full text-[13px] font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 block mb-1.5">To</label>
              <input
                type="date"
                value={toDate}
                min={fromDate}
                onChange={e => setToDate(e.target.value)}
                className="w-full text-[13px] font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
            <span className="text-[11px] text-red-700 font-semibold">
              {fromDate && toDate ? `${formatDisplay(fromDate)} — ${formatDisplay(toDate)}` : 'All Time'}
            </span>
            {stats != null && (
              <span className="ml-auto text-[10px] font-bold text-red-400">
                {stats.salesCount} sale{stats.salesCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Metric cards */}
        <div className="space-y-3">

          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex">
            <div className="w-1 bg-slate-800 shrink-0" />
            <div className="flex-1 px-4 py-3">
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">Total Stock Worth</p>
              <p className="text-[26px] font-black text-slate-900 tabular-nums leading-none mt-1.5 tracking-tight">
                {isLoading ? <span className="text-slate-200">—</span> : formatCurrency(stats?.stockWorth ?? 0, currency)}
              </p>
              <p className="text-[10px] text-slate-400 mt-1 tracking-wide">Inventory valued at buying price</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex">
            <div className="w-1 bg-blue-500 shrink-0" />
            <div className="flex-1 px-4 py-3">
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-blue-400">Expected Profit</p>
              <p className="text-[26px] font-black text-blue-700 tabular-nums leading-none mt-1.5 tracking-tight">
                {isLoading ? <span className="text-blue-100">—</span> : formatCurrency(stats?.expectedProfit ?? 0, currency)}
              </p>
              <p className="text-[10px] text-slate-400 mt-1 tracking-wide">Potential profit if all stock is sold</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex">
            <div className="w-1 bg-emerald-500 shrink-0" />
            <div className="flex-1 px-4 py-3">
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-emerald-500">Profit Earned</p>
              <p className="text-[26px] font-black text-emerald-700 tabular-nums leading-none mt-1.5 tracking-tight">
                {isLoading ? <span className="text-emerald-100">—</span> : formatCurrency(stats?.profitEarned ?? 0, currency)}
              </p>
              <p className="text-[10px] text-slate-400 mt-1 tracking-wide">Actual profit from sales in period</p>
            </div>
          </div>

        </div>

        {/* ── CHART — fixed height ── */}
        <div className="h-48 shrink-0 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">

          {/* Chart header */}
          <div className="shrink-0 bg-slate-900 px-3 py-2 flex items-center justify-between">
            <span className="text-[10px] font-bold text-white tracking-wide uppercase">Performance Over Time</span>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-[2px] bg-blue-400 rounded-full" />
                <span className="text-[8px] text-slate-400 font-semibold">Revenue</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-[2px] bg-emerald-400 rounded-full" />
                <span className="text-[8px] text-slate-400 font-semibold">Profit</span>
              </div>
              <div className="flex items-center gap-1.5">
                <svg width="12" height="4" className="shrink-0">
                  <line x1="0" y1="2" x2="12" y2="2" stroke="#f59e0b" strokeWidth="2" strokeDasharray="3 2" />
                </svg>
                <span className="text-[8px] text-slate-400 font-semibold">Sales</span>
              </div>
              <span className="text-[8px] font-semibold text-slate-500 uppercase tracking-widest">
                {fromDate && toDate ? 'Daily' : 'Monthly'}
              </span>
            </div>
          </div>

          {/* Chart body */}
          {chartData.length > 0 ? (
            <div className="flex-1 min-h-0 px-1 py-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 6, right: 26, left: 0, bottom: 2 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 9, fill: '#94a3b8' }}
                    tickLine={false}
                    axisLine={false}
                    interval={tickInterval}
                    dy={3}
                  />
                  <YAxis
                    yAxisId="money"
                    tick={{ fontSize: 9, fill: '#94a3b8' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
                    width={32}
                  />
                  <YAxis
                    yAxisId="count"
                    orientation="right"
                    tick={{ fontSize: 9, fill: '#94a3b8' }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                    width={22}
                  />
                  <Tooltip
                    contentStyle={{
                      fontSize: 11,
                      borderRadius: 10,
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      padding: '8px 12px',
                    }}
                    labelStyle={{ fontWeight: 700, color: '#1e293b', marginBottom: 4, fontSize: 11 }}
                    formatter={(value: unknown, name: string) =>
                      name === 'Sales'
                        ? [`${value} sales`, 'Sales']
                        : [formatCurrency(value as number, currency), name]
                    }
                  />
                  <Line yAxisId="money" type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }} name="Revenue" />
                  <Line yAxisId="money" type="monotone" dataKey="profit"  stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#10b981', strokeWidth: 0 }} name="Profit" />
                  <Line yAxisId="count" type="monotone" dataKey="sales"   stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 3" dot={false} activeDot={{ r: 4, fill: '#f59e0b', strokeWidth: 0 }} name="Sales" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : isFetching ? (
            <div className="flex-1 flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-slate-200 border-t-red-500 rounded-full animate-spin" />
              <span className="text-[11px] text-slate-400">Loading…</span>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-[11px] text-slate-400">
              {fromDate && toDate ? 'No sales in this date range' : 'No sales recorded yet'}
            </div>
          )}

        </div>

        <div className="h-2" />
      </div>
    </div>
  )
}
