import { useState, useMemo } from 'react'
import { Plus, Search, Package, Pencil, RefreshCw, Trash2 } from 'lucide-react'
import { useProducts, useDeleteProduct } from '@/hooks/useProducts'
import { useCategories } from '@/hooks/useCategories'
import { useSettings } from '@/hooks/useLocalSettings'
import { Input } from '@/components/ui/input'
import { StockBadge } from '@/components/shared/StockBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageHeader } from '@/components/shared/PageHeader'
import { ProductFormModal } from './ProductFormModal'
import { RestockModal } from './RestockModal'
import { formatCurrency, profitMarginClass } from '@/lib/utils'
import { profitMargin } from '@/lib/calculations'
import type { Product } from '@/db/schema'
import toast from 'react-hot-toast'

export function InventoryPage() {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'low' | 'out'>('all')
  const [addOpen, setAddOpen] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [restockProduct, setRestockProduct] = useState<Product | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  const { data: products = [], isLoading } = useProducts()
  const { data: categories = [] } = useCategories()
  const { data: settings } = useSettings()
  const deleteProduct = useDeleteProduct()
  const currency = settings?.currencySymbol ?? 'KES'

  const filtered = useMemo(() => {
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

  async function handleDelete(product: Product) {
    if (!confirm(`Archive "${product.name}"? Sales history preserved.`)) return
    await deleteProduct.mutateAsync(product.id)
    toast.success('Product archived')
  }

  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]))

  return (
    <div className="flex flex-col h-dvh bg-white overflow-hidden">

      {/* ── STICKY HEADER ── */}
      <div className="shrink-0">

        {/* Dark bar (p-4 wrapper so PageHeader negative margins work) */}
        <div className="px-4 pt-4 bg-slate-900">
          <PageHeader
            title="Stock Entry"
            subtitle={`${products.length} product${products.length !== 1 ? 's' : ''}`}
            backTo="/"
            actions={
              <button
                onClick={() => setAddOpen(true)}
                className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors"
              >
                <Plus className="h-4 w-4" /> Add
              </button>
            }
          />
        </div>

        {/* White filter bar */}
        <div className="bg-white border-b border-slate-100 px-4 pt-2 pb-2 space-y-1.5">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              className="pl-9 h-9 text-sm"
              placeholder="Search by name or SKU…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Category + Status pills — single scrollable row */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`shrink-0 px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-colors ${
                categoryFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >All</button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategoryFilter(c.id)}
                className={`shrink-0 px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-colors ${
                  categoryFilter === c.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >{c.name}</button>
            ))}
            <div className="w-px h-3 bg-slate-200 shrink-0 mx-1" />
            {(['all', 'low', 'out'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`shrink-0 px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-colors ${
                  statusFilter === s
                    ? s === 'out' ? 'bg-red-500 text-white'
                      : s === 'low' ? 'bg-amber-500 text-white'
                      : 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {s === 'all' ? 'All Stock' : s === 'low' ? 'Low Stock' : 'Out of Stock'}
              </button>
            ))}
          </div>

          {/* Result count */}
          <p className="text-[10px] text-slate-400">
            Showing {filtered.length} of {products.length} products
          </p>
        </div>
      </div>

      {/* ── SCROLLABLE LIST ── */}
      <div className="flex-1 overflow-y-auto bg-white">
        {isLoading ? (
          <div className="text-center py-12 text-slate-400 text-sm">Loading…</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No products found"
            description="Add your first product to get started"
            action={
              <button
                onClick={() => setAddOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                <Plus className="h-4 w-4" /> Add Product
              </button>
            }
          />
        ) : (
          <div className="divide-y divide-slate-50">
            {filtered.map((product, index) => {
              const margin = profitMargin(product.buyingPrice, product.sellingPrice)
              const cat = categoryMap[product.categoryId]
              return (
                <div
                  key={product.id}
                  className="flex items-center gap-2.5 px-3 py-2.5 bg-white hover:bg-slate-50 transition-colors"
                >
                  {/* Row number */}
                  <span className="w-4 text-right text-[10px] font-bold text-slate-300 shrink-0 select-none">
                    {index + 1}
                  </span>

                  {/* Thumbnail — tap to preview */}
                  {product.imageDataUrl ? (
                    <img
                      src={product.imageDataUrl}
                      alt={product.name}
                      className="w-10 h-10 rounded-lg object-cover shrink-0 border border-slate-100 cursor-pointer active:scale-95 transition-transform"
                      onClick={() => setPhotoPreview(product.imageDataUrl!)}
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-slate-100 shrink-0 flex items-center justify-center">
                      <Package className="w-5 h-5 text-slate-300" />
                    </div>
                  )}

                  {/* Product info — full width column */}
                  <div className="flex-1 min-w-0">

                    {/* Line 1: name (truncated) + action icons on the right */}
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-[13px] font-semibold text-slate-900 leading-tight truncate">
                          {product.name}
                        </span>
                        {cat && (
                          <span
                            className="text-[9px] px-1.5 py-0.5 rounded-full text-white font-medium shrink-0 whitespace-nowrap"
                            style={{ background: cat.colorHex || '#6b7280' }}
                          >{cat.name}</span>
                        )}
                      </div>
                      <div className="flex items-center shrink-0">
                        <button onClick={() => setRestockProduct(product)} className="p-1 rounded hover:bg-green-50 transition-colors" title="Restock">
                          <RefreshCw className="w-3.5 h-3.5 text-green-600" />
                        </button>
                        <button onClick={() => setEditProduct(product)} className="p-1 rounded hover:bg-blue-50 transition-colors" title="Edit">
                          <Pencil className="w-3.5 h-3.5 text-blue-500" />
                        </button>
                        <button onClick={() => handleDelete(product)} className="p-1 rounded hover:bg-red-50 transition-colors" title="Archive">
                          <Trash2 className="w-3.5 h-3.5 text-red-500" />
                        </button>
                      </div>
                    </div>

                    {/* Line 2: stock badge + buy + sell + margin — full row width, no competition */}
                    <div className="flex items-center gap-2 mt-0.5">
                      <StockBadge
                        stock={product.stockQuantity}
                        reorderLevel={product.reorderLevel}
                        className="shrink-0 whitespace-nowrap !text-[10px]"
                      />
                      <span className="text-[10px] text-slate-400 whitespace-nowrap">
                        Buy: {formatCurrency(product.buyingPrice, currency)}
                      </span>
                      <span className="text-[10px] font-medium text-slate-700 whitespace-nowrap">
                        Sell: {formatCurrency(product.sellingPrice, currency)}
                      </span>
                      <span className={`text-[10px] font-bold whitespace-nowrap ${profitMarginClass(margin)}`}>
                        {margin.toFixed(0)}%
                      </span>
                    </div>

                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── PHOTO LIGHTBOX ── */}
      {photoPreview && (
        <div
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-6"
          onClick={() => setPhotoPreview(null)}
        >
          <img
            src={photoPreview}
            alt="Product photo"
            className="max-w-full max-h-full rounded-2xl object-contain shadow-2xl"
          />
          <button
            className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-2xl leading-none transition-colors"
            onClick={() => setPhotoPreview(null)}
          >
            &times;
          </button>
        </div>
      )}

      {/* Modals */}
      <ProductFormModal open={addOpen} onClose={() => setAddOpen(false)} />
      <ProductFormModal open={!!editProduct} onClose={() => setEditProduct(null)} product={editProduct} />
      <RestockModal open={!!restockProduct} onClose={() => setRestockProduct(null)} product={restockProduct} />
    </div>
  )
}
