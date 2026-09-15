export interface Category {
  id: string
  name: string
  colorHex: string
  icon: string
  createdAt: number
}

export interface Product {
  id: string
  name: string
  sku: string
  categoryId: string
  buyingPrice: number
  sellingPrice: number
  stockQuantity: number
  reorderLevel: number
  unit: string
  description: string
  imageDataUrl?: string
  isActive: boolean
  createdAt: number
  updatedAt: number
}

export interface SaleItem {
  productId: string
  productName: string
  sku: string
  quantity: number
  buyingPriceSnapshot: number
  sellingPriceSnapshot: number
  lineTotal: number
  lineProfit: number
}

export interface Sale {
  id: string
  receiptNumber: string
  soldAt: number
  items: SaleItem[]
  subtotal: number
  totalProfit: number
  paymentMethod: 'cash' | 'mpesa' | 'card' | 'credit'
  amountTendered: number
  changeGiven: number
  customerName: string
  notes: string
  createdBy: string
}

export interface StockHistory {
  id: string
  productId: string
  changeType: 'sale' | 'restock' | 'adjustment'
  quantityBefore: number
  quantityChange: number
  quantityAfter: number
  relatedSaleId: string
  note: string
  createdAt: number
}

export interface AppSetting {
  key: string
  value: string
}

export interface CartItem {
  product: Product
  quantity: number
}
