import { useState, useMemo } from 'react'
import { FileText, Search, Download } from 'lucide-react'
import {
  format, startOfDay, subDays,
  startOfWeek, endOfWeek, startOfMonth,
} from 'date-fns'
import { useSales } from '@/hooks/useSales'
import { useSettings } from '@/hooks/useLocalSettings'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageHeader } from '@/components/shared/PageHeader'
import { SaleDetailModal } from './SaleDetailModal'
import { formatCurrency } from '@/lib/utils'
import { salesToCSV, downloadCSV } from '@/lib/exportHelpers'
import type { Sale } from '@/db/schema'

const METHOD_LABEL: Record<string, string> = {
  cash: 'Cash', mpesa: 'M-Pesa', card: 'Card', credit: 'Credit',
}

type SectionType = 'today' | 'yesterday' | 'day' | 'week' | 'month'

interface Section {
  key: string
  type: SectionType
  label: string
  sublabel: string
  sales: Sale[]
  revenue: number
  profit: number
}

function buildSections(sales: Sale[]): Section[] {
  const now             = new Date()
  const todayStart      = startOfDay(now)
  const yesterdayStart  = startOfDay(subDays(now, 1))
  const thisWeekStart   = startOfWeek(now, { weekStartsOn: 1 })
  const thisMonthStart  = startOfMonth(now)

  const ordered = [...sales].sort((a, b) => b.soldAt - a.soldAt)

  const sections: Section[] = []
  const map = new Map<string, Section>()

  function getOrCreate(
    key: string, type: SectionType, label: string, sublabel: string
  ): Section {
    if (!map.has(key)) {
      const s: Section = { key, type, label, sublabel, sales: [], revenue: 0, profit: 0 }
      map.set(key, s)
      sections.push(s)
    }
    return map.get(key)!
  }

  for (const sale of ordered) {
    const d        = new Date(sale.soldAt)
    const dayStart = startOfDay(d)
    let section: Section

    if (dayStart >= todayStart) {
      section = getOrCreate('today', 'today', 'Today', format(d, 'EEEE, d MMM yyyy'))

    } else if (dayStart >= yesterdayStart) {
      section = getOrCreate('yesterday', 'yesterday', 'Yesterday', format(d, 'EEEE, d MMM yyyy'))

    } else if (dayStart >= thisWeekStart) {
      // Earlier this week — individual day
      const key = format(dayStart, 'yyyy-MM-dd')
      section = getOrCreate(key, 'day', format(d, 'EEEE'), format(d, 'd MMM yyyy'))

    } else if (dayStart >= thisMonthStart) {
      // This month, but a past week — group by calendar week
      const wStart = startOfWeek(d, { weekStartsOn: 1 })
      const wEnd   = endOfWeek(d,   { weekStartsOn: 1 })
      const key    = format(wStart, 'yyyy-ww')
      const label  = `${format(wStart, 'd')} – ${format(wEnd, 'd MMM')}`
      section = getOrCreate(key, 'week', label, format(wStart, 'yyyy'))

    } else {
      // Previous complete months
      const mStart = startOfMonth(d)
      const key    = format(mStart, 'yyyy-MM')
      section = getOrCreate(key, 'month', format(d, 'MMMM'), format(d, 'yyyy'))
    }

    section.sales.push(sale)
    section.revenue += sale.subtotal
    section.profit  += sale.totalProfit
  }

  return sections
}

export function SalesLogPage() {
  const [search, setSearch]             = useState('')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [selectedSale, setSelectedSale]   = useState<Sale | null>(null)

  const { data: sales = [], isLoading } = useSales({ limit: 1000 })
  const { data: settings }              = useSettings()
  const currency                        = settings?.currencySymbol ?? 'KES'

  const filtered = useMemo(() => {
    return sales.filter(s => {
      const q = search.toLowerCase()
      const matchesSearch =
        !q ||
        s.receiptNumber.toLowerCase().includes(q) ||
        s.customerName.toLowerCase().includes(q) ||
        s.items.some(i => i.productName.toLowerCase().includes(q))
      const matchesPayment = paymentFilter === 'all' || s.paymentMethod === paymentFilter
      return matchesSearch && matchesPayment
    })
  }, [sales, search, paymentFilter])

  const sections = useMemo(() => buildSections(filtered), [filtered])

  const grandRevenue = filtered.reduce((s, x) => s + x.subtotal, 0)
  const grandProfit  = filtered.reduce((s, x) => s + x.totalProfit, 0)

  function handleExport() {
    downloadCSV(salesToCSV(filtered, currency), `sales-${Date.now()}.csv`)
  }

  return (
    <div className="flex flex-col h-dvh bg-white overflow-hidden">

      {/* ── HEADER ── */}
      <div className="shrink-0 px-4 pt-4 pb-3 bg-red-600">
        <PageHeader
          title="Sales Log"
          backTo="/"
          actions={
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-white/40 hover:border-white/70 text-white text-[12px] font-medium transition-colors"
            >
              <Download className="h-3.5 w-3.5" /> CSV
            </button>
          }
        />
      </div>

      {/* ── SEARCH + FILTER ── */}
      <div className="shrink-0 bg-white border-b border-slate-100 px-4 py-2.5 flex gap-2 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Receipt, customer, product…"
            className="w-full h-8 pl-8 pr-3 bg-slate-50 border border-slate-200 rounded-lg text-[12px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-100"
          />
        </div>
        <select
          value={paymentFilter}
          onChange={e => setPaymentFilter(e.target.value)}
          className="h-8 px-2 bg-slate-50 border border-slate-200 rounded-lg text-[12px] text-slate-700 focus:outline-none focus:border-red-400 shrink-0"
        >
          <option value="all">All</option>
          <option value="cash">Cash</option>
          <option value="mpesa">M-Pesa</option>
          <option value="card">Card</option>
          <option value="credit">Credit</option>
        </select>
      </div>

      {/* ── COLUMN HEADERS ── */}
      <div className="shrink-0 flex items-center px-4 py-1.5 bg-slate-50 border-b border-slate-200">
        <div className="w-[68px] shrink-0 text-[9px] font-semibold uppercase tracking-wider text-slate-400">Time</div>
        <div className="flex-1 min-w-0 text-[9px] font-semibold uppercase tracking-wider text-slate-400">Item</div>
        <div className="w-[34px] shrink-0 text-center text-[9px] font-semibold uppercase tracking-wider text-slate-400">Qty</div>
        <div className="w-[82px] shrink-0 text-right text-[9px] font-semibold uppercase tracking-wider text-slate-400">Amount</div>
        <div className="w-[68px] shrink-0 text-right text-[9px] font-semibold uppercase tracking-wider text-slate-400">Profit</div>
      </div>

      {/* ── CONTENT ── */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="text-center py-16 text-[12px] text-slate-400">Loading…</div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={FileText} title="No sales found" description="Sales will appear here once you start selling" />
        ) : (
          <>
            {sections.map(section => (
              <div key={section.key}>

                {/* ── SECTION HEADER ── */}
                {section.type === 'month' ? (
                  <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-700">
                    <div>
                      <p className="text-[12px] font-bold text-white tracking-wide">{section.label}</p>
                      <p className="text-[9px] text-slate-400 mt-0.5">{section.sublabel} · {section.sales.length} sales</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] font-bold text-emerald-400 tabular-nums">+{formatCurrency(section.profit, currency)}</p>
                      <p className="text-[9px] text-slate-400 tabular-nums mt-0.5">{formatCurrency(section.revenue, currency)}</p>
                    </div>
                  </div>

                ) : section.type === 'week' ? (
                  <div className="flex items-center justify-between px-4 py-2 bg-slate-100 border-b border-slate-200">
                    <div>
                      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Week</p>
                      <p className="text-[12px] font-bold text-slate-700">{section.label}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] font-bold text-emerald-600 tabular-nums">+{formatCurrency(section.profit, currency)}</p>
                      <p className="text-[9px] text-slate-400 tabular-nums mt-0.5">{section.sales.length} sales</p>
                    </div>
                  </div>

                ) : (
                  <div className="flex items-center justify-between px-4 py-2 bg-red-50 border-b border-red-100 border-l-4 border-l-red-500">
                    <div>
                      <p className="text-[12px] font-bold text-red-700">{section.label}</p>
                      <p className="text-[10px] text-red-400 mt-0.5">{section.sublabel}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] font-semibold text-emerald-700 tabular-nums">+{formatCurrency(section.profit, currency)}</p>
                      <p className="text-[9px] text-red-400 tabular-nums mt-0.5">{section.sales.length} sale{section.sales.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                )}

                {/* ── TRANSACTIONS IN THIS SECTION ── */}
                <div className="divide-y divide-slate-50">
                  {section.sales.map(sale => {
                    const d        = new Date(sale.soldAt)
                    const timeStr  = d.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })
                    const dateStr  = d.toLocaleDateString('en-KE', { day: '2-digit', month: 'short' })
                    const totalQty = sale.items.reduce((s, it) => s + it.quantity, 0)
                    const first    = sale.items[0]

                    return (
                      <button
                        key={sale.id}
                        className="w-full flex items-center px-4 py-2.5 hover:bg-slate-50 active:bg-red-50 transition-colors text-left"
                        onClick={() => setSelectedSale(sale)}
                      >
                        <div className="w-[68px] shrink-0">
                          <p className="text-[12px] font-semibold text-slate-700 leading-tight">{timeStr}</p>
                          {(section.type === 'week' || section.type === 'month') && (
                            <p className="text-[10px] text-slate-400 leading-tight mt-0.5">{dateStr}</p>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 px-2">
                          <p className="text-[12px] font-medium text-slate-800 truncate leading-tight">{first?.productName}</p>
                          <p className="text-[10px] text-slate-400 leading-tight mt-0.5 truncate">
                            {METHOD_LABEL[sale.paymentMethod]}{sale.items.length > 1 ? ` · +${sale.items.length - 1} more` : ''}
                          </p>
                        </div>
                        <div className="w-[34px] shrink-0 text-center">
                          <p className="text-[12px] font-semibold text-slate-600 tabular-nums">{totalQty}</p>
                        </div>
                        <div className="w-[82px] shrink-0 text-right">
                          <p className="text-[12px] font-semibold text-slate-800 tabular-nums">{formatCurrency(sale.subtotal, currency)}</p>
                        </div>
                        <div className="w-[68px] shrink-0 text-right">
                          <p className={`text-[12px] font-semibold tabular-nums ${sale.totalProfit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                            {sale.totalProfit >= 0 ? '+' : ''}{formatCurrency(sale.totalProfit, currency)}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>

              </div>
            ))}

            {/* ── GRAND TOTAL ── */}
            <div className="flex items-center px-4 py-3 border-t-2 border-slate-300 bg-slate-50 mt-1">
              <div className="w-[68px] shrink-0">
                <p className="text-[10px] font-semibold text-slate-500">{filtered.length} total</p>
              </div>
              <div className="flex-1 min-w-0 px-2">
                <p className="text-[10px] font-semibold text-slate-400">All time</p>
              </div>
              <div className="w-[34px] shrink-0" />
              <div className="w-[82px] shrink-0 text-right">
                <p className="text-[12px] font-bold text-slate-800 tabular-nums">{formatCurrency(grandRevenue, currency)}</p>
              </div>
              <div className="w-[68px] shrink-0 text-right">
                <p className="text-[12px] font-bold text-emerald-600 tabular-nums">+{formatCurrency(grandProfit, currency)}</p>
              </div>
            </div>

            <div className="h-8" />
          </>
        )}
      </div>

      <SaleDetailModal open={!!selectedSale} onClose={() => setSelectedSale(null)} sale={selectedSale} />
    </div>
  )
}
