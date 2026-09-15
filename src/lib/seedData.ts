import { db } from '../db/database'
import { generateId } from './utils'
import type { Category, Product } from '../db/schema'

export async function seedDemoData() {
  // Categories
  const categories: Category[] = [
    { id: generateId(), name: 'Brakes', colorHex: '#ef4444', icon: '🛑', createdAt: Date.now() },
    { id: generateId(), name: 'Engine', colorHex: '#f59e0b', icon: '⚙️', createdAt: Date.now() },
    { id: generateId(), name: 'Suspension', colorHex: '#3b82f6', icon: '🔧', createdAt: Date.now() },
    { id: generateId(), name: 'Electrical', colorHex: '#10b981', icon: '⚡', createdAt: Date.now() },
    { id: generateId(), name: 'Body Parts', colorHex: '#8b5cf6', icon: '🚗', createdAt: Date.now() },
  ]
  await db.categories.bulkPut(categories)

  const catMap = Object.fromEntries(categories.map((c) => [c.name, c.id]))

  const products: Product[] = [
    { id: generateId(), name: 'Brake Pads Front (Toyota)', sku: 'BP-TOY-001', categoryId: catMap.Brakes, buyingPrice: 800, sellingPrice: 1200, stockQuantity: 15, reorderLevel: 5, unit: 'set', description: 'OEM compatible front brake pads', isActive: true, createdAt: Date.now(), updatedAt: Date.now() },
    { id: generateId(), name: 'Brake Disc Rear', sku: 'BD-TOY-002', categoryId: catMap.Brakes, buyingPrice: 1500, sellingPrice: 2200, stockQuantity: 8, reorderLevel: 3, unit: 'pcs', description: '', isActive: true, createdAt: Date.now(), updatedAt: Date.now() },
    { id: generateId(), name: 'Engine Oil Filter', sku: 'EOF-001', categoryId: catMap.Engine, buyingPrice: 250, sellingPrice: 450, stockQuantity: 30, reorderLevel: 10, unit: 'pcs', description: 'Universal oil filter', isActive: true, createdAt: Date.now(), updatedAt: Date.now() },
    { id: generateId(), name: 'Air Filter (Nissan)', sku: 'AF-NIS-003', categoryId: catMap.Engine, buyingPrice: 350, sellingPrice: 600, stockQuantity: 12, reorderLevel: 5, unit: 'pcs', description: '', isActive: true, createdAt: Date.now(), updatedAt: Date.now() },
    { id: generateId(), name: 'Spark Plugs (set of 4)', sku: 'SP-NGK-004', categoryId: catMap.Engine, buyingPrice: 600, sellingPrice: 950, stockQuantity: 20, reorderLevel: 8, unit: 'set', description: 'NGK iridium spark plugs', isActive: true, createdAt: Date.now(), updatedAt: Date.now() },
    { id: generateId(), name: 'Shock Absorber Front', sku: 'SA-FNT-005', categoryId: catMap.Suspension, buyingPrice: 2500, sellingPrice: 3800, stockQuantity: 4, reorderLevel: 2, unit: 'pcs', description: '', isActive: true, createdAt: Date.now(), updatedAt: Date.now() },
    { id: generateId(), name: 'Ball Joint Lower', sku: 'BJ-LWR-006', categoryId: catMap.Suspension, buyingPrice: 800, sellingPrice: 1300, stockQuantity: 6, reorderLevel: 3, unit: 'pcs', description: '', isActive: true, createdAt: Date.now(), updatedAt: Date.now() },
    { id: generateId(), name: 'Alternator Belt', sku: 'AB-007', categoryId: catMap.Engine, buyingPrice: 400, sellingPrice: 700, stockQuantity: 10, reorderLevel: 4, unit: 'pcs', description: '', isActive: true, createdAt: Date.now(), updatedAt: Date.now() },
    { id: generateId(), name: 'Car Battery 55Ah', sku: 'BAT-55-008', categoryId: catMap.Electrical, buyingPrice: 5500, sellingPrice: 7500, stockQuantity: 3, reorderLevel: 2, unit: 'pcs', description: 'Maintenance free battery', isActive: true, createdAt: Date.now(), updatedAt: Date.now() },
    { id: generateId(), name: 'Headlight Bulb H4', sku: 'HB-H4-009', categoryId: catMap.Electrical, buyingPrice: 150, sellingPrice: 280, stockQuantity: 25, reorderLevel: 10, unit: 'pcs', description: '', isActive: true, createdAt: Date.now(), updatedAt: Date.now() },
    { id: generateId(), name: 'Spare Wheel (Steel 15")', sku: 'SW-15-010', categoryId: catMap['Body Parts'], buyingPrice: 3000, sellingPrice: 4500, stockQuantity: 2, reorderLevel: 1, unit: 'pcs', description: '15 inch steel rim', isActive: true, createdAt: Date.now(), updatedAt: Date.now() },
    { id: generateId(), name: 'Side Mirror (Right)', sku: 'SM-RHT-011', categoryId: catMap['Body Parts'], buyingPrice: 1200, sellingPrice: 1800, stockQuantity: 0, reorderLevel: 2, unit: 'pcs', description: '', isActive: true, createdAt: Date.now(), updatedAt: Date.now() },
  ]
  await db.products.bulkPut(products)

  return { categories: categories.length, products: products.length }
}
