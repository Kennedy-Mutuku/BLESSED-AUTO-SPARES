import { useQuery } from '@tanstack/react-query'
import { db } from '../db/database'

export function useStockAlerts() {
  return useQuery({
    queryKey: ['stock-alerts'],
    queryFn: async () => {
      const products = (await db.products.toArray()).filter((p) => p.isActive)
      const lowStock = products.filter(
        (p) => p.stockQuantity > 0 && p.stockQuantity <= p.reorderLevel
      )
      const outOfStock = products.filter((p) => p.stockQuantity === 0)
      return { lowStock, outOfStock, totalAlerts: lowStock.length + outOfStock.length }
    },
  })
}
