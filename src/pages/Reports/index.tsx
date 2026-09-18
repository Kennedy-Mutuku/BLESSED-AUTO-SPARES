import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { TrendingUp, Package, DollarSign } from 'lucide-react'
import { db } from '@/db/database'
import { useSettings } from '@/hooks/useLocalSettings'
import { PageHeader } from '@/components/shared/PageHeader'
import { formatCurrency } from '@/lib/utils'

export function ReportsPage() {
  const { data: settings } = useSettings()
  const currency = settings?.currencySymbol ?? 'KES'

  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const { data: stats, isLoading } = useQuery({
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
      return { profitEarned, stockWorth, expectedProfit, salesCount: sales.length }
    },
  })

  const formatDisplay = (dateStr: string) =>
    new Date(dateStr + 'T00:00:00').toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div className="flex flex-col h-dvh bg-slate-50 overflow-hidden">

      {/* ── HEADER ── */}
      <div className="shrink-0 px-4 pt-4 bg-red-600">
        <PageHeader title="Reports" backTo="/" />
      </div>

      {/* ── CONTENT ── */}
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-5">

        {/* Page intro */}
        <div>
          <h2 className="text-[13px] font-bold text-slate-500 uppercase tracking-widest">Financial Summary</h2>
          <p className="text-[11px] text-slate-400 mt-0.5">Select a date range to analyse your performance</p>
        </div>

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

          {/* Active range pill */}
          <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
            <span className="text-[11px] text-red-700 font-semibold">
              {fromDate && toDate
                ? `${formatDisplay(fromDate)} — ${formatDisplay(toDate)}`
                : 'All Time'}
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

          {/* Stock Worth */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center shrink-0">
              <Package className="w-6 h-6 text-slate-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Total Stock Worth</div>
              <div className="text-[24px] font-extrabold text-slate-900 tabular-nums leading-tight">
                {isLoading ? <span className="text-slate-300">—</span> : formatCurrency(stats?.stockWorth ?? 0, currency)}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Current inventory valued at buying price</div>
            </div>
          </div>

          {/* Expected Profit */}
          <div className="bg-blue-50 rounded-2xl border border-blue-100 shadow-sm p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center shrink-0">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-0.5">Expected Profit</div>
              <div className="text-[24px] font-extrabold text-blue-700 tabular-nums leading-tight">
                {isLoading ? <span className="text-blue-200">—</span> : formatCurrency(stats?.expectedProfit ?? 0, currency)}
              </div>
              <div className="text-[10px] text-blue-400 mt-0.5">Potential profit if all current stock is sold</div>
            </div>
          </div>

          {/* Profit Earned */}
          <div className="bg-green-50 rounded-2xl border border-green-100 shadow-sm p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center shrink-0">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-widest text-green-500 mb-0.5">Profit Earned</div>
              <div className="text-[24px] font-extrabold text-green-700 tabular-nums leading-tight">
                {isLoading ? <span className="text-green-200">—</span> : formatCurrency(stats?.profitEarned ?? 0, currency)}
              </div>
              <div className="text-[10px] text-green-500 mt-0.5">Actual profit from sales in selected period</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
