import { useQuery, useQueryClient } from '@tanstack/react-query'
import { db } from '../db/database'
import { seedStockHistory } from '../lib/seedData'
import type { StockHistory, Product } from '../db/schema'

export interface LedgerEntry {
  id: string
  productId: string
  productName: string
  date: string
  dateTs: number
  quantity: number
  quantityAfter: number
  buyingPrice: number
  bpTotal: number
  sellingPrice: number
  expectedProfit: number
  createdAt: number
}

export interface LedgerDay {
  date: string
  dateTs: number
  entries: LedgerEntry[]
  totalBpTotal: number
  totalExpectedProfit: number
}

function toDateParts(ts: number) {
  const d     = new Date(ts)
  const day   = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year  = d.getFullYear()
  return {
    date:   `${day}/${month}/${year}`,
    dateTs: new Date(year, d.getMonth(), d.getDate()).getTime(),
  }
}

function buildDays(historyRaw: StockHistory[], productMap: Map<string, Product>): LedgerDay[] {
  const purchaseHistory: StockHistory[] = historyRaw.filter(
    (h: StockHistory) => h.changeType === 'initial' || h.changeType === 'restock'
  )

  // Synthetic fallback: user-added products that have no history entry yet
  const productsWithHistory = new Set(purchaseHistory.map(h => h.productId))
  for (const p of productMap.values()) {
    if (p.isActive && !productsWithHistory.has(p.id) && p.stockQuantity > 0) {
      purchaseHistory.push({
        id: `_syn_${p.id}`,
        productId: p.id,
        changeType: 'initial',
        quantityBefore: 0,
        quantityChange: p.stockQuantity,
        quantityAfter: p.stockQuantity,
        relatedSaleId: '',
        note: 'Initial stock entry',
        createdAt: p.createdAt,
        buyingPrice: p.buyingPrice,
        sellingPrice: p.sellingPrice,
      })
    }
  }

  const entries: LedgerEntry[] = purchaseHistory
    .map((h: StockHistory) => {
      const product      = productMap.get(h.productId)
      const productName  = product?.name ?? 'Deleted item'
      const buyingPrice  = h.buyingPrice  ?? product?.buyingPrice  ?? 0
      const sellingPrice = h.sellingPrice ?? product?.sellingPrice ?? 0
      const { date, dateTs } = toDateParts(h.createdAt)
      return {
        id:            h.id,
        productId:     h.productId,
        productName,
        date,
        dateTs,
        quantity:      h.quantityChange,
        quantityAfter: h.quantityAfter,
        buyingPrice,
        bpTotal:         buyingPrice * h.quantityChange,
        sellingPrice,
        expectedProfit:  (sellingPrice - buyingPrice) * h.quantityChange,
        createdAt:     h.createdAt,
      }
    })
    .sort((a: LedgerEntry, b: LedgerEntry) => b.createdAt - a.createdAt)

  const dayMap = new Map<number, LedgerDay>()
  for (const entry of entries) {
    if (!dayMap.has(entry.dateTs)) {
      dayMap.set(entry.dateTs, { date: entry.date, dateTs: entry.dateTs, entries: [], totalBpTotal: 0, totalExpectedProfit: 0 })
    }
    const day = dayMap.get(entry.dateTs)!
    day.entries.push(entry)
    day.totalBpTotal        += entry.bpTotal
    day.totalExpectedProfit += entry.expectedProfit
  }

  return Array.from(dayMap.values()).sort((a, b) => b.dateTs - a.dateTs)
}

export function useStockLedger() {
  return useQuery({
    queryKey: ['stock-ledger'],
    queryFn: async () => {
      // Use .toArray() everywhere — avoids needing changeType index
      const [allHistory, products] = await Promise.all([
        db.stockHistory.toArray() as Promise<StockHistory[]>,
        db.products.toArray() as Promise<Product[]>,
      ])

      const hasPurchaseHistory = allHistory.some(
        (h: StockHistory) => h.changeType === 'initial' || h.changeType === 'restock'
      )
      const hasProducts = products.some((p: Product) => p.isActive)

      if (!hasPurchaseHistory && hasProducts) {
        await seedStockHistory()
        const freshHistory = (await db.stockHistory.toArray()) as StockHistory[]
        const productMap = new Map(products.map((p: Product) => [p.id, p]))
        return buildDays(freshHistory, productMap)
      }

      const productMap = new Map(products.map((p: Product) => [p.id, p]))
      return buildDays(allHistory, productMap)
    },
    staleTime: 0,
  })
}

/** Call this to force a full re-seed + refresh */
export async function rebuildLedger(invalidate: (key: string[]) => void) {
  await seedStockHistory()
  invalidate(['stock-ledger'])
}
