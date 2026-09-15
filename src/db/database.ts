import Dexie, { type Table } from 'dexie'
import type { Category, Product, Sale, StockHistory, AppSetting } from './schema'

export class BlessedAutoDb extends Dexie {
  products!: Table<Product>
  categories!: Table<Category>
  sales!: Table<Sale>
  stockHistory!: Table<StockHistory>
  settings!: Table<AppSetting>

  constructor() {
    super('BlessedAutoSpares')
    this.version(1).stores({
      products: 'id, name, sku, categoryId, stockQuantity, isActive',
      categories: 'id, name',
      sales: 'id, receiptNumber, soldAt',
      stockHistory: 'id, productId, createdAt',
      settings: 'key',
    })
  }
}

export const db = new BlessedAutoDb()

// Seed default settings on first run
db.on('ready', async () => {
  const count = await db.settings.count()
  if (count === 0) {
    await db.settings.bulkPut([
      { key: 'shopName', value: 'Blessed Auto Spares' },
      { key: 'shopPhone', value: '+254 700 000000' },
      { key: 'shopAddress', value: 'Nairobi, Kenya' },
      { key: 'currencySymbol', value: 'KES' },
      { key: 'operatorName', value: 'Owner' },
      { key: 'defaultReorderLevel', value: '5' },
      { key: 'receiptFooter', value: 'Thank you for your business!' },
      { key: 'darkMode', value: 'false' },
    ])
  }
})
