import { useQuery } from '@tanstack/react-query'
import { db } from '../db/database'
import { startOfDay, endOfDay } from 'date-fns'

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const todayStart = startOfDay(new Date()).getTime()
      const todayEnd = endOfDay(new Date()).getTime()

      const todaySales = await db.sales
        .where('soldAt')
        .between(todayStart, todayEnd, true, true)
        .toArray()

      const todayRevenue = todaySales.reduce((s, sale) => s + sale.subtotal, 0)
      const todayProfit = todaySales.reduce((s, sale) => s + sale.totalProfit, 0)
      const todaySalesCount = todaySales.length

      const allProducts = (await db.products.toArray()).filter((p) => p.isActive)
      const lowStockCount = allProducts.filter(
        (p) => p.stockQuantity <= p.reorderLevel
      ).length

      return {
        todayRevenue,
        todayProfit,
        todaySalesCount,
        lowStockCount,
      }
    },
  })
}
