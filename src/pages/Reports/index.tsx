import { useState, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { db } from '@/db/database'
import { useSettings } from '@/hooks/useLocalSettings'
import { PageHeader } from '@/components/shared/PageHeader'
import { formatCurrency } from '@/lib/utils'
import { useReactToPrint } from 'react-to-print'
import { FileDown } from 'lucide-react'
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

  const printRef   = useRef<HTMLDivElement>(null)
  const handlePrint = useReactToPrint({ contentRef: printRef })

  const periodLabel = fromDate && toDate
    ? `${formatDisplay(fromDate)} — ${formatDisplay(toDate)}`
    : 'All Time'
  const generatedAt = new Date().toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  return (
    <div className="flex flex-col h-dvh bg-slate-50 overflow-hidden">

      {/* ── HEADER ── */}
      <div className="shrink-0 px-4 pt-4 bg-red-600">
        <PageHeader
          title="Reports"
          backTo="/"
          actions={
            <button
              type="button"
              onClick={() => handlePrint()}
              disabled={isLoading}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-white/40 hover:border-white/70 text-white text-[12px] font-medium transition-colors disabled:opacity-40"
            >
              <FileDown className="h-3.5 w-3.5" /> PDF
            </button>
          }
        />
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
                    formatter={(value: unknown, name: unknown) =>
                      name === 'Sales'
                        ? [`${value} sales`, 'Sales']
                        : [formatCurrency(value as number, currency), String(name ?? '')]
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

      {/* ── HIDDEN PRINT TEMPLATE ── */}
      <div style={{ display: 'none' }}>
        <div ref={printRef} style={{ fontFamily: 'Georgia, serif', color: '#0f172a', padding: '36px 44px', maxWidth: '820px', margin: '0 auto' }}>

          {/* ── LETTERHEAD ── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '4px solid #dc2626', paddingBottom: '18px', marginBottom: '24px' }}>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#dc2626', margin: 0, textTransform: 'uppercase', letterSpacing: '1.5px' }}>
                {settings?.shopName ?? 'Blessed Auto Spares'}
              </h1>
              <p style={{ fontSize: '11px', color: '#64748b', margin: '4px 0 0', fontFamily: 'Arial, sans-serif' }}>
                {[settings?.shopAddress, settings?.shopPhone].filter(Boolean).join(' · ')}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0, fontFamily: 'Arial, sans-serif' }}>Financial Report</p>
              <p style={{ fontSize: '11px', color: '#64748b', margin: '4px 0 0', fontFamily: 'Arial, sans-serif' }}>Period: <strong>{periodLabel}</strong></p>
              <p style={{ fontSize: '10px', color: '#94a3b8', margin: '2px 0 0', fontFamily: 'Arial, sans-serif' }}>Generated: {generatedAt}</p>
            </div>
          </div>

          {/* ── KPI CARDS ── */}
          <div style={{ display: 'flex', gap: '14px', marginBottom: '28px' }}>
            {[
              { label: 'Sales Count',      value: String(stats?.salesCount ?? 0),                   accent: '#1e293b', textColor: '#0f172a' },
              { label: 'Stock Worth',       value: formatCurrency(stats?.stockWorth ?? 0, currency),  accent: '#1e293b', textColor: '#0f172a' },
              { label: 'Expected Profit',   value: formatCurrency(stats?.expectedProfit ?? 0, currency), accent: '#3b82f6', textColor: '#1d4ed8' },
              { label: 'Profit Earned',     value: formatCurrency(stats?.profitEarned ?? 0, currency),   accent: '#16a34a', textColor: '#166534' },
            ].map(card => (
              <div key={card.label} style={{ flex: 1, borderLeft: `4px solid ${card.accent}`, borderRadius: '8px', border: '1px solid #e2e8f0', borderLeftWidth: '4px', borderLeftColor: card.accent, padding: '12px 14px' }}>
                <p style={{ fontSize: '8px', color: '#94a3b8', margin: '0 0 5px', textTransform: 'uppercase', letterSpacing: '0.9px', fontFamily: 'Arial, sans-serif', fontWeight: 700 }}>{card.label}</p>
                <p style={{ fontSize: '17px', fontWeight: 900, color: card.textColor, margin: 0, fontFamily: 'Arial, sans-serif' }}>{card.value}</p>
              </div>
            ))}
          </div>

          {/* ── PERFORMANCE TABLE ── */}
          {chartData.length > 0 && (
            <>
              <h2 style={{ fontSize: '12px', fontWeight: 800, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: 'Arial, sans-serif', margin: '0 0 10px', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>
                Performance Breakdown — {fromDate && toDate ? 'Daily' : 'Monthly'}
              </h2>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', fontFamily: 'Arial, sans-serif' }}>
                <thead>
                  <tr style={{ backgroundColor: '#1e293b' }}>
                    {['Period', 'Sales', 'Revenue', 'Profit', 'Margin'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', color: '#fff', fontWeight: 700, fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.6px', textAlign: h === 'Period' ? 'left' : 'right' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {chartData.map((row, i) => {
                    const margin = row.revenue > 0 ? ((row.profit / row.revenue) * 100).toFixed(1) : '0.0'
                    return (
                      <tr key={row.date} style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '7px 12px', fontWeight: 600, color: '#334155' }}>{row.date}</td>
                        <td style={{ padding: '7px 12px', textAlign: 'right', color: '#475569' }}>{row.sales}</td>
                        <td style={{ padding: '7px 12px', textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>{formatCurrency(row.revenue, currency)}</td>
                        <td style={{ padding: '7px 12px', textAlign: 'right', fontWeight: 700, color: row.profit >= 0 ? '#16a34a' : '#dc2626' }}>
                          {row.profit >= 0 ? '+' : ''}{formatCurrency(row.profit, currency)}
                        </td>
                        <td style={{ padding: '7px 12px', textAlign: 'right', color: '#64748b' }}>{margin}%</td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ backgroundColor: '#0f172a', borderTop: '2px solid #dc2626' }}>
                    <td style={{ padding: '9px 12px', color: '#fff', fontWeight: 800 }}>TOTAL</td>
                    <td style={{ padding: '9px 12px', textAlign: 'right', color: '#fff', fontWeight: 700 }}>
                      {chartData.reduce((s, r) => s + r.sales, 0)}
                    </td>
                    <td style={{ padding: '9px 12px', textAlign: 'right', color: '#fff', fontWeight: 800 }}>
                      {formatCurrency(chartData.reduce((s, r) => s + r.revenue, 0), currency)}
                    </td>
                    <td style={{ padding: '9px 12px', textAlign: 'right', color: '#4ade80', fontWeight: 800 }}>
                      +{formatCurrency(chartData.reduce((s, r) => s + r.profit, 0), currency)}
                    </td>
                    <td style={{ padding: '9px 12px', textAlign: 'right', color: '#94a3b8', fontWeight: 700 }}>
                      {chartData.reduce((s, r) => s + r.revenue, 0) > 0
                        ? ((chartData.reduce((s, r) => s + r.profit, 0) / chartData.reduce((s, r) => s + r.revenue, 0)) * 100).toFixed(1)
                        : '0.0'}%
                    </td>
                  </tr>
                </tfoot>
              </table>
            </>
          )}

          {/* ── FOOTER ── */}
          <div style={{ marginTop: '32px', paddingTop: '12px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
            <p style={{ fontSize: '9px', color: '#94a3b8', margin: 0, fontFamily: 'Arial, sans-serif' }}>
              {settings?.shopName ?? 'Blessed Auto Spares'} — Confidential Financial Document
            </p>
            <p style={{ fontSize: '9px', color: '#94a3b8', margin: 0, fontFamily: 'Arial, sans-serif' }}>
              {generatedAt}
            </p>
          </div>

        </div>
      </div>

    </div>
  )
}
