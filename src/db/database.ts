import Dexie, { type Table } from 'dexie'
import type { Category, Product, Sale, StockHistory, AppSetting } from './schema'

// ─────────────────────────────────────────────────────────────────────────────
// DATABASE MIGRATION RULES — read this before every schema change
// ─────────────────────────────────────────────────────────────────────────────
//
// All user data lives in IndexedDB under the name 'BlessedAutoSpares'.
// This data is NEVER erased by app updates — only by the user clearing
// browser/app storage, or by a migration that explicitly calls .clear().
//
// SAFE to do in a new version:
//   ✅ Add a new store:    this.version(N).stores({ ...existing, newTable: 'id, ...' })
//   ✅ Add a new index:    add a column to an existing store's index string
//   ✅ Set new settings:   tx.table('settings').put({ key: '...', value: '...' })
//   ✅ Back-fill data:     add default values to existing rows
//
// NEVER do in an upgrade callback:
//   ❌ tx.table('sales').clear()       — destroys all sales records
//   ❌ tx.table('products').clear()    — destroys all inventory
//   ❌ tx.table('stockHistory').clear()— destroys audit trail
//   ❌ Rename the DB ('BlessedAutoSpares') — creates a new empty database
//   ❌ Remove a store from .stores({}) — Dexie deletes the table and its data
//
// HOW TO ADD A NEW VERSION:
//   1. Increment the version number (currently at 3).
//   2. Copy the full stores() definition from the previous version.
//   3. Add only the new indexes / stores you need.
//   4. Write an upgrade() callback only if data transformation is required.
//   5. Never call .clear() or .delete() on user data tables.
//
// ─────────────────────────────────────────────────────────────────────────────

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
    // v2: wipe demo data, replace with real Blessed Auto Spares catalog
    this.version(2).stores({
      products: 'id, name, sku, categoryId, stockQuantity, isActive',
      categories: 'id, name',
      sales: 'id, receiptNumber, soldAt',
      stockHistory: 'id, productId, createdAt',
      settings: 'key',
    }).upgrade(async tx => {
      await tx.table('products').clear()
      await tx.table('categories').clear()
    })
    // v3: correct shop contact details + index changeType for ledger queries
    this.version(3).stores({
      products: 'id, name, sku, categoryId, stockQuantity, isActive',
      categories: 'id, name',
      sales: 'id, receiptNumber, soldAt',
      stockHistory: 'id, productId, createdAt, changeType',
      settings: 'key',
    }).upgrade(async tx => {
      await tx.table('settings').put({ key: 'shopPhone',   value: '+254 700 225849' })
      await tx.table('settings').put({ key: 'shopAddress', value: 'Sondu Nyamira, Kenya' })
    })
  }
}

export const db = new BlessedAutoDb()

// Seed default settings on very first run
db.on('ready', async () => {
  const settingsCount = await db.settings.count()
  if (settingsCount === 0) {
    await db.settings.bulkPut([
      { key: 'shopName',            value: 'Blessed Auto Spares' },
      { key: 'shopPhone',           value: '+254 700 225849' },
      { key: 'shopAddress',         value: 'Sondu Nyamira, Kenya' },
      { key: 'currencySymbol',      value: 'KES' },
      { key: 'operatorName',        value: 'Owner' },
      { key: 'defaultReorderLevel', value: '5' },
      { key: 'receiptFooter',       value: 'Thank you for your business!' },
      { key: 'darkMode',            value: 'false' },
    ])
  }
})
