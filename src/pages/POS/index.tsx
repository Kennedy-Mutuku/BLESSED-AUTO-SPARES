import { useState, useMemo } from 'react'
import { Search, Package, ChevronDown, ChevronUp } from 'lucide-react'
import { useProducts } from '@/hooks/useProducts'
import { useSettings } from '@/hooks/useLocalSettings'
import { useSales, useCompleteSale } from '@/hooks/useSales'
import { formatCurrency } from '@/lib/utils'
import { PageHeader } from '@/components/shared/PageHeader'
import type { Product } from '@/db/schema'
import toast from 'react-hot-toast'
import { startOfDay, endOfDay } from 'date-fns'

export function POSPage() {
  const [search, setSearch]         = useState('')
  const [soldPrices, setSoldPrices] = useState<Record<string, string>>({})
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [saving, setSaving]         = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const { data: products = [] } = useProducts()
  const { data: settings }      = useSettings()
  const { data: allSales = [] } = useSales({ limit: 500 })
  const completeSale            = useCompleteSale()
  const currency                = settings?.currencySymbol ?? 'KES'

  const displayed = useMemo(() => {
    const inStock = products.filter(p => p.stockQuantity > 0)
    const q = search.trim().toLowerCase()
    if (!q) return inStock
    return inStock.filter(p =>
      p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
    )
  }, [products, search])

  const todaySales = useMemo(() => {
    const start = startOfDay(new Date()).getTime()
    const end   = endOfDay(new Date()).getTime()
    return allSales.filter(s => s.soldAt >= start && s.soldAt <= end)
  }, [allSales])

  const todayRevenue = todaySales.reduce((s, x) => s + x.subtotal, 0)
  const todayProfit  = todaySales.reduce((s, x) => s + x.totalProfit, 0)

  const getQty       = (id: string) => quantities[id] ?? 1
  const getSoldPrice = (id: string) => soldPrices[id] ?? ''

  function computeProfit(product: Product): number | null {
    const sold = Number(getSoldPrice(product.id))
    if (!sold) return null
    return (sold - product.buyingPrice) * getQty(product.id)
  }

  async function handleSave(product: Product) {
    const soldPrice = Number(getSoldPrice(product.id))
    const qty       = getQty(product.id)
    if (!soldPrice || soldPrice <= 0) return toast.error('Enter the selling price')
    if (qty > product.stockQuantity)  return toast.error(`Only ${product.stockQuantity} in stock`)
    setSaving(product.id)
    try {
      await completeSale.mutateAsync({
        cartItems:      [{ product: { ...product, sellingPrice: soldPrice }, quantity: qty }],
        paymentMethod:  'cash',
        amountTendered: soldPrice * qty,
        customerName:   '',
        notes:          '',
        createdBy:      settings?.operatorName ?? 'Staff',
      })
      setSoldPrices(p => { const n = { ...p }; delete n[product.id]; return n })
      setQuantities(p => { const n = { ...p }; delete n[product.id]; return n })
      setExpandedId(null)
      toast.success(`Sold — ${formatCurrency(soldPrice * qty, currency)}`)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="flex flex-col h-dvh bg-white overflow-hidden">

      {/* ── HEADER ── */}
      <div className="shrink-0 bg-red-600 px-4 pt-4 pb-3">
        <PageHeader title="Selling" backTo="/" />
        <div className="relative mt-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-300 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or SKU…"
            autoComplete="off"
            className="w-full h-10 pl-9 pr-8 bg-white/15 border border-white/20 rounded-lg text-white text-[13px] placeholder:text-white/50 focus:outline-none focus:bg-white/20"
          />
          {search && (
            <button onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white text-xl leading-none">×</button>
          )}
        </div>
      </div>

      {/* ── TODAY'S STATS ── */}
      <div className="shrink-0 bg-white border-b border-slate-100 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span className="text-[13px] font-bold text-slate-800 tabular-nums">{todaySales.length}</span>
          <span className="text-[11px] text-slate-400 ml-0.5">sale{todaySales.length !== 1 ? 's' : ''} today</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[11px] text-slate-400 leading-none mb-0.5">Revenue</p>
            <p className="text-[13px] font-bold text-slate-800 tabular-nums leading-none">{formatCurrency(todayRevenue, currency)}</p>
          </div>
          <div className="w-px h-7 bg-slate-100" />
          <div className="text-right">
            <p className="text-[11px] text-slate-400 leading-none mb-0.5">Profit</p>
            <p className="text-[13px] font-bold text-emerald-600 tabular-nums leading-none">{formatCurrency(todayProfit, currency)}</p>
          </div>
        </div>
      </div>

      {/* ── PRODUCT LIST ── */}
      <div className="flex-1 overflow-y-auto">
        {displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2 text-slate-300">
            <Package className="w-8 h-8" />
            <p className="text-[12px] text-slate-400">{search ? 'No products match' : 'No products in stock'}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {displayed.map((product, index) => {
              const soldPriceStr = getSoldPrice(product.id)
              const soldPrice    = Number(soldPriceStr)
              const qty          = getQty(product.id)
              const profit       = computeProfit(product)
              const isSaving     = saving === product.id
              const hasPrice     = soldPriceStr !== '' && soldPrice > 0
              const isExpanded   = expandedId === product.id
              const isLow        = product.stockQuantity <= product.reorderLevel

              return (
                <div key={product.id}>

                  {/* ── COMPACT ROW ── */}
                  <button
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-left hover:bg-slate-50 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : product.id)}
                  >
                    <span className="text-[10px] text-slate-300 font-medium w-4 text-right shrink-0 tabular-nums">{index + 1}</span>
                    <span className="flex-1 text-[13px] font-medium text-slate-800 truncate">{product.name}</span>
                    <span className="text-[11px] text-slate-400 tabular-nums shrink-0">{formatCurrency(product.sellingPrice, currency)}</span>
                    <span className={`text-[10px] font-medium shrink-0 w-12 text-right ${isLow ? 'text-amber-500' : 'text-slate-400'}`}>
                      {product.stockQuantity} {product.unit}
                    </span>
                    {isExpanded
                      ? <ChevronUp className="w-3 h-3 text-slate-300 shrink-0" />
                      : <ChevronDown className="w-3 h-3 text-slate-300 shrink-0" />}
                  </button>

                  {/* ── SELL PANEL ── */}
                  {isExpanded && (
                    <div className="bg-slate-50 border-t border-slate-100 px-4 pt-3 pb-3 space-y-2.5">

                      <div className="flex gap-2.5 items-end">
                        {/* Qty stepper */}
                        <div>
                          <p className="text-[10px] text-slate-400 mb-1">Qty</p>
                          <div className="flex items-center border border-slate-200 rounded-lg bg-white">
                            <button
                              className="w-8 h-9 text-slate-500 hover:bg-slate-50 font-semibold text-base flex items-center justify-center"
                              onClick={() => setQuantities(p => ({ ...p, [product.id]: Math.max(1, (p[product.id] ?? 1) - 1) }))}
                            >−</button>
                            <span className="w-7 text-center text-[13px] font-bold text-slate-800">{qty}</span>
                            <button
                              className="w-8 h-9 text-slate-500 hover:bg-slate-50 font-semibold text-base flex items-center justify-center"
                              onClick={() => setQuantities(p => ({ ...p, [product.id]: Math.min(product.stockQuantity, (p[product.id] ?? 1) + 1) }))}
                            >+</button>
                          </div>
                        </div>

                        {/* Price input */}
                        <div className="flex-1">
                          <p className="text-[10px] text-slate-400 mb-1">Selling price</p>
                          <div className="flex items-center border border-slate-200 rounded-lg bg-white focus-within:border-red-400 focus-within:ring-1 focus-within:ring-red-100">
                            <span className="pl-2.5 text-[11px] text-slate-400 shrink-0">{currency}</span>
                            <input
                              type="number"
                              inputMode="numeric"
                              min={0}
                              value={soldPriceStr}
                              onChange={e => setSoldPrices(p => ({ ...p, [product.id]: e.target.value }))}
                              placeholder={String(product.sellingPrice)}
                              className="flex-1 h-9 px-2 text-[13px] font-semibold text-slate-800 bg-transparent focus:outline-none placeholder:text-slate-300 placeholder:font-normal tabular-nums"
                            />
                          </div>
                        </div>
                      </div>

                      {profit !== null && (
                        <p className={`text-[11px] ${profit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {profit >= 0 ? 'Profit' : 'Loss'}: {formatCurrency(Math.abs(profit), currency)}
                          {qty > 1 && ` (${qty} × ${formatCurrency(Math.abs(soldPrice - product.buyingPrice), currency)})`}
                        </p>
                      )}

                      <button
                        onClick={() => handleSave(product)}
                        disabled={isSaving || !hasPrice}
                        className={`w-full h-10 rounded-lg text-[13px] font-semibold transition-colors ${
                          hasPrice
                            ? 'bg-red-600 hover:bg-red-700 text-white'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        {isSaving ? 'Saving…' : hasPrice ? `Sell — ${formatCurrency(soldPrice * qty, currency)}` : 'Enter price to record sale'}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
        <div className="h-6" />
      </div>
    </div>
  )
}
