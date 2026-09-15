import { useState, useMemo } from 'react'
import { Plus, Search, Package, Pencil, RefreshCw, Trash2 } from 'lucide-react'
import { useProducts, useDeleteProduct } from '@/hooks/useProducts'
import { useCategories } from '@/hooks/useCategories'
import { useSettings } from '@/hooks/useLocalSettings'
import { Button } from '@/components/ui/button'
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
    if (!confirm(`Archive "${product.name}"? It will be hidden but sales history preserved.`)) return
    await deleteProduct.mutateAsync(product.id)
    toast.success('Product archived')
  }

  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]))

  return (
    <div className="flex flex-col min-h-screen p-4">
      <PageHeader
        title="Stock Entry"
        subtitle={`${products.length} products`}
        backTo="/"
        actions={
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" /> Add
          </Button>
        }
      />

      {/* Filters */}
      <div className="space-y-2 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            className="pl-9"
            placeholder="Search by name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${categoryFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
          >
            All Categories
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategoryFilter(c.id)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${categoryFilter === c.id ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
            >
              {c.name}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {(['all', 'low', 'out'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${statusFilter === s ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
            >
              {s === 'all' ? 'All Stock' : s === 'low' ? 'Low Stock' : 'Out of Stock'}
            </button>
          ))}
        </div>
      </div>

      {/* Product List */}
      {isLoading ? (
        <div className="text-center py-12 text-slate-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No products found"
          description="Add your first product to get started"
          action={<Button onClick={() => setAddOpen(true)}><Plus className="h-4 w-4" /> Add Product</Button>}
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((product) => {
            const margin = profitMargin(product.buyingPrice, product.sellingPrice)
            const cat = categoryMap[product.categoryId]
            return (
              <div
                key={product.id}
                className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-700"
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Product thumbnail */}
                  {product.imageDataUrl ? (
                    <img
                      src={product.imageDataUrl}
                      alt={product.name}
                      className="w-14 h-14 rounded-lg object-cover shrink-0 border border-slate-200 dark:border-slate-600"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-slate-100 dark:bg-slate-700 shrink-0 flex items-center justify-center">
                      <Package className="w-6 h-6 text-slate-300 dark:text-slate-500" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">{product.name}</span>
                      {cat && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full text-white"
                          style={{ background: cat.colorHex || '#6b7280' }}
                        >
                          {cat.name}
                        </span>
                      )}
                    </div>
                    {product.sku && <div className="text-xs text-slate-400 mt-0.5">SKU: {product.sku}</div>}
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <StockBadge stock={product.stockQuantity} reorderLevel={product.reorderLevel} />
                      <span className="text-xs text-slate-500">
                        Buy: {formatCurrency(product.buyingPrice, currency)}
                      </span>
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        Sell: {formatCurrency(product.sellingPrice, currency)}
                      </span>
                      <span className={`text-xs font-medium ${profitMarginClass(margin)}`}>
                        {margin.toFixed(0)}% margin
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon-sm" onClick={() => setRestockProduct(product)} title="Restock">
                      <RefreshCw className="h-4 w-4 text-green-600" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => setEditProduct(product)} title="Edit">
                      <Pencil className="h-4 w-4 text-blue-600" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(product)} title="Archive">
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <ProductFormModal open={addOpen} onClose={() => setAddOpen(false)} />
      <ProductFormModal open={!!editProduct} onClose={() => setEditProduct(null)} product={editProduct} />
      <RestockModal open={!!restockProduct} onClose={() => setRestockProduct(null)} product={restockProduct} />
    </div>
  )
}
