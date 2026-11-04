import { useState, useMemo, useRef } from 'react'
import {
  Plus, Search, Package, Pencil, RefreshCw, Trash2,
  FileDown, LayoutList, BookOpen, RotateCcw,
} from 'lucide-react'
import { exportHtmlAsPdf } from '@/lib/pdfExport'
import { useProducts, useDeleteProduct } from '@/hooks/useProducts'
import { useCategories } from '@/hooks/useCategories'
import { useSettings } from '@/hooks/useLocalSettings'
import { useStockLedger, rebuildLedger } from '@/hooks/useStockLedger'
import { useQueryClient } from '@tanstack/react-query'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageHeader } from '@/components/shared/PageHeader'
import { ProductFormModal } from './ProductFormModal'
import { RestockModal } from './RestockModal'
import { formatCurrency, profitMarginClass } from '@/lib/utils'
import { profitMargin } from '@/lib/calculations'
import type { Product } from '@/db/schema'
import type { LedgerDay } from '@/hooks/useStockLedger'
import toast from 'react-hot-toast'

type Tab = 'ledger' | 'products'

export function InventoryPage() {
  const [tab, setTab] = useState<Tab>('ledger')

  // Ledger tab state
  const [ledgerSearch, setLedgerSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Products tab state
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'low' | 'out'>('all')

  // Modals
  const [addOpen, setAddOpen] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [restockProduct, setRestockProduct] = useState<Product | null>(null)

  const [rebuilding, setRebuilding] = useState(false)
  const ledgerPrintRef = useRef<HTMLDivElement>(null)
  const productsPrintRef = useRef<HTMLDivElement>(null)

  const qc = useQueryClient()
  const { data: products = [], isLoading: productsLoading } = useProducts()
  const { data: categories = [] } = useCategories()
  const { data: settings } = useSettings()
  const { data: ledgerDays = [], isLoading: ledgerLoading } = useStockLedger()
  const deleteProduct = useDeleteProduct()
  const currency = settings?.currencySymbol ?? 'KES'

  // ── Filtered products ─────────────────────────────────────────────────────
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = search.toLowerCase()
      const matchesSearch = !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
      const matchesCat = categoryFilter === 'all' || p.categoryId === categoryFilter
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'low' && p.stockQuantity > 0 && p.stockQuantity <= p.reorderLevel) ||
        (statusFilter === 'out' && p.stockQuantity === 0)
      return matchesSearch && matchesCat && matchesStatus
    })
  }, [products, search, categoryFilter, statusFilter])

  // ── Filtered ledger days ─────────────────────────────────────────────────
  const filteredLedgerDays = useMemo(() => {
    const fromTs = dateFrom ? new Date(dateFrom).setHours(0, 0, 0, 0) : 0
    const toTs = dateTo ? new Date(dateTo).setHours(23, 59, 59, 999) : Infinity
    const q = ledgerSearch.toLowerCase()

    return ledgerDays
      .map(day => ({
        ...day,
        entries: day.entries.filter(e => {
          const inRange = e.dateTs >= fromTs && e.dateTs <= toTs
          const matchesName = !q || e.productName.toLowerCase().includes(q)
          return inRange && matchesName
        }),
      }))
      .filter(day => day.entries.length > 0)
      .map(day => ({
        ...day,
        totalBpTotal: day.entries.reduce((s, e) => s + e.bpTotal, 0),
        totalExpectedProfit: day.entries.reduce((s, e) => s + e.expectedProfit, 0),
      }))
  }, [ledgerDays, dateFrom, dateTo, ledgerSearch])

  const grandBpTotal = filteredLedgerDays.reduce((s, d) => s + d.totalBpTotal, 0)
  const grandProfit = filteredLedgerDays.reduce((s, d) => s + d.totalExpectedProfit, 0)
  const totalItemsReceived = filteredLedgerDays.reduce((s, d) => s + d.entries.reduce((es, e) => es + e.quantity, 0), 0)

  // ── Helpers ───────────────────────────────────────────────────────────────
  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]))

  function catAbbrev(name: string): string {
    const map: Record<string, string> = {
      'Oils & Lubricants': 'OIL',
      'Tyres': 'TYR',
      'Brakes': 'BRK',
      'Engine Parts': 'ENG',
      'Suspension & Steering': 'SUS',
      'Electrical & Lighting': 'ELC',
      'Chemicals & Accessories': 'CHM',
    }
    return map[name] ?? name.slice(0, 3).toUpperCase()
  }

  async function handleRebuildLedger() {
    setRebuilding(true)
    try {
      await rebuildLedger((key) => qc.invalidateQueries({ queryKey: key }))
      toast.success('Stock ledger refreshed')
    } catch {
      toast.error('Refresh failed — try again')
    } finally {
      setRebuilding(false)
    }
  }

  async function handleDelete(product: Product) {
    if (!confirm(`Archive "${product.name}"? Sales history preserved.`)) return
    await deleteProduct.mutateAsync(product.id)
    toast.success('Product archived')
  }

  // ── PDF Exports ───────────────────────────────────────────────────────────
  async function handleExportLedgerPdf() {
    const shopName = settings?.shopName ?? 'Blessed Auto Spares'
    const phone = settings?.shopPhone ?? ''
    const address = settings?.shopAddress ?? ''
    const generated = new Date().toLocaleDateString('en-KE', { day: '2-digit', month: 'long', year: 'numeric' })
    const rangeLabel = dateFrom || dateTo
      ? `${dateFrom ? new Date(dateFrom).toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'} to ${dateTo ? new Date(dateTo).toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}`
      : 'All dates'

    const rowsHtml = filteredLedgerDays.map(day => {
      const itemRows = day.entries.map((entry, i) => `
        <tr style="border-bottom:1px solid #e5e7eb;">
          <td style="padding:5px 8px;vertical-align:top;font-size:11px;color:#374151;font-weight:${i === 0 ? '600' : '400'};">
            ${i === 0 ? day.date : ''}
          </td>
          <td style="padding:5px 8px;font-size:11px;color:#111827;font-weight:500;">${entry.productName}</td>
          <td style="padding:5px 8px;font-size:11px;text-align:right;color:#374151;">${entry.quantity}</td>
          <td style="padding:5px 8px;font-size:11px;text-align:right;color:#374151;">${entry.buyingPrice.toLocaleString()}</td>
          <td style="padding:5px 8px;font-size:11px;text-align:right;color:#374151;">${entry.bpTotal.toLocaleString()}</td>
          <td style="padding:5px 8px;font-size:11px;text-align:right;color:#374151;">${entry.sellingPrice.toLocaleString()}</td>
          <td style="padding:5px 8px;font-size:11px;text-align:right;color:#374151;">${entry.expectedProfit > 0 ? entry.expectedProfit.toLocaleString() : ''}</td>
        </tr>
      `).join('')

      const totalRow = `
        <tr style="border-top:2px solid #111827;border-bottom:3px solid #111827;">
          <td style="padding:5px 8px;" colspan="2"></td>
          <td style="padding:5px 8px;font-size:11px;font-weight:800;text-align:right;text-transform:uppercase;letter-spacing:0.5px;" colspan="1">Total</td>
          <td></td>
          <td style="padding:5px 8px;font-size:12px;font-weight:900;text-align:right;color:#111827;">${day.totalBpTotal.toLocaleString()}</td>
          <td></td>
          <td style="padding:5px 8px;font-size:11px;font-weight:700;text-align:right;color:#374151;">${day.totalExpectedProfit > 0 ? day.totalExpectedProfit.toLocaleString() : ''}</td>
        </tr>
      `
      return itemRows + totalRow
    }).join('')

    const html = `
      <div style="font-family:Arial,sans-serif;color:#111827;padding:32px 40px;background:#fff;max-width:800px;margin:0 auto;">
        <!-- Letterhead -->
        <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #111827;padding-bottom:12px;margin-bottom:20px;">
          <div>
            <div style="font-size:20px;font-weight:900;color:#111827;letter-spacing:1px;text-transform:uppercase;">${shopName}</div>
            ${phone ? `<div style="font-size:10px;color:#6b7280;margin-top:2px;">${phone}</div>` : ''}
            ${address ? `<div style="font-size:10px;color:#6b7280;">${address}</div>` : ''}
          </div>
          <div style="text-align:right;">
            <div style="font-size:16px;font-weight:800;color:#111827;text-transform:uppercase;letter-spacing:0.5px;">Stock Received Ledger</div>
            <div style="font-size:10px;color:#6b7280;margin-top:4px;">Period: ${rangeLabel}</div>
            <div style="font-size:10px;color:#6b7280;">Generated: ${generated}</div>
          </div>
        </div>

        <!-- Summary strip -->
        <div style="display:flex;gap:12px;margin-bottom:20px;">
          <div style="flex:1;border:1px solid #d1d5db;border-radius:6px;padding:10px 14px;">
            <div style="font-size:8px;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Delivery Days</div>
            <div style="font-size:16px;font-weight:800;">${filteredLedgerDays.length}</div>
          </div>
          <div style="flex:1;border:1px solid #d1d5db;border-radius:6px;padding:10px 14px;">
            <div style="font-size:8px;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Items Received</div>
            <div style="font-size:16px;font-weight:800;">${totalItemsReceived}</div>
          </div>
          <div style="flex:2;border:1px solid #d1d5db;border-radius:6px;padding:10px 14px;">
            <div style="font-size:8px;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Total Stock Cost (BP Total)</div>
            <div style="font-size:16px;font-weight:800;">${currency} ${grandBpTotal.toLocaleString()}</div>
          </div>
          <div style="flex:2;border:1px solid #d1d5db;border-radius:6px;padding:10px 14px;">
            <div style="font-size:8px;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Expected Profit</div>
            <div style="font-size:16px;font-weight:800;color:#16a34a;">${currency} ${grandProfit.toLocaleString()}</div>
          </div>
        </div>

        <!-- Main table -->
        <table style="width:100%;border-collapse:collapse;border:1px solid #111827;">
          <thead>
            <tr style="background:#111827;">
              <th style="padding:8px;color:#fff;font-size:11px;font-weight:700;text-align:left;border-right:1px solid #374151;width:90px;">Date</th>
              <th style="padding:8px;color:#fff;font-size:11px;font-weight:700;text-align:left;border-right:1px solid #374151;">Item Received</th>
              <th style="padding:8px;color:#fff;font-size:11px;font-weight:700;text-align:right;border-right:1px solid #374151;width:60px;">Quantity</th>
              <th style="padding:8px;color:#fff;font-size:11px;font-weight:700;text-align:right;border-right:1px solid #374151;width:80px;">Buying<br>Price</th>
              <th style="padding:8px;color:#fff;font-size:11px;font-weight:700;text-align:right;border-right:1px solid #374151;width:80px;">BP<br>Total</th>
              <th style="padding:8px;color:#fff;font-size:11px;font-weight:700;text-align:right;border-right:1px solid #374151;width:80px;">Selling<br>Price</th>
              <th style="padding:8px;color:#fff;font-size:11px;font-weight:700;text-align:right;width:90px;">Expected<br>Profit</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
          <tfoot>
            <tr style="background:#111827;">
              <td colspan="4" style="padding:8px 8px;color:#fff;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;">Grand Total — ${filteredLedgerDays.length} day(s)</td>
              <td style="padding:8px 8px;text-align:right;color:#fff;font-size:13px;font-weight:900;">${grandBpTotal.toLocaleString()}</td>
              <td></td>
              <td style="padding:8px 8px;text-align:right;color:#4ade80;font-size:12px;font-weight:800;">${grandProfit > 0 ? grandProfit.toLocaleString() : '—'}</td>
            </tr>
          </tfoot>
        </table>

        <!-- Footer -->
        <div style="margin-top:20px;border-top:1px solid #e5e7eb;padding-top:8px;display:flex;justify-content:space-between;">
          <div style="font-size:8px;color:#9ca3af;">${shopName} · Stock Received Ledger · Confidential</div>
          <div style="font-size:8px;color:#9ca3af;">Printed ${generated}</div>
        </div>
      </div>
    `
    await exportHtmlAsPdf(html, 'Stock-Ledger.pdf')
  }

  async function handleExportProductsPdf() {
    if (productsPrintRef.current) {
      await exportHtmlAsPdf(productsPrintRef.current.innerHTML, 'Stock-Inventory.pdf')
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-dvh bg-white overflow-hidden">

      {/* ── HEADER ── */}
      <div className="shrink-0">
        <div className="px-4 pt-4 pb-3 bg-red-600">
          <PageHeader
            title="Stock Entry"
            backTo="/"
            actions={
              <div className="flex items-center gap-2">
                <button
                  onClick={tab === 'ledger' ? handleExportLedgerPdf : handleExportProductsPdf}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-white/40 hover:border-white/70 text-white text-[12px] font-medium transition-colors"
                >
                  <FileDown className="h-3.5 w-3.5" /> PDF
                </button>
                <button
                  onClick={() => setAddOpen(true)}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-white hover:bg-red-50 text-red-600 text-[12px] font-semibold transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" /> Add
                </button>
              </div>
            }
          />
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-slate-100 bg-white">
          <button
            onClick={() => setTab('ledger')}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-[12px] font-semibold border-b-2 transition-colors ${
              tab === 'ledger'
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" /> Stock Ledger
          </button>
          <button
            onClick={() => setTab('products')}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-[12px] font-semibold border-b-2 transition-colors ${
              tab === 'products'
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <LayoutList className="h-3.5 w-3.5" /> Products
          </button>
        </div>

        {/* ── Ledger filters ── */}
        {tab === 'ledger' && (
          <div className="bg-white border-b border-slate-100 px-3 pt-2 pb-2 space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={ledgerSearch}
                onChange={e => setLedgerSearch(e.target.value)}
                placeholder="Search item name…"
                className="w-full h-8 pl-8 pr-3 bg-slate-50 border border-slate-200 rounded-lg text-[12px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-100"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 shrink-0">From</span>
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="flex-1 h-7 px-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-700 focus:outline-none focus:border-red-400"
              />
              <span className="text-[10px] text-slate-400 shrink-0">To</span>
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="flex-1 h-7 px-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-700 focus:outline-none focus:border-red-400"
              />
              {(dateFrom || dateTo || ledgerSearch) && (
                <button
                  onClick={() => { setDateFrom(''); setDateTo(''); setLedgerSearch('') }}
                  className="shrink-0 text-[10px] text-red-500 font-medium px-1"
                >Clear</button>
              )}
              <button
                onClick={handleRebuildLedger}
                disabled={rebuilding}
                className="shrink-0 ml-auto flex items-center gap-1 h-7 px-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[10px] font-semibold transition-colors disabled:opacity-50"
                title="Rebuild ledger from database"
              >
                <RotateCcw className={`h-3 w-3 ${rebuilding ? 'animate-spin' : ''}`} />
                {rebuilding ? 'Loading…' : 'Refresh'}
              </button>
            </div>
          </div>
        )}

        {/* ── Products filters ── */}
        {tab === 'products' && (
          <div className="bg-white border-b border-slate-100 px-4 pt-2.5 pb-2 space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or SKU…"
                className="w-full h-8 pl-8 pr-3 bg-slate-50 border border-slate-200 rounded-lg text-[12px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-100"
              />
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
              <button
                onClick={() => setCategoryFilter('all')}
                className={`shrink-0 h-6 px-2.5 rounded-full text-[11px] font-medium transition-colors ${
                  categoryFilter === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >All</button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCategoryFilter(c.id)}
                  className={`shrink-0 h-6 px-2.5 rounded-full text-[11px] font-medium transition-colors ${
                    categoryFilter === c.id ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >{c.name}</button>
              ))}
              <div className="w-px h-3 bg-slate-200 shrink-0 mx-0.5" />
              {(['low', 'out'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(statusFilter === s ? 'all' : s)}
                  className={`shrink-0 h-6 px-2.5 rounded-full text-[11px] font-medium transition-colors ${
                    statusFilter === s
                      ? s === 'out' ? 'bg-red-500 text-white' : 'bg-amber-400 text-white'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {s === 'low' ? 'Low stock' : 'Out of stock'}
                </button>
              ))}
              <span className="ml-auto shrink-0 text-[10px] text-slate-400 tabular-nums">{filteredProducts.length}/{products.length}</span>
            </div>
          </div>
        )}
      </div>

      {/* ── CONTENT ── */}
      <div className="flex-1 overflow-y-auto bg-white">

        {/* ════════════════════════════════ LEDGER TAB ════════════════════════════════ */}
        {tab === 'ledger' && (
          <>
            {ledgerLoading ? (
              <div className="text-center py-12 text-[12px] text-slate-400">Loading ledger…</div>
            ) : filteredLedgerDays.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="No stock entries yet"
                description="Add your first product to see the ledger"
                action={
                  <button
                    onClick={() => setAddOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[13px] font-semibold transition-colors"
                  >
                    <Plus className="h-4 w-4" /> Add product
                  </button>
                }
              />
            ) : (
              <>
                {/* Summary bar */}
                <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100 bg-slate-50">
                  <div className="px-3 py-2 text-center">
                    <div className="text-[9px] text-slate-400 uppercase tracking-wider">Items In</div>
                    <div className="text-[14px] font-bold text-slate-800 tabular-nums">{totalItemsReceived}</div>
                  </div>
                  <div className="px-3 py-2 text-center">
                    <div className="text-[9px] text-slate-400 uppercase tracking-wider">Stock Cost</div>
                    <div className="text-[13px] font-bold text-slate-800 tabular-nums">{currency} {grandBpTotal.toLocaleString()}</div>
                  </div>
                  <div className="px-3 py-2 text-center">
                    <div className="text-[9px] text-slate-400 uppercase tracking-wider">Exp. Profit</div>
                    <div className="text-[13px] font-bold text-emerald-600 tabular-nums">{currency} {grandProfit.toLocaleString()}</div>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-slate-800 text-white">
                        <th className="px-2.5 py-2 text-left font-bold text-[10px] uppercase tracking-wider w-[78px] border-r border-slate-600">Date</th>
                        <th className="px-2.5 py-2 text-left font-bold text-[10px] uppercase tracking-wider border-r border-slate-600">Item Received</th>
                        <th className="px-2 py-2 text-right font-bold text-[10px] uppercase tracking-wider w-[44px] border-r border-slate-600">Qty</th>
                        <th className="px-2 py-2 text-right font-bold text-[10px] uppercase tracking-wider w-[64px] border-r border-slate-600 leading-tight">Buy<br/>Price</th>
                        <th className="px-2 py-2 text-right font-bold text-[10px] uppercase tracking-wider w-[72px] border-r border-slate-600 leading-tight">BP<br/>Total</th>
                        <th className="px-2 py-2 text-right font-bold text-[10px] uppercase tracking-wider w-[64px] border-r border-slate-600 leading-tight">Sell<br/>Price</th>
                        <th className="px-2 py-2 text-right font-bold text-[10px] uppercase tracking-wider w-[72px] leading-tight">Exp.<br/>Profit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLedgerDays.map((day) => (
                        <LedgerDayRows key={day.dateTs} day={day} />
                      ))}
                    </tbody>
                    {/* Grand total */}
                    <tfoot>
                      <tr className="bg-slate-800 text-white">
                        <td colSpan={4} className="px-2.5 py-2 font-bold text-[10px] uppercase tracking-wider">
                          Grand Total — {filteredLedgerDays.length} day{filteredLedgerDays.length !== 1 ? 's' : ''}
                        </td>
                        <td className="px-2 py-2 text-right font-black text-[12px] tabular-nums">
                          {grandBpTotal.toLocaleString()}
                        </td>
                        <td />
                        <td className="px-2 py-2 text-right font-bold text-[11px] text-emerald-400 tabular-nums">
                          {grandProfit > 0 ? grandProfit.toLocaleString() : '—'}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </>
            )}
          </>
        )}

        {/* ════════════════════════════════ PRODUCTS TAB ═══════════════════════════════ */}
        {tab === 'products' && (
          <>
            {productsLoading ? (
              <div className="text-center py-12 text-[12px] text-slate-400">Loading…</div>
            ) : filteredProducts.length === 0 ? (
              <EmptyState
                icon={Package}
                title="No products found"
                description="Add your first product to get started"
                action={
                  <button
                    onClick={() => setAddOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[13px] font-semibold transition-colors"
                  >
                    <Plus className="h-4 w-4" /> Add product
                  </button>
                }
              />
            ) : (
              <div className="divide-y divide-slate-50">
                {filteredProducts.map((product, index) => {
                  const margin = profitMargin(product.buyingPrice, product.sellingPrice)
                  const cat = categoryMap[product.categoryId]
                  const isLow = product.stockQuantity > 0 && product.stockQuantity <= product.reorderLevel
                  const isOut = product.stockQuantity === 0

                  return (
                    <div
                      key={product.id}
                      className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-slate-50 transition-colors"
                    >
                      <span className="w-4 text-right text-[10px] text-slate-300 shrink-0 select-none tabular-nums">
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[13.5px] font-semibold text-slate-800 leading-tight truncate">
                            {product.name}
                          </span>
                          {cat && (
                            <span
                              className="text-[9px] px-1.5 py-0.5 rounded font-bold tracking-wider shrink-0 text-white"
                              style={{ background: cat.colorHex || '#6b7280' }}
                            >{catAbbrev(cat.name)}</span>
                          )}
                          <div className="flex items-center ml-auto shrink-0 gap-0.5">
                            <button
                              onClick={() => setRestockProduct(product)}
                              className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                              title="Restock"
                            >
                              <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                            </button>
                            <button
                              onClick={() => setEditProduct(product)}
                              className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                              title="Edit"
                            >
                              <Pencil className="w-3.5 h-3.5 text-slate-400" />
                            </button>
                            <button
                              onClick={() => handleDelete(product)}
                              className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                              title="Archive"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-slate-400 hover:text-red-400" />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className={`text-[10px] font-medium shrink-0 ${
                            isOut ? 'text-red-500' : isLow ? 'text-amber-500' : 'text-slate-500'
                          }`}>
                            {isOut ? 'Out of stock' : `${product.stockQuantity} ${product.unit}`}
                          </span>
                          <span className="text-slate-200 text-[10px]">·</span>
                          <span className="text-[10px] text-slate-400 shrink-0">
                            Buy {formatCurrency(product.buyingPrice, currency)}
                          </span>
                          <span className="text-slate-200 text-[10px]">·</span>
                          <span className="text-[10px] text-slate-600 font-medium shrink-0">
                            Sell {formatCurrency(product.sellingPrice, currency)}
                          </span>
                          <span className="text-slate-200 text-[10px]">·</span>
                          <span className={`text-[10px] font-semibold shrink-0 ${profitMarginClass(margin)}`}>
                            {margin.toFixed(0)}% margin
                          </span>
                          {!isOut && (
                            <>
                              <span className="text-slate-200 text-[10px]">·</span>
                              <span className="text-[10px] font-semibold text-emerald-600 shrink-0">
                                Exp. {formatCurrency((product.sellingPrice - product.buyingPrice) * product.stockQuantity, currency)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        <div className="h-6" />
      </div>

      {/* Modals */}
      <ProductFormModal open={addOpen} onClose={() => setAddOpen(false)} />
      <ProductFormModal open={!!editProduct} onClose={() => setEditProduct(null)} product={editProduct} />
      <RestockModal open={!!restockProduct} onClose={() => setRestockProduct(null)} product={restockProduct} />

      {/* ── PRODUCTS PRINT TEMPLATE (off-screen) ── */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0, width: '820px' }}>
        <div ref={productsPrintRef} style={{ fontFamily: 'Arial, sans-serif', color: '#0f172a', padding: '28px 36px', background: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '4px solid #dc2626', paddingBottom: '14px', marginBottom: '18px' }}>
            <div>
              <div style={{ fontSize: '22px', fontWeight: 900, color: '#dc2626', letterSpacing: '1.5px', textTransform: 'uppercase', lineHeight: 1 }}>
                {settings?.shopName ?? 'Blessed Auto Spares'}
              </div>
              <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>Auto Parts &amp; Accessories</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b' }}>STOCK INVENTORY</div>
              <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>
                Generated: {new Date().toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            {[
              { label: 'Total Products', value: String(filteredProducts.length) },
              { label: 'Total Stock Worth', value: formatCurrency(filteredProducts.reduce((s, p) => s + p.buyingPrice * p.stockQuantity, 0), currency) },
              { label: 'Expected Profit', value: formatCurrency(filteredProducts.reduce((s, p) => s + (p.sellingPrice - p.buyingPrice) * p.stockQuantity, 0), currency) },
              { label: 'Out of Stock', value: String(filteredProducts.filter(p => p.stockQuantity === 0).length) },
            ].map(box => (
              <div key={box.label} style={{ flex: 1, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 14px' }}>
                <div style={{ fontSize: '8px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>{box.label}</div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>{box.value}</div>
              </div>
            ))}
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
            <thead>
              <tr style={{ background: '#1e293b' }}>
                {['#', 'Product', 'Category', 'SKU', 'Stock', 'Unit', 'Buy Price', 'Sell Price', 'Margin', 'Exp. Profit'].map((h, i) => (
                  <th key={h} style={{ padding: '7px 8px', color: '#fff', fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: i === 0 || i >= 4 ? 'right' : 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p, i) => {
                const cat = categoryMap[p.categoryId]
                const margin = p.sellingPrice > 0 ? (((p.sellingPrice - p.buyingPrice) / p.sellingPrice) * 100).toFixed(0) : '0'
                const expProfit = (p.sellingPrice - p.buyingPrice) * p.stockQuantity
                const isOut = p.stockQuantity === 0
                const isLow = !isOut && p.stockQuantity <= p.reorderLevel
                return (
                  <tr key={p.id} style={{ background: i % 2 === 0 ? '#ffffff' : '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '5px 8px', textAlign: 'right', color: '#94a3b8', fontSize: '9px' }}>{i + 1}</td>
                    <td style={{ padding: '5px 8px', fontWeight: 600, color: '#0f172a' }}>{p.name}</td>
                    <td style={{ padding: '5px 8px', color: '#64748b' }}>{cat?.name ?? '—'}</td>
                    <td style={{ padding: '5px 8px', fontFamily: 'monospace', fontSize: '9px', color: '#94a3b8' }}>{p.sku}</td>
                    <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 700, color: isOut ? '#dc2626' : isLow ? '#d97706' : '#0f172a' }}>
                      {isOut ? 'OUT' : p.stockQuantity}
                    </td>
                    <td style={{ padding: '5px 8px', color: '#64748b' }}>{p.unit}</td>
                    <td style={{ padding: '5px 8px', textAlign: 'right', color: '#475569' }}>{formatCurrency(p.buyingPrice, currency)}</td>
                    <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>{formatCurrency(p.sellingPrice, currency)}</td>
                    <td style={{ padding: '5px 8px', textAlign: 'right', color: '#64748b' }}>{margin}%</td>
                    <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 700, color: expProfit >= 0 ? '#16a34a' : '#dc2626' }}>
                      {expProfit > 0 ? formatCurrency(expProfit, currency) : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: '#0f172a', borderTop: '2px solid #dc2626' }}>
                <td colSpan={8} style={{ padding: '8px 8px', color: '#fff', fontWeight: 800, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  TOTAL — {filteredProducts.length} products
                </td>
                <td style={{ padding: '8px 8px', textAlign: 'right', color: '#fff', fontWeight: 800 }}>
                  {formatCurrency(filteredProducts.reduce((s, p) => s + p.buyingPrice * p.stockQuantity, 0), currency)}
                </td>
                <td style={{ padding: '8px 8px', textAlign: 'right', fontWeight: 800, color: '#4ade80' }}>
                  {formatCurrency(filteredProducts.reduce((s, p) => s + (p.sellingPrice - p.buyingPrice) * p.stockQuantity, 0), currency)}
                </td>
              </tr>
            </tfoot>
          </table>
          <div style={{ marginTop: '24px', borderTop: '1px solid #e2e8f0', paddingTop: '10px', display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '8px', color: '#94a3b8' }}>Blessed Auto Spares · Stock Inventory · Confidential</div>
            <div style={{ fontSize: '8px', color: '#94a3b8' }}>
              Printed {new Date().toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Sub-component: one date group of rows ─────────────────────────────────────
function LedgerDayRows({ day }: { day: LedgerDay }) {
  return (
    <>
      {day.entries.map((entry, i) => (
        <tr
          key={entry.id}
          className={`border-b border-slate-100 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} hover:bg-red-50/20 transition-colors`}
        >
          {/* Date — shown only on first row of group */}
          <td className="px-2.5 py-1.5 text-[10px] text-slate-700 font-semibold align-top border-r border-slate-100 w-[78px]">
            {i === 0 ? (
              <span className="bg-slate-800 text-white text-[9px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap">
                {entry.date}
              </span>
            ) : null}
          </td>

          {/* Item name */}
          <td className="px-2.5 py-1.5 text-[11px] text-slate-800 font-medium border-r border-slate-100">
            {entry.productName}
          </td>

          {/* Qty */}
          <td className="px-2 py-1.5 text-right text-[11px] text-slate-700 font-semibold tabular-nums border-r border-slate-100 w-[44px]">
            {entry.quantity}
            <div className="text-[9px] text-slate-400 font-normal">→{entry.quantityAfter}</div>
          </td>

          {/* Buying price */}
          <td className="px-2 py-1.5 text-right text-[11px] text-slate-600 tabular-nums border-r border-slate-100 w-[64px]">
            {entry.buyingPrice.toLocaleString()}
          </td>

          {/* BP Total */}
          <td className="px-2 py-1.5 text-right text-[11px] text-slate-800 font-semibold tabular-nums border-r border-slate-100 w-[72px]">
            {entry.bpTotal.toLocaleString()}
          </td>

          {/* Selling price */}
          <td className="px-2 py-1.5 text-right text-[11px] text-slate-600 tabular-nums border-r border-slate-100 w-[64px]">
            {entry.sellingPrice.toLocaleString()}
          </td>

          {/* Expected profit */}
          <td className="px-2 py-1.5 text-right text-[11px] text-emerald-600 font-medium tabular-nums w-[72px]">
            {entry.expectedProfit > 0 ? entry.expectedProfit.toLocaleString() : ''}
          </td>
        </tr>
      ))}

      {/* Day total row */}
      <tr className="bg-slate-100 border-b-2 border-slate-300">
        <td className="px-2.5 py-1.5 border-r border-slate-200" />
        <td className="px-2.5 py-1.5 border-r border-slate-200">
          <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider">Total</span>
        </td>
        <td className="border-r border-slate-200" />
        <td className="border-r border-slate-200" />
        <td className="px-2 py-1.5 text-right text-[12px] font-black text-slate-900 tabular-nums border-r border-slate-200">
          {day.totalBpTotal.toLocaleString()}
        </td>
        <td className="border-r border-slate-200" />
        <td className="px-2 py-1.5 text-right text-[11px] font-bold text-emerald-700 tabular-nums">
          {day.totalExpectedProfit > 0 ? day.totalExpectedProfit.toLocaleString() : ''}
        </td>
      </tr>
    </>
  )
}
