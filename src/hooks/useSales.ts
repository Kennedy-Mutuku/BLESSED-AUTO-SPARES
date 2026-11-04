import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { db } from '../db/database'
import type { Sale, SaleItem } from '../db/schema'
import { generateId, generateReceiptNumber } from '../lib/utils'
import { saleItemsFromCart } from '../lib/calculations'
import type { CartItem } from '../db/schema'

export function useSales({ limit = 50 }: { limit?: number } = {}) {
  return useQuery({
    queryKey: ['sales', limit],
    queryFn: () => db.sales.orderBy('soldAt').reverse().limit(limit).toArray(),
  })
}

export function useSalesByDateRange(start: number, end: number) {
  return useQuery({
    queryKey: ['sales', 'range', start, end],
    queryFn: () =>
      db.sales
        .where('soldAt')
        .between(start, end, true, true)
        .reverse()
        .toArray(),
  })
}

export function useResetAllSales() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      await db.transaction('rw', db.sales, db.products, db.stockHistory, async () => {
        const allSales = await db.sales.toArray()

        // Accumulate quantities sold per product
        const restoreMap = new Map<string, number>()
        for (const sale of allSales) {
          for (const item of sale.items) {
            restoreMap.set(item.productId, (restoreMap.get(item.productId) ?? 0) + item.quantity)
          }
        }

        // Add the sold quantities back to each product
        for (const [productId, qty] of restoreMap) {
          const product = await db.products.get(productId)
          if (product) {
            await db.products.update(productId, {
              stockQuantity: product.stockQuantity + qty,
              updatedAt: Date.now(),
            })
          }
        }

        // Delete all sales and their stock history entries
        await db.sales.clear()
        const saleHistoryIds = await db.stockHistory
          .filter(h => h.changeType === 'sale')
          .primaryKeys()
        await db.stockHistory.bulkDelete(saleHistoryIds)
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales'] })
      qc.invalidateQueries({ queryKey: ['products'] })
      qc.invalidateQueries({ queryKey: ['stock-alerts'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useDeleteSale() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (sale: Sale) => {
      await db.transaction('rw', db.sales, db.products, db.stockHistory, async () => {
        // Restore stock for each item sold
        for (const item of sale.items) {
          const product = await db.products.get(item.productId)
          if (product) {
            await db.products.update(item.productId, {
              stockQuantity: product.stockQuantity + item.quantity,
              updatedAt: Date.now(),
            })
          }
        }
        // Remove stock history records tied to this sale
        const historyIds = await db.stockHistory
          .filter(h => h.relatedSaleId === sale.id)
          .primaryKeys()
        await db.stockHistory.bulkDelete(historyIds)
        // Delete the sale itself
        await db.sales.delete(sale.id)
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales'] })
      qc.invalidateQueries({ queryKey: ['products'] })
      qc.invalidateQueries({ queryKey: ['stock-alerts'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useCompleteSale() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      cartItems,
      paymentMethod,
      amountTendered,
      customerName,
      notes,
      createdBy,
    }: {
      cartItems: CartItem[]
      paymentMethod: Sale['paymentMethod']
      amountTendered: number
      customerName: string
      notes: string
      createdBy: string
    }) => {
      const saleItems = saleItemsFromCart(cartItems)
      const subtotal = saleItems.reduce((s, i) => s + i.lineTotal, 0)
      const totalProfit = saleItems.reduce((s, i) => s + i.lineProfit, 0)
      const saleId = generateId()

      const sale: Sale = {
        id: saleId,
        receiptNumber: generateReceiptNumber(),
        soldAt: Date.now(),
        items: saleItems,
        subtotal,
        totalProfit,
        paymentMethod,
        amountTendered,
        changeGiven: Math.max(0, amountTendered - subtotal),
        customerName,
        notes,
        createdBy,
      }

      await db.transaction('rw', db.products, db.stockHistory, db.sales, async () => {
        for (const item of cartItems) {
          const product = await db.products.get(item.product.id)
          if (!product) throw new Error(`Product ${item.product.name} not found`)
          if (product.stockQuantity < item.quantity) {
            throw new Error(`Insufficient stock for ${product.name}`)
          }
          const qBefore = product.stockQuantity
          const qAfter = qBefore - item.quantity
          await db.products.update(item.product.id, {
            stockQuantity: qAfter,
            updatedAt: Date.now(),
          })
          await db.stockHistory.add({
            id: generateId(),
            productId: item.product.id,
            changeType: 'sale',
            quantityBefore: qBefore,
            quantityChange: -item.quantity,
            quantityAfter: qAfter,
            relatedSaleId: saleId,
            note: `Sale ${sale.receiptNumber}`,
            createdAt: Date.now(),
          })
        }
        await db.sales.add(sale)
      })

      return sale
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales'] })
      qc.invalidateQueries({ queryKey: ['products'] })
      qc.invalidateQueries({ queryKey: ['stock-alerts'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
