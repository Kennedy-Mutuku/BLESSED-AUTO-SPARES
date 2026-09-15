import type { Product, SaleItem } from '../db/schema'

export function profitMargin(buyingPrice: number, sellingPrice: number): number {
  if (sellingPrice === 0) return 0
  return ((sellingPrice - buyingPrice) / sellingPrice) * 100
}

export function profitPerUnit(buyingPrice: number, sellingPrice: number): number {
  return sellingPrice - buyingPrice
}

export function stockValuation(products: Product[]) {
  return products.reduce(
    (acc, p) => {
      acc.capitalTiedUp += p.buyingPrice * p.stockQuantity
      acc.potentialRevenue += p.sellingPrice * p.stockQuantity
      acc.potentialProfit += (p.sellingPrice - p.buyingPrice) * p.stockQuantity
      return acc
    },
    { capitalTiedUp: 0, potentialRevenue: 0, potentialProfit: 0 }
  )
}

export function cartTotal(items: { product: { sellingPrice: number; buyingPrice: number }; quantity: number }[]) {
  return items.reduce(
    (acc, item) => {
      const lineTotal = item.product.sellingPrice * item.quantity
      const lineProfit = (item.product.sellingPrice - item.product.buyingPrice) * item.quantity
      acc.subtotal += lineTotal
      acc.profit += lineProfit
      return acc
    },
    { subtotal: 0, profit: 0 }
  )
}

export function saleItemsFromCart(
  items: { product: { id: string; name: string; sku: string; sellingPrice: number; buyingPrice: number }; quantity: number }[]
): SaleItem[] {
  return items.map((item) => ({
    productId: item.product.id,
    productName: item.product.name,
    sku: item.product.sku,
    quantity: item.quantity,
    buyingPriceSnapshot: item.product.buyingPrice,
    sellingPriceSnapshot: item.product.sellingPrice,
    lineTotal: item.product.sellingPrice * item.quantity,
    lineProfit: (item.product.sellingPrice - item.product.buyingPrice) * item.quantity,
  }))
}
