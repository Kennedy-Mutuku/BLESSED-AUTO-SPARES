import { useState, useMemo } from 'react'
import { Search, Package, TrendingUp, TrendingDown, ChevronDown, ChevronUp } from 'lucide-react'
import { useProducts } from '@/hooks/useProducts'
import { useSettings } from '@/hooks/useLocalSettings'
import { useSales, useCompleteSale } from '@/hooks/useSales'
import { formatCurrency } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/shared/PageHeader'
import type { Product } from '@/db/schema'
import toast from 'react-hot-toast'
import { startOfDay, endOfDay } from 'date-fns'

export function POSPage() {
  const [search, setSearch] = useState('')
  const [soldPrices, setSoldPrices] = useState<Record<string, string>>({})
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [showLog, setShowLog] = useState(true)

  const { data: products = [] } = useProducts()
  const { data: settings } = useSettings()
  const { data: allSales = [] } = useSales({ limit: 500 })
  const completeSale = useCompleteSale()
  const currency = settings?.currencySymbol ?? 'KES'

  const displayed = useMemo(() => {
    const inStock = products.filter((p) => p.stockQuantity > 0)
    const q = search.trim().toLowerCase()
    if (!q) return inStock
    return inStock.filter(
      (p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
    )
  }, [products, search])

  const todaySales = useMemo(() => {
    const start = startOfDay(new Date()).getTime()
    const end = endOfDay(new Date()).getTime()
    return allSales.filter((s) => s.soldAt >= start && s.soldAt <= end)
  }, [allSales])

  const todayRevenue = todaySales.reduce((s, x) => s + x.subtotal, 0)
  const todayProfit = todaySales.reduce((s, x) => s + x.totalProfit, 0)

  const getQty = (id: string) => quantities[id] ?? 1
  const getSoldPrice = (id: string) => soldPrices[id] ?? ''

  function computeProfit(product: Product): number | null {
    const sold = Number(getSoldPrice(product.id))
    if (!sold) return null
    return (sold - product.buyingPrice) * getQty(product.id)
  }

  async function handleSave(product: Product) {
    const soldPrice = Number(getSoldPrice(product.id))
    const qty = getQty(product.id)
    if (!soldPrice || soldPrice <= 0) return toast.error('Enter the price sold')
    if (qty > product.stockQuantity) return toast.error(`Only ${product.stockQuantity} in stock`)

    setSaving(product.id)
    try {
      await completeSale.mutateAsync({
        cartItems: [{ product: { ...product, sellingPrice: soldPrice }, quantity: qty }],
        paymentMethod: 'cash',
        amountTendered: soldPrice * qty,
        customerName: '',
        notes: '',
        createdBy: settings?.operatorName ?? 'Staff',
      })
      // Clear row inputs
      setSoldPrices((p) => { const n = { ...p }; delete n[product.id]; return n })
      setQuantities((p) => { const n = { ...p }; delete n[product.id]; return n })
      toast.success(`Saved — ${formatCurrency(soldPrice * qty, currency)}`)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="flex flex-col min-h-screen">

      {/* ── STICKY HEADER ── */}
      <div className="shrink-0 px-4 pt-4 pb-3 bg-slate-900">
        <PageHeader title="Selling" backTo="/" />
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input
            className="pl-10 h-12 text-base bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-red-500"
            placeholder="Search product by name or part number…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoComplete="off"
          />
          {search && (
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xl leading-none"
              onClick={() => setSearch('')}
            >×</button>
          )}
        </div>
        <p className="text-xs text-slate-500 mt-1.5">
          {displayed.length} item{displayed.length !== 1 ? 's' : ''} in stock
          {search && ` (filtered)`}
        </p>
      </div>

      {/* ── PRODUCT LIST ── */}
      <div className="flex-1 overflow-y-auto">
        {displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Package className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm">{search ? 'No products match your search' : 'No products in stock'}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {displayed.map((product, index) => {
              const soldPriceStr = getSoldPrice(product.id)
              const soldPrice = Number(soldPriceStr)
              const qty = getQty(product.id)
              const profit = computeProfit(product)
              const isSaving = saving === product.id
              const hasInput = soldPriceStr !== '' && soldPrice > 0

              return (
                <div key={product.id} className="flex gap-3 px-3 py-3 items-start">

                  {/* Row number */}
                  <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0 mt-1">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{index + 1}</span>
                  </div>

                  {/* Product image */}
                  {product.imageDataUrl ? (
                    <img
                      src={product.imageDataUrl}
                      alt={product.name}
                      className="w-14 h-14 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-600"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-700 shrink-0 flex items-center justify-center border border-slate-200 dark:border-slate-600">
                      <Package className="w-6 h-6 text-slate-300 dark:text-slate-500" />
                    </div>
                  )}

                  {/* Details + inputs */}
                  <div className="flex-1 min-w-0 space-y-2">

                    {/* Name + standard price */}
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm leading-tight">
                        {product.name}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                        <span>Expected price: <strong className="text-slate-700 dark:text-slate-300">{formatCurrency(product.sellingPrice, currency)}</strong></span>
                        <span className="text-slate-300 dark:text-slate-600">·</span>
                        <span>{product.stockQuantity} {product.unit} left</span>
                      </div>
                    </div>

                    {/* Quantity + Price sold row */}
                    <div className="flex gap-2 items-center">
                      {/* Qty stepper */}
                      <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-600 overflow-hidden shrink-0">
                        <button
                          className="w-8 h-9 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 text-base font-medium flex items-center justify-center"
                          onClick={() => setQuantities((p) => ({ ...p, [product.id]: Math.max(1, (p[product.id] ?? 1) - 1) }))}
                        >−</button>
                        <span className="w-7 text-center text-sm font-bold text-slate-900 dark:text-slate-100">{qty}</span>
                        <button
                          className="w-8 h-9 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 text-base font-medium flex items-center justify-center"
                          onClick={() => setQuantities((p) => ({ ...p, [product.id]: Math.min(product.stockQuantity, (p[product.id] ?? 1) + 1) }))}
                        >+</button>
                      </div>

                      {/* Price sold */}
                      <div className="relative flex-1">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">{currency}</span>
                        <Input
                          type="number"
                          inputMode="numeric"
                          min={0}
                          value={soldPriceStr}
                          onChange={(e) => setSoldPrices((p) => ({ ...p, [product.id]: e.target.value }))}
                          placeholder={`${product.sellingPrice}`}
                          className="pl-10 h-9 text-sm"
                        />
                      </div>

                      {/* Save button */}
                      <button
                        onClick={() => handleSave(product)}
                        disabled={isSaving || !hasInput}
                        className={`h-9 px-4 rounded-lg text-sm font-bold shrink-0 transition-colors ${
                          hasInput
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                        } disabled:opacity-60`}
                      >
                        {isSaving ? '…' : 'Save'}
                      </button>
                    </div>

                    {/* Profit / Loss indicator */}
                    {profit !== null && (
                      <div className={`rounded-lg px-2.5 py-1.5 text-xs ${profit >= 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                        <div className={`flex items-center gap-1.5 font-bold ${profit >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {profit >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                          {profit >= 0 ? 'Total Profit' : 'Total Loss'}:
                          <span className="text-sm">{formatCurrency(Math.abs(profit), currency)}</span>
                        </div>
                        {qty > 1 && (
                          <div className="text-slate-500 mt-0.5">
                            {qty} {product.unit} × {formatCurrency(Math.abs(soldPrice - product.buyingPrice), currency)} per {product.unit}
                            {' · '}total sold: {formatCurrency(soldPrice * qty, currency)}
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── TODAY'S SALES LOG ── */}
        <div className="px-3 pb-8 mt-4">
          <button
            onClick={() => setShowLog((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl"
          >
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
              Today's Sales
              <span className="ml-2 bg-blue-600 text-white text-xs rounded-full px-2 py-0.5">{todaySales.length}</span>
            </span>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-green-600 font-semibold">Profit: {formatCurrency(todayProfit, currency)}</span>
              <span className="text-slate-500">{formatCurrency(todayRevenue, currency)}</span>
              {showLog ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </div>
          </button>

          {showLog && (
            <div className="mt-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
              {todaySales.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">No sales recorded today yet</div>
              ) : (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700">
                      <th className="text-left px-3 py-2 text-slate-400 font-medium w-6">#</th>
                      <th className="text-left px-3 py-2 text-slate-400 font-medium">Date & Time</th>
                      <th className="text-left px-3 py-2 text-slate-400 font-medium">Item</th>
                      <th className="text-center px-2 py-2 text-slate-400 font-medium">Qty</th>
                      <th className="text-right px-3 py-2 text-slate-400 font-medium">Amount</th>
                      <th className="text-right px-3 py-2 text-slate-400 font-medium">Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {todaySales.map((sale, i) => {
                      const d = new Date(sale.soldAt)
                      const dateStr = d.toLocaleDateString('en-KE', { day: '2-digit', month: 'short' })
                      const timeStr = d.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })
                      const totalQty = sale.items.reduce((s, it) => s + it.quantity, 0)
                      const firstItem = sale.items[0]
                      return (
                        <tr key={sale.id} className="border-b last:border-0 border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                          <td className="px-3 py-2.5 text-slate-400">{i + 1}</td>
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            <div className="font-medium text-slate-700 dark:text-slate-300">{timeStr}</div>
                            <div className="text-slate-400">{dateStr}</div>
                          </td>
                          <td className="px-3 py-2.5 text-slate-700 dark:text-slate-300">
                            <div className="font-medium truncate max-w-[90px]">{firstItem?.productName}</div>
                            {sale.items.length > 1 && (
                              <div className="text-slate-400">+{sale.items.length - 1} more product{sale.items.length > 2 ? 's' : ''}</div>
                            )}
                          </td>
                          <td className="px-2 py-2.5 text-center">
                            <span className={`inline-block font-bold rounded-full px-1.5 py-0.5 ${totalQty > 1 ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'text-slate-500'}`}>
                              {totalQty}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-right font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                            {formatCurrency(sale.subtotal, currency)}
                          </td>
                          <td className={`px-3 py-2.5 text-right font-bold whitespace-nowrap ${sale.totalProfit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                            {sale.totalProfit >= 0 ? '+' : ''}{formatCurrency(sale.totalProfit, currency)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 dark:bg-slate-900 border-t-2 border-slate-200 dark:border-slate-700">
                      <td colSpan={4} className="px-3 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400">
                        TOTAL — {todaySales.length} sale{todaySales.length !== 1 ? 's' : ''}
                        {' · '}{todaySales.reduce((s, x) => s + x.items.reduce((a, i) => a + i.quantity, 0), 0)} items sold
                      </td>
                      <td className="px-3 py-2.5 text-right text-xs font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        {formatCurrency(todayRevenue, currency)}
                      </td>
                      <td className="px-3 py-2.5 text-right text-xs font-bold text-green-600 whitespace-nowrap">
                        +{formatCurrency(todayProfit, currency)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
