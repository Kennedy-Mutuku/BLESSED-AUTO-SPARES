import { useState, useMemo } from 'react'
import { FileText, Search, Download } from 'lucide-react'
import { useSales } from '@/hooks/useSales'
import { useSettings } from '@/hooks/useLocalSettings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageHeader } from '@/components/shared/PageHeader'
import { SaleDetailModal } from './SaleDetailModal'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { salesToCSV, downloadCSV } from '@/lib/exportHelpers'
import type { Sale } from '@/db/schema'

const PAYMENT_COLORS: Record<string, string> = {
  cash: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  mpesa: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  card: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  credit: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
}

export function SalesLogPage() {
  const [search, setSearch] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)

  const { data: sales = [], isLoading } = useSales({ limit: 200 })
  const { data: settings } = useSettings()
  const currency = settings?.currencySymbol ?? 'KES'

  const filtered = useMemo(() => {
    return sales.filter((s) => {
      const q = search.toLowerCase()
      const matchesSearch =
        !q ||
        s.receiptNumber.toLowerCase().includes(q) ||
        s.customerName.toLowerCase().includes(q) ||
        s.items.some((i) => i.productName.toLowerCase().includes(q))
      const matchesPayment = paymentFilter === 'all' || s.paymentMethod === paymentFilter
      return matchesSearch && matchesPayment
    })
  }, [sales, search, paymentFilter])

  const totalRevenue = filtered.reduce((s, sale) => s + sale.subtotal, 0)
  const totalProfit = filtered.reduce((s, sale) => s + sale.totalProfit, 0)

  function handleExport() {
    const csv = salesToCSV(filtered, currency)
    downloadCSV(csv, `sales-${Date.now()}.csv`)
  }

  return (
    <div className="flex flex-col h-dvh bg-white overflow-hidden">

      {/* ── STICKY HEADER ── */}
      <div className="shrink-0 px-4 pt-4 bg-red-600">
        <PageHeader
          title="Sales Log"
          subtitle={`${filtered.length} sales`}
          backTo="/"
          actions={
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-white/40 hover:border-white/70 text-white text-sm font-medium transition-colors"
            >
              <Download className="h-4 w-4" /> CSV
            </button>
          }
        />
      </div>

      {/* ── SCROLLABLE CONTENT ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

        {/* Summary Row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl p-3 border border-slate-100">
            <div className="text-xs text-slate-500 mb-1">Revenue (filtered)</div>
            <div className="text-lg font-bold text-slate-900">{formatCurrency(totalRevenue, currency)}</div>
          </div>
          <div className="bg-white rounded-xl p-3 border border-slate-100">
            <div className="text-xs text-slate-500 mb-1">Profit (filtered)</div>
            <div className="text-lg font-bold text-green-600">{formatCurrency(totalProfit, currency)}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input className="pl-9" placeholder="Search receipt, customer, product..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={paymentFilter} onValueChange={setPaymentFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Payment method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payment Methods</SelectItem>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="mpesa">M-Pesa</SelectItem>
              <SelectItem value="card">Card</SelectItem>
              <SelectItem value="credit">Credit</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sales List */}
        {isLoading ? (
          <div className="text-center py-12 text-slate-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={FileText} title="No sales found" description="Sales will appear here once you start selling" />
        ) : (
          <div className="space-y-2 pb-6">
            {filtered.map((sale) => (
              <button
                key={sale.id}
                className="w-full bg-white rounded-xl p-4 border border-slate-100 text-left hover:border-red-200 transition-colors"
                onClick={() => setSelectedSale(sale)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-slate-900">{sale.receiptNumber}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PAYMENT_COLORS[sale.paymentMethod]}`}>
                        {sale.paymentMethod.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500">{formatDateTime(sale.soldAt)}</div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {sale.items.length} item{sale.items.length !== 1 ? 's' : ''}
                      {sale.customerName ? ` • ${sale.customerName}` : ''}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-semibold text-slate-900">{formatCurrency(sale.subtotal, currency)}</div>
                    <div className="text-xs text-green-600">+{formatCurrency(sale.totalProfit, currency)}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <SaleDetailModal open={!!selectedSale} onClose={() => setSelectedSale(null)} sale={selectedSale} />
    </div>
  )
}
