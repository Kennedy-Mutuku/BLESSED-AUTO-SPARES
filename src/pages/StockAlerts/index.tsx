import { useState } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { useStockAlerts } from '@/hooks/useStockAlerts'
import { useSettings } from '@/hooks/useLocalSettings'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageHeader } from '@/components/shared/PageHeader'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { RestockModal } from '@/pages/Inventory/RestockModal'
import { formatCurrency } from '@/lib/utils'
import type { Product } from '@/db/schema'

export function StockAlertsPage() {
  const [restockProduct, setRestockProduct] = useState<Product | null>(null)
  const { data, isLoading } = useStockAlerts()
  const { data: settings } = useSettings()
  const currency = settings?.currencySymbol ?? 'KES'

  const lowStock = data?.lowStock ?? []
  const outOfStock = data?.outOfStock ?? []

  function ProductCard({ product }: { product: Product }) {
    const stockPercent = Math.round((product.stockQuantity / (product.reorderLevel * 2 || 1)) * 100)
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">{product.name}</div>
            {product.sku && <div className="text-xs text-slate-400">{product.sku}</div>}
            <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
              <span>Stock: <strong className={product.stockQuantity === 0 ? 'text-red-500' : 'text-amber-500'}>{product.stockQuantity}</strong></span>
              <span>Reorder at: {product.reorderLevel}</span>
              <span>Sell: {formatCurrency(product.sellingPrice, currency)}</span>
            </div>
            {product.stockQuantity > 0 && (
              <div className="mt-2 h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                <div
                  className="h-full rounded-full bg-amber-400"
                  style={{ width: `${Math.min(100, stockPercent)}%` }}
                />
              </div>
            )}
          </div>
          <Button size="sm" variant="outline" onClick={() => setRestockProduct(product)}>
            <RefreshCw className="h-3.5 w-3.5" /> Restock
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-dvh bg-white overflow-hidden">

      {/* ── STICKY HEADER ── */}
      <div className="shrink-0 px-4 pt-4 bg-red-600">
        <PageHeader
          title="Stock Alerts"
          subtitle={`${data?.totalAlerts ?? 0} items need attention`}
          backTo="/"
        />
      </div>

      {/* ── SCROLLABLE CONTENT ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {isLoading ? (
          <div className="text-center py-12 text-slate-400">Loading...</div>
        ) : (
          <Tabs defaultValue="low">
            <TabsList className="w-full mb-4">
              <TabsTrigger value="low" className="flex-1">
                Low Stock
                {lowStock.length > 0 && (
                  <span className="ml-1.5 bg-amber-500 text-white text-xs rounded-full px-1.5">{lowStock.length}</span>
                )}
              </TabsTrigger>
              <TabsTrigger value="out" className="flex-1">
                Out of Stock
                {outOfStock.length > 0 && (
                  <span className="ml-1.5 bg-red-500 text-white text-xs rounded-full px-1.5">{outOfStock.length}</span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="low">
              {lowStock.length === 0 ? (
                <EmptyState icon={AlertTriangle} title="No low stock items" description="All products are stocked above reorder levels" />
              ) : (
                <div className="space-y-2 pb-6">
                  {lowStock.map((p) => <ProductCard key={p.id} product={p} />)}
                </div>
              )}
            </TabsContent>

            <TabsContent value="out">
              {outOfStock.length === 0 ? (
                <EmptyState icon={AlertTriangle} title="No out-of-stock items" description="All products have stock available" />
              ) : (
                <div className="space-y-2 pb-6">
                  {outOfStock.map((p) => <ProductCard key={p.id} product={p} />)}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>

      <RestockModal open={!!restockProduct} onClose={() => setRestockProduct(null)} product={restockProduct} />
    </div>
  )
}
