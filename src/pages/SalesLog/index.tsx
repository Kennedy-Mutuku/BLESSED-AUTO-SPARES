import { useState, useMemo, useRef } from 'react'
import { FileText, Search, FileDown, Trash2, AlertTriangle } from 'lucide-react'
import {
  format, startOfDay, subDays,
  startOfWeek, endOfWeek, startOfMonth,
} from 'date-fns'
import { useSales, useResetAllSales } from '@/hooks/useSales'
import { useSettings } from '@/hooks/useLocalSettings'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageHeader } from '@/components/shared/PageHeader'
import { SaleDetailModal } from './SaleDetailModal'
import { formatCurrency } from '@/lib/utils'
import { exportHtmlAsPdf } from '@/lib/pdfExport'

import type { Sale } from '@/db/schema'
import toast from 'react-hot-toast'

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
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [showReset, setShowReset]         = useState(false)
  const [resetInput, setResetInput]       = useState('')

  const { data: sales = [], isLoading } = useSales({ limit: 1000 })
  const { data: settings }              = useSettings()
  const currency                        = settings?.currencySymbol ?? 'KES'
  const resetMutation                   = useResetAllSales()

  const printRef = useRef<HTMLDivElement>(null)

  async function handleExportPdf() {
    if (printRef.current) {
      await exportHtmlAsPdf(printRef.current.innerHTML, 'Sales-Log.pdf')
    }
  }

  async function handleReset() {
    try {
      await resetMutation.mutateAsync()
      setShowReset(false)
      setResetInput('')
      toast.success('All sales cleared. Stock restored.')
    } catch {
      toast.error('Reset failed. Please try again.')
    }
  }

  const filtered = useMemo(() => {
    return sales.filter(s => {
      const q = search.toLowerCase()
      return (
        !q ||
        s.receiptNumber.toLowerCase().includes(q) ||
        s.customerName.toLowerCase().includes(q) ||
        s.items.some(i => i.productName.toLowerCase().includes(q))
      )
    })
  }, [sales, search])

  const sections = useMemo(() => buildSections(filtered), [filtered])

  // Flat day-by-day groups used only for the PDF template
  const printDays = useMemo(() => {
    const sorted = [...filtered].sort((a, b) => b.soldAt - a.soldAt)
    const map = new Map<string, { label: string; key: string; sales: Sale[]; revenue: number; profit: number }>()
    for (const sale of sorted) {
      const key   = format(new Date(sale.soldAt), 'yyyy-MM-dd')
      const label = format(new Date(sale.soldAt), 'EEEE, d MMMM yyyy')
      if (!map.has(key)) map.set(key, { label, key, sales: [], revenue: 0, profit: 0 })
      const entry = map.get(key)!
      entry.sales.push(sale)
      entry.revenue += sale.subtotal
      entry.profit  += sale.totalProfit
    }
    return Array.from(map.values())
  }, [filtered])

  const grandRevenue = filtered.reduce((s, x) => s + x.subtotal, 0)
  const grandProfit  = filtered.reduce((s, x) => s + x.totalProfit, 0)

  return (
    <div className="flex flex-col h-dvh bg-white overflow-hidden">

      {/* ── HEADER ── */}
      <div className="shrink-0 px-4 pt-4 pb-3 bg-red-600">
        <PageHeader
          title="Sales Log"
          backTo="/"
          actions={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportPdf}
                className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-white/40 hover:border-white/70 text-white text-[12px] font-medium transition-colors"
              >
                <FileDown className="h-3.5 w-3.5" /> PDF
              </button>
              <button
                type="button"
                onClick={() => { setShowReset(true); setResetInput('') }}
                className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-white/40 bg-white/10 hover:bg-white/20 text-white text-[12px] font-medium transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          }
        />
      </div>

      {/* ── SEARCH ── */}
      <div className="shrink-0 bg-white border-b border-slate-100 px-4 py-2.5">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Receipt, customer, product…"
            className="w-full h-8 pl-8 pr-3 bg-slate-50 border border-slate-200 rounded-lg text-[12px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-100"
          />
        </div>
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

      {/* ── PRINT TEMPLATE (off-screen, not display:none) ── */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0, width: '820px' }}>
        <div ref={printRef} style={{ fontFamily: 'Arial, sans-serif', color: '#0f172a', padding: '28px 36px', width: '820px', background: '#fff' }}>

          {/* ── LETTERHEAD ── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '4px solid #dc2626', paddingBottom: '14px', marginBottom: '18px' }}>
            <div>
              <div style={{ fontSize: '22px', fontWeight: 900, color: '#dc2626', letterSpacing: '1.5px', textTransform: 'uppercase', lineHeight: 1 }}>
                {settings?.shopName ?? 'Blessed Auto Spares'}
              </div>
              <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px', letterSpacing: '0.4px' }}>
                Auto Parts &amp; Accessories
              </div>
              {(settings?.shopAddress || settings?.shopPhone) && (
                <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                  {settings?.shopAddress ?? ''}{settings?.shopPhone ? '   ·   ' + settings.shopPhone : ''}
                </div>
              )}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b', letterSpacing: '0.5px' }}>SALES LOG REPORT</div>
              <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>
                Generated: {format(new Date(), 'EEEE, d MMMM yyyy')} at {format(new Date(), 'HH:mm')}
              </div>
              {filtered.length > 0 && (
                <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                  Period: {format(new Date(Math.min(...filtered.map(s => s.soldAt))), 'd MMM yyyy')}
                  {' — '}
                  {format(new Date(Math.max(...filtered.map(s => s.soldAt))), 'd MMM yyyy')}
                </div>
              )}
            </div>
          </div>

          {/* ── SUMMARY BOXES ── */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '22px' }}>
            {[
              { label: 'Total Transactions', value: String(filtered.length), color: '#1e293b', bg: '#f8fafc' },
              { label: 'Total Items Sold',   value: String(filtered.reduce((s, x) => s + x.items.reduce((a, b) => a + b.quantity, 0), 0)), color: '#1e293b', bg: '#f8fafc' },
              { label: 'Total Revenue',      value: formatCurrency(grandRevenue, currency), color: '#1e293b', bg: '#f0f9ff' },
              { label: 'Total Profit',       value: formatCurrency(grandProfit, currency),  color: '#16a34a', bg: '#f0fdf4' },
            ].map(box => (
              <div key={box.label} style={{ flex: 1, background: box.bg, border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 14px' }}>
                <div style={{ fontSize: '8px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>{box.label}</div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: box.color }}>{box.value}</div>
              </div>
            ))}
          </div>

          {/* ── DAILY SECTIONS ── */}
          {printDays.map(day => (
            <div key={day.key} style={{ marginBottom: '22px' }}>

              {/* Day header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1e293b', padding: '8px 12px', borderRadius: '6px 6px 0 0' }}>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.4px' }}>{day.label}</span>
                  <span style={{ fontSize: '9px', color: '#94a3b8', marginLeft: '12px' }}>
                    {day.sales.length} transaction{day.sales.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '24px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#e2e8f0' }}>
                    Revenue: {formatCurrency(day.revenue, currency)}
                  </span>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#4ade80' }}>
                    Profit: +{formatCurrency(day.profit, currency)}
                  </span>
                </div>
              </div>

              {/* Sales table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', border: '1px solid #e2e8f0', borderTop: 'none' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9' }}>
                    {[
                      { h: 'Time',       align: 'left'  },
                      { h: 'Receipt No.',align: 'left'  },
                      { h: 'Customer',   align: 'left'  },
                      { h: 'Product',    align: 'left'  },
                      { h: 'SKU',        align: 'left'  },
                      { h: 'Qty',        align: 'right' },
                      { h: 'Unit Price', align: 'right' },
                      { h: 'Payment',    align: 'left'  },
                      { h: 'Amount',     align: 'right' },
                      { h: 'Profit',     align: 'right' },
                    ].map(({ h, align }) => (
                      <th key={h} style={{ padding: '5px 8px', fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: '#475569', borderBottom: '1px solid #e2e8f0', textAlign: align as 'left' | 'right' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {day.sales.flatMap((sale, si) => {
                    const timeStr = format(new Date(sale.soldAt), 'HH:mm')
                    const rowBg   = si % 2 === 0 ? '#ffffff' : '#f8fafc'
                    return sale.items.map((item, ii) => (
                      <tr key={`${sale.id}-${ii}`} style={{ background: rowBg, borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '5px 8px', color: '#475569', whiteSpace: 'nowrap' }}>{ii === 0 ? timeStr : ''}</td>
                        <td style={{ padding: '5px 8px', fontFamily: 'monospace', fontSize: '9px', color: '#64748b' }}>{ii === 0 ? sale.receiptNumber : ''}</td>
                        <td style={{ padding: '5px 8px', color: '#475569' }}>{ii === 0 ? (sale.customerName || '—') : ''}</td>
                        <td style={{ padding: '5px 8px', color: '#0f172a', fontWeight: 600 }}>{item.productName}</td>
                        <td style={{ padding: '5px 8px', fontFamily: 'monospace', fontSize: '9px', color: '#94a3b8' }}>{item.sku}</td>
                        <td style={{ padding: '5px 8px', textAlign: 'right', color: '#334155' }}>{item.quantity}</td>
                        <td style={{ padding: '5px 8px', textAlign: 'right', color: '#334155' }}>{formatCurrency(item.sellingPriceSnapshot, currency)}</td>
                        <td style={{ padding: '5px 8px', color: '#64748b' }}>{ii === 0 ? METHOD_LABEL[sale.paymentMethod] : ''}</td>
                        <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>{ii === 0 ? formatCurrency(sale.subtotal, currency) : ''}</td>
                        <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 700, color: sale.totalProfit >= 0 ? '#16a34a' : '#dc2626' }}>
                          {ii === 0 ? `${sale.totalProfit >= 0 ? '+' : ''}${formatCurrency(sale.totalProfit, currency)}` : ''}
                        </td>
                      </tr>
                    ))
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#f1f5f9', borderTop: '2px solid #cbd5e1' }}>
                    <td colSpan={8} style={{ padding: '6px 8px', fontSize: '9px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Day Total — {day.sales.length} transaction{day.sales.length !== 1 ? 's' : ''}
                    </td>
                    <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 800, color: '#0f172a', fontSize: '10px' }}>
                      {formatCurrency(day.revenue, currency)}
                    </td>
                    <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 800, color: '#16a34a', fontSize: '10px' }}>
                      +{formatCurrency(day.profit, currency)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ))}

          {/* ── GRAND TOTAL ── */}
          {filtered.length > 0 && (
            <div style={{ marginTop: '8px', background: '#1e293b', borderRadius: '8px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '5px solid #dc2626' }}>
              <div style={{ color: '#fff', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
                Grand Total — {filtered.length} Transactions
              </div>
              <div style={{ display: 'flex', gap: '32px' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '8px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Revenue</div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#fff' }}>{formatCurrency(grandRevenue, currency)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '8px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Profit</div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#4ade80' }}>+{formatCurrency(grandProfit, currency)}</div>
                </div>
              </div>
            </div>
          )}

          {/* ── FOOTER ── */}
          <div style={{ marginTop: '24px', borderTop: '1px solid #e2e8f0', paddingTop: '10px', display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '8px', color: '#94a3b8' }}>
              {settings?.shopName ?? 'Blessed Auto Spares'} · Sales Log · Confidential
            </div>
            <div style={{ fontSize: '8px', color: '#94a3b8' }}>
              Printed on {format(new Date(), 'EEEE, d MMMM yyyy')} at {format(new Date(), 'HH:mm')}
            </div>
          </div>

        </div>
      </div>

      {/* ── RESET CONFIRMATION MODAL ── */}
      {showReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-5">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">

            {/* Top danger bar */}
            <div className="bg-red-600 px-5 py-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-[15px] font-black text-white uppercase tracking-wide">Reset All Data</p>
                <p className="text-[11px] text-red-200 mt-0.5">This cannot be undone</p>
              </div>
            </div>

            {/* Body */}
            <div className="px-5 py-5 space-y-4">
              <p className="text-[13px] text-slate-700 leading-relaxed">
                This will permanently <span className="font-bold text-red-600">delete all {sales.length} sale{sales.length !== 1 ? 's' : ''}</span> and restore every product's stock back to its pre-sale quantity.
              </p>

              <div className="bg-slate-50 rounded-xl border border-slate-200 px-4 py-3 space-y-1.5">
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                  All sales records deleted
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                  All stock quantities restored
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                  Sales history wiped permanently
                </div>
              </div>

              <div>
                <p className="text-[11px] font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
                  Type <span className="text-red-600 font-black">DELETE</span> to confirm
                </p>
                <input
                  type="text"
                  value={resetInput}
                  onChange={e => setResetInput(e.target.value)}
                  placeholder="Type DELETE here"
                  autoComplete="off"
                  autoCapitalize="characters"
                  className="w-full h-11 px-3 border-2 rounded-xl text-[14px] font-bold tracking-widest text-center focus:outline-none transition-colors placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-300"
                  style={{
                    borderColor: resetInput === 'DELETE' ? '#dc2626' : '#e2e8f0',
                    color:       resetInput === 'DELETE' ? '#dc2626' : '#0f172a',
                  }}
                />
              </div>

              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => { setShowReset(false); setResetInput('') }}
                  className="flex-1 h-11 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={resetInput !== 'DELETE' || resetMutation.isPending}
                  className={`flex-1 h-11 rounded-xl text-[13px] font-bold transition-colors ${
                    resetInput === 'DELETE' && !resetMutation.isPending
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                  }`}
                >
                  {resetMutation.isPending ? 'Resetting…' : 'Reset Everything'}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
