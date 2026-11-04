import { db } from '../db/database'
import { generateId } from './utils'
import type { Category, Product } from '../db/schema'

/**
 * Seeds the real Blessed Auto Spares product catalog.
 * Sourced from the official stock purchase records.
 * Duplicate products across purchase dates are consolidated:
 *   – quantities summed (total stock)
 *   – latest buying/selling price used
 */
export async function seedRealInventory() {
  // ── Categories ─────────────────────────────────────────────────────────────
  const categories: Category[] = [
    { id: generateId(), name: 'Oils & Lubricants',       colorHex: '#f59e0b', icon: '🛢️',  createdAt: Date.now() },
    { id: generateId(), name: 'Tyres',                   colorHex: '#1d4ed8', icon: '⭕',  createdAt: Date.now() },
    { id: generateId(), name: 'Brakes',                  colorHex: '#ef4444', icon: '🛑',  createdAt: Date.now() },
    { id: generateId(), name: 'Engine Parts',            colorHex: '#10b981', icon: '⚙️',  createdAt: Date.now() },
    { id: generateId(), name: 'Suspension & Steering',   colorHex: '#8b5cf6', icon: '🔩',  createdAt: Date.now() },
    { id: generateId(), name: 'Electrical & Lighting',   colorHex: '#0ea5e9', icon: '💡',  createdAt: Date.now() },
    { id: generateId(), name: 'Chemicals & Accessories', colorHex: '#f97316', icon: '🧴',  createdAt: Date.now() },
  ]
  await db.categories.bulkPut(categories)

  const c = Object.fromEntries(categories.map(cat => [cat.name, cat.id]))
  const now = Date.now()

  function prod(
    name: string, sku: string, category: string,
    buyingPrice: number, sellingPrice: number,
    stockQuantity: number, reorderLevel: number,
    unit: string, description = '',
  ): Product {
    return {
      id: generateId(), name, sku,
      categoryId: c[category],
      buyingPrice, sellingPrice,
      stockQuantity, reorderLevel,
      unit, description,
      isActive: true,
      createdAt: now, updatedAt: now,
    }
  }

  const products: Product[] = [

    // ── OILS & LUBRICANTS ───────────────────────────────────────────────────
    // Note: HX5 1L  appears 10-Jul & 26-Aug  → latest price used, qty summed (36)
    //       HX5 4L  appears 13-Jul & 03-Sep  → latest price used, qty summed (16)
    //       TC CVT  appears 23-Jul & 27-Aug  → latest price used, qty summed (3)
    prod('Magic Gear Oil 140 1L',          'OIL-001', 'Oils & Lubricants',   300,   400,  10, 3, 'btl', 'Gear oil 140 viscosity'),
    prod('Magic Gear Oil 140 500ml',       'OIL-002', 'Oils & Lubricants',   175,   250,  10, 3, 'btl', 'Gear oil 140 viscosity – half litre'),
    prod('Total HBF Brake Fluid 250ml',    'OIL-003', 'Oils & Lubricants',   290,   350,  20, 5, 'btl', 'Total HBF hydraulic brake fluid'),
    prod('Total Quartz 20W-50 4L',         'OIL-004', 'Oils & Lubricants',  2470,  2700,   6, 2, 'btl', 'Total Quartz 20W-50 engine oil'),
    prod('R3 Motor Oil 1L',                'OIL-005', 'Oils & Lubricants',   585,   700,  12, 4, 'btl', 'R3 mineral engine oil – 1 litre'),
    prod('R3 Motor Oil 5L',                'OIL-006', 'Oils & Lubricants',  2932,  3150,   3, 1, 'btl', 'R3 mineral engine oil – 5 litre'),
    prod('HX5 Motor Oil 1L',               'OIL-007', 'Oils & Lubricants',   330,   400,  36, 8, 'btl', 'Shell Helix HX5 engine oil – 1 litre'),
    prod('HX5 Motor Oil 4L',               'OIL-008', 'Oils & Lubricants',  1900,  2300,  16, 4, 'btl', 'Shell Helix HX5 engine oil – 4 litre'),
    prod('Classic Motor Oil 1L',           'OIL-009', 'Oils & Lubricants',   490,   600,  12, 4, 'btl', 'Classic mineral engine oil – 1 litre'),
    prod('Classic Motor Oil 4L',           'OIL-010', 'Oils & Lubricants',  1933,  2300,   3, 2, 'btl', 'Classic mineral engine oil – 4 litre'),
    prod('Spirax ATF 1L',                  'OIL-011', 'Oils & Lubricants',   668,   800,   6, 2, 'btl', 'Shell Spirax automatic transmission fluid – 1 litre'),
    prod('Spirax ATF 4L',                  'OIL-012', 'Oils & Lubricants',  2625,  2900,   4, 2, 'btl', 'Shell Spirax automatic transmission fluid – 4 litre'),
    prod('Shell Coolant 1L',               'OIL-013', 'Oils & Lubricants',   700,   800,   6, 2, 'btl', 'Shell antifreeze / coolant concentrate'),
    prod('Top ATF 1L',                     'OIL-014', 'Oils & Lubricants',   290,   400,  10, 3, 'btl', 'Top automatic transmission fluid – 1 litre'),
    prod('ATF D2',                         'OIL-015', 'Oils & Lubricants',  3036,  3500,   1, 1, 'btl', 'Automatic transmission fluid D2'),
    prod('TC CVT Fluid 4L',                'OIL-016', 'Oils & Lubricants',  2000,  2800,   3, 1, 'btl', 'TC continuously variable transmission fluid – 4 litre'),
    prod('Toyota T-IV ATF 4L',             'OIL-017', 'Oils & Lubricants',  2800,  3500,   1, 1, 'btl', 'Toyota genuine T-IV automatic transmission fluid'),
    prod('Nogrex Multi-Purpose Grease',    'OIL-018', 'Oils & Lubricants',   200,   300,  12, 3, 'pcs', 'Nogrex general-purpose lubricating grease'),
    prod('Powerlex Grease',                'OIL-019', 'Oils & Lubricants',   250,   350,  12, 3, 'pcs', 'Powerlex multipurpose grease'),
    prod('Powerlex ATF 500ml',             'OIL-020', 'Oils & Lubricants',   200,   300,  20, 5, 'btl', 'Powerlex automatic transmission fluid – 500ml'),

    // ── TYRES ───────────────────────────────────────────────────────────────
    // Note: Tyre Joy Road 195/65 R15 appears 14-Jul & 26-Aug → qty summed (6)
    //       Tyre 195/70 R14 appears 23-Jul & 26-Aug         → latest price used, qty summed (4)
    prod('Tyre Lion Lord 185/70 R14',      'TYR-001', 'Tyres',  3300,  4000,  4, 2, 'pcs', 'Lion Lord radial tyre 185/70 R14'),
    prod('Tyre Joy Road 185/70 R13',       'TYR-002', 'Tyres',  3500,  4200,  5, 2, 'pcs', 'Joy Road radial tyre 185/70 R13'),
    prod('Tyre Joy Road 185/70 R14',       'TYR-003', 'Tyres',  3600,  4200,  4, 2, 'pcs', 'Joy Road radial tyre 185/70 R14'),
    prod('Tyre Joy Road 195/65 R15',       'TYR-004', 'Tyres',  4100,  4800,  6, 2, 'pcs', 'Joy Road radial tyre 195/65 R15'),
    prod('Tyre Auston 185/70 R14',         'TYR-005', 'Tyres',  4600,  5200,  2, 1, 'pcs', 'Auston radial tyre 185/70 R14'),
    prod('Tyre Auston 195/70 R15',         'TYR-006', 'Tyres',  9000, 10000,  3, 1, 'pcs', 'Auston radial tyre 195/70 R15'),
    prod('Tyre 195/70 R14',                'TYR-007', 'Tyres',  4400,  5200,  4, 2, 'pcs', 'Radial tyre 195/70 R14'),

    // ── BRAKES ──────────────────────────────────────────────────────────────
    prod('Pro-Box Brake Pads KD-2701',     'BRK-001', 'Brakes',  1300,  1500,  5, 2, 'set', 'Pro-Box front/rear brake pads – ref KD-2701'),
    prod('Pro-Box Brake Pads Asimo',       'BRK-002', 'Brakes',  1300,  1500,  5, 2, 'set', 'Pro-Box front/rear brake pads – Asimo'),
    prod('Pro-Box Brake Pads Lotus',       'BRK-003', 'Brakes',  1100,  1300,  5, 2, 'set', 'Pro-Box front/rear brake pads – Lotus'),
    prod('Brake Pads Premium',             'BRK-004', 'Brakes',   900,  1300,  2, 1, 'set', 'Premium grade brake pads'),
    prod('Brake Fluid Standard (Large)',   'BRK-005', 'Brakes',   250,   300, 10, 3, 'btl', 'Standard DOT brake fluid – large bottle'),
    prod('Brake Fluid Standard (Small)',   'BRK-006', 'Brakes',   150,   200, 10, 3, 'btl', 'Standard DOT brake fluid – small bottle'),

    // ── ENGINE PARTS ────────────────────────────────────────────────────────
    prod('Oil Filter 03001',               'ENG-001', 'Engine Parts',   150,   200, 20, 5, 'pcs', 'Universal spin-on oil filter – ref 03001'),
    prod('Pro-Box Air Cleaner',            'ENG-002', 'Engine Parts',   200,   300, 10, 3, 'pcs', 'Replacement air filter element – Pro-Box'),
    prod('Air Cleaner Premium',            'ENG-003', 'Engine Parts',   160,   400,  5, 2, 'pcs', 'Premium grade replacement air filter'),
    prod('Chopper Air Cleaner',            'ENG-004', 'Engine Parts',   400,   800,  2, 1, 'pcs', 'Chopper brand air filter element'),
    prod('Premier Nyoka Air Cleaner',      'ENG-005', 'Engine Parts',   200,   400,  5, 2, 'pcs', 'Premier Nyoka air filter element'),
    prod('Denso Spark Plugs (Standard)',   'ENG-006', 'Engine Parts',   170,   250, 10, 3, 'pcs', 'Denso standard copper spark plug'),
    prod('NGK Spark Plug Single Electrode','ENG-007', 'Engine Parts',   800,  1000,  5, 2, 'pcs', 'NGK single-electrode spark plug'),
    prod('NGK Spark Plug Double Electrode','ENG-008', 'Engine Parts',  1200,  1500,  4, 2, 'pcs', 'NGK double-electrode spark plug'),
    prod('NGK Iridium Spark Plug',         'ENG-009', 'Engine Parts',  1500,  2500,  2, 1, 'pcs', 'NGK IX iridium performance spark plug'),
    prod('G-Power Iridium Spark Plugs',    'ENG-010', 'Engine Parts',  1000,  1500, 10, 3, 'pcs', 'NGK G-Power platinum / iridium spark plug'),
    prod('Denso Iridium Plug Short',       'ENG-011', 'Engine Parts',   250,   500, 10, 3, 'pcs', 'Denso iridium spark plug – short reach'),
    prod('Denso Iridium Plug Long',        'ENG-012', 'Engine Parts',   250,   500, 10, 3, 'pcs', 'Denso iridium spark plug – long reach'),
    prod('Head Gasket (Universal)',        'ENG-013', 'Engine Parts',   250,   500,  5, 2, 'pcs', 'Universal cylinder head gasket'),
    prod('Head Gasket 2ZR',                'ENG-014', 'Engine Parts',   500,   800,  5, 2, 'pcs', 'Cylinder head gasket – Toyota 2ZR engine'),
    prod('Head Gasket 1NZ',                'ENG-015', 'Engine Parts',   350,   600,  5, 2, 'pcs', 'Cylinder head gasket – Toyota 1NZ engine'),
    prod('Head Gasket 4E',                 'ENG-016', 'Engine Parts',   350,   600,  5, 2, 'pcs', 'Cylinder head gasket – Toyota 4E engine'),
    prod('Shellac Gasket',                 'ENG-017', 'Engine Parts',   200,   400, 10, 3, 'pcs', 'Shellac paper gasket'),
    prod('Fan Belt',                       'ENG-018', 'Engine Parts',   250,   500, 20, 5, 'pcs', 'Alternator / accessory V-belt'),
    prod('Fuel Pump',                      'ENG-019', 'Engine Parts',  1000,  1500,  4, 2, 'pcs', 'Electric fuel pump'),

    // ── SUSPENSION & STEERING ───────────────────────────────────────────────
    prod('CV Joint',                       'SUS-001', 'Suspension & Steering',  1800,  2500,  6, 2, 'pcs', 'Constant velocity joint'),
    prod('Front Shock Absorber',           'SUS-002', 'Suspension & Steering',  2800,  3500,  6, 2, 'pcs', 'Front hydraulic shock absorber'),
    prod('CV Joint Boot Rubber',           'SUS-003', 'Suspension & Steering',   200,   300,  5, 2, 'pcs', 'CV joint rubber gaiter / boot'),
    prod('Rack End SR3600',                'SUS-004', 'Suspension & Steering',  1500,  2500,  3, 1, 'pcs', 'Steering rack end – ref SR3600'),
    prod('Rack End SR3640',                'SUS-005', 'Suspension & Steering',  1500,  2500,  3, 1, 'pcs', 'Steering rack end – ref SR3640'),
    prod('Rack End SR3930',                'SUS-006', 'Suspension & Steering',  1800,  2700,  1, 1, 'pcs', 'Steering rack end – ref SR3930'),
    prod('Ball Joint SB-3642',             'SUS-007', 'Suspension & Steering',  1500,  2500,  3, 1, 'pcs', 'Lower ball joint – ref SB-3642'),
    prod('Ball Joint SB-3602',             'SUS-008', 'Suspension & Steering',  1500,  2500,  4, 2, 'pcs', 'Lower ball joint – ref SB-3602'),
    prod('Tie Rod End SE-3931R',           'SUS-009', 'Suspension & Steering',  1800,  2700,  1, 1, 'pcs', 'Tie rod end right – ref SE-3931R'),
    prod('Tie Rod End SE-3601L',           'SUS-010', 'Suspension & Steering',  1500,  2500,  3, 1, 'pcs', 'Tie rod end left – ref SE-3601L'),
    prod('Tie Rod End SE-3641',            'SUS-011', 'Suspension & Steering',  1500,  2500,  3, 1, 'pcs', 'Tie rod end – ref SE-3641'),
    prod('Arm Bush 0D060 (Standard)',      'SUS-012', 'Suspension & Steering',   500,  1000,  3, 1, 'pcs', 'Control arm bush – ref 0D060 standard size'),
    prod('Arm Bush 12170 (Standard)',      'SUS-013', 'Suspension & Steering',   500,  1000,  3, 1, 'pcs', 'Control arm bush – ref 12170 standard size'),
    prod('Arm Bush 12120 (Standard)',      'SUS-014', 'Suspension & Steering',   500,  1000,  3, 1, 'pcs', 'Control arm bush – ref 12120 standard size'),
    prod('Arm Bush 0D060 (Small)',         'SUS-015', 'Suspension & Steering',   350,   700,  3, 1, 'pcs', 'Control arm bush – ref 0D060 small size'),
    prod('Arm Bush 12170 (Small)',         'SUS-016', 'Suspension & Steering',   350,   700,  3, 1, 'pcs', 'Control arm bush – ref 12170 small size'),
    prod('Arm Bush 12120 (Small)',         'SUS-017', 'Suspension & Steering',   350,   700,  3, 1, 'pcs', 'Control arm bush – ref 12120 small size'),
    prod('Arm Bush 0D051',                 'SUS-018', 'Suspension & Steering',   500,  1000,  2, 1, 'pcs', 'Control arm bush – ref 0D051'),
    prod('Cross Bearing (Small)',          'SUS-019', 'Suspension & Steering',   550,  1000,  5, 2, 'pcs', 'Universal cross / spider bearing – small'),
    prod('Cross Bearing (Large)',          'SUS-020', 'Suspension & Steering',   650,  1200,  5, 2, 'pcs', 'Universal cross / spider bearing – large'),
    prod('Wheel Bearing 38122',            'SUS-021', 'Suspension & Steering',   700,  1400,  3, 1, 'pcs', 'Wheel hub bearing – ref 38122'),
    prod('Wheel Bearing 40112',            'SUS-022', 'Suspension & Steering',   700,  1400,  3, 1, 'pcs', 'Wheel hub bearing – ref 40112'),
    prod('Wheel Bearing 38112',            'SUS-023', 'Suspension & Steering',   700,  1400,  3, 1, 'pcs', 'Wheel hub bearing – ref 38112'),
    prod('Wheel Bearing 43106',            'SUS-024', 'Suspension & Steering',  1200,  2400,  3, 1, 'pcs', 'Wheel hub bearing – ref 43106'),

    // ── ELECTRICAL & LIGHTING ───────────────────────────────────────────────
    prod('T-20 Clear Bulb',                'ELC-001', 'Electrical & Lighting',   40,   100, 20, 5, 'pcs', 'T-20 wedge bulb – clear'),
    prod('T-20 Coloured Bulb',             'ELC-002', 'Electrical & Lighting',   50,   100, 20, 5, 'pcs', 'T-20 wedge bulb – coloured'),
    prod('Zinno H3 Bulb',                  'ELC-003', 'Electrical & Lighting',  150,   300, 10, 3, 'pcs', 'Zinno H3 halogen headlight bulb'),
    prod('Zinno H4 900 Bulb',              'ELC-004', 'Electrical & Lighting',  250,   400, 16, 4, 'pcs', 'Zinno H4 900 halogen headlight bulb'),
    prod('Koito H4 Bulb',                  'ELC-005', 'Electrical & Lighting',  250,   400, 10, 3, 'pcs', 'Koito H4 halogen headlight bulb (genuine OEM)'),
    prod('A/C Electrical Terminal',        'ELC-006', 'Electrical & Lighting',   79,   150, 24, 8, 'pcs', 'Electrical wiring terminal connector – A/C type'),
    prod('Fuse (Standard)',                'ELC-007', 'Electrical & Lighting',  100,   200,  6, 3, 'pcs', 'Blade / standard automotive fuse'),
    prod('Chrome Wheel Nuts',              'ELC-008', 'Electrical & Lighting',   40,   100, 10, 5, 'pcs', 'Chrome-plated decorative wheel nuts'),

    // ── CHEMICALS & ACCESSORIES ─────────────────────────────────────────────
    // Note: Green/Red Coolant appears 14-Jul (12) & 03-Sep (5) → qty summed (17)
    prod('Captain Silicon Sealant 32g',    'CHM-001', 'Chemicals & Accessories',   90,   120, 12, 3, 'pcs', 'Captain grey RTV silicone gasket sealant – 32g tube'),
    prod('Captain Silicon Sealant (Large)','CHM-002', 'Chemicals & Accessories',  160,   200, 24, 5, 'pcs', 'Captain grey RTV silicone gasket sealant – large size'),
    prod('Abro Original Silicone Sealant', 'CHM-003', 'Chemicals & Accessories',  700,  1000, 10, 3, 'pcs', 'Abro Original high-temp RTV silicone sealant'),
    prod('Carb & Choke Cleaner 120ml',     'CHM-004', 'Chemicals & Accessories',  150,   250, 10, 3, 'pcs', 'Carburettor and choke spray cleaner – 120ml'),
    prod('Coolant / Antifreeze 1L',        'CHM-005', 'Chemicals & Accessories',  130,   300, 17, 5, 'btl', 'Radiator coolant antifreeze – green / red 1 litre'),
    prod('Araldite Epoxy Adhesive (Small)','CHM-006', 'Chemicals & Accessories',   71,   100, 12, 3, 'pcs', 'Araldite two-part epoxy adhesive – small pack'),
    prod('Araldite Epoxy Adhesive (Large)','CHM-007', 'Chemicals & Accessories',  180,   250, 10, 3, 'pcs', 'Araldite two-part epoxy adhesive – large pack'),
    prod('Super Glue',                     'CHM-008', 'Chemicals & Accessories',   25,    30, 12, 5, 'pcs', 'Instant cyanoacrylate super glue'),
    prod('Insulating Tape',                'CHM-009', 'Chemicals & Accessories',   45,    50, 10, 5, 'pcs', 'PVC electrical insulating tape'),
    prod('Gun Gum Exhaust Sealant',        'CHM-010', 'Chemicals & Accessories',  200,   300, 10, 3, 'pcs', 'Gun Gum high-temperature exhaust repair sealant'),
    prod('Motor Honey Oil Supplement',     'CHM-011', 'Chemicals & Accessories',  350,   500,  2, 1, 'btl', 'Motor Honey engine oil treatment and supplement'),
    prod('Vin Carbon 104',                 'CHM-012', 'Chemicals & Accessories',  300,   500,  7, 2, 'pcs', 'Vin Carbon 104 fuel injector / carbon cleaner'),
    prod('Radiator Cap (Standard)',        'CHM-013', 'Chemicals & Accessories',  150,   300,  8, 3, 'pcs', 'Standard pressurised radiator cap'),
  ]

  await db.products.bulkPut(products)
  await seedStockHistory()
  return { categories: categories.length, products: products.length }
}

/** Alias kept for Settings page compatibility */
export const seedDemoData = seedRealInventory

/**
 * Seeds the complete stock-received history with exact purchase dates.
 * Safe to call multiple times — clears previous history entries first.
 */
export async function seedStockHistory() {
  function d(year: number, month: number, day: number): number {
    return new Date(year, month - 1, day, 9, 0, 0, 0).getTime()
  }

  type E = { sku: string; qty: number; buy: number; sell: number; ts: number }

  // All stock receipt entries in chronological order, exactly as per purchase records
  const entries: E[] = [
    // ── 11/07/2025 ──────────────────────────────────────────────────────────
    { sku: 'BRK-001', qty:  5, buy: 1300, sell: 1500, ts: d(2025,  7, 11) },
    { sku: 'BRK-002', qty:  5, buy: 1300, sell: 1500, ts: d(2025,  7, 11) },
    { sku: 'BRK-003', qty:  5, buy: 1100, sell: 1300, ts: d(2025,  7, 11) },
    { sku: 'OIL-017', qty:  1, buy: 2800, sell: 3500, ts: d(2025,  7, 11) },
    { sku: 'ENG-006', qty: 10, buy:  170, sell:  250, ts: d(2025,  7, 11) },
    { sku: 'ENG-002', qty: 10, buy:  200, sell:  300, ts: d(2025,  7, 11) },
    // ── 10/07/2026 ──────────────────────────────────────────────────────────
    { sku: 'CHM-001', qty: 12, buy:   90, sell:  120, ts: d(2026,  7, 10) },
    { sku: 'OIL-001', qty: 10, buy:  300, sell:  400, ts: d(2026,  7, 10) },
    { sku: 'OIL-002', qty: 10, buy:  175, sell:  250, ts: d(2026,  7, 10) },
    { sku: 'CHM-004', qty: 10, buy:  150, sell:  250, ts: d(2026,  7, 10) },
    { sku: 'OIL-003', qty: 20, buy:  290, sell:  350, ts: d(2026,  7, 10) },
    { sku: 'OIL-004', qty:  6, buy: 2470, sell: 2700, ts: d(2026,  7, 10) },
    { sku: 'ENG-001', qty: 20, buy:  150, sell:  200, ts: d(2026,  7, 10) },
    // ── 13/07/2026 ──────────────────────────────────────────────────────────
    { sku: 'OIL-006', qty:  3, buy: 2932, sell: 3150, ts: d(2026,  7, 13) },
    { sku: 'OIL-007', qty: 12, buy:  612, sell:  800, ts: d(2026,  7, 13) },
    { sku: 'OIL-012', qty:  4, buy: 2625, sell: 2900, ts: d(2026,  7, 13) },
    { sku: 'OIL-013', qty:  6, buy:  700, sell:  800, ts: d(2026,  7, 13) },
    { sku: 'OIL-008', qty:  8, buy: 2365, sell: 2700, ts: d(2026,  7, 13) },
    { sku: 'TYR-001', qty:  4, buy: 3300, sell: 4000, ts: d(2026,  7, 13) },
    { sku: 'TYR-003', qty:  4, buy: 3600, sell: 4200, ts: d(2026,  7, 13) },
    { sku: 'TYR-005', qty:  2, buy: 4600, sell: 5200, ts: d(2026,  7, 13) },
    // ── 14/07/2026 ──────────────────────────────────────────────────────────
    { sku: 'ENG-007', qty:  5, buy:  800, sell: 1000, ts: d(2026,  7, 14) },
    { sku: 'ENG-008', qty:  4, buy: 1200, sell: 1500, ts: d(2026,  7, 14) },
    { sku: 'CHM-005', qty: 12, buy:  130, sell:  300, ts: d(2026,  7, 14) },
    { sku: 'OIL-009', qty: 12, buy:  490, sell:  600, ts: d(2026,  7, 14) },
    { sku: 'OIL-018', qty: 12, buy:  200, sell:  300, ts: d(2026,  7, 14) },
    { sku: 'CHM-006', qty: 12, buy:   71, sell:  100, ts: d(2026,  7, 14) },
    { sku: 'CHM-007', qty: 10, buy:  180, sell:  250, ts: d(2026,  7, 14) },
    { sku: 'TYR-002', qty:  5, buy: 3500, sell: 4200, ts: d(2026,  7, 14) },
    { sku: 'CHM-008', qty: 12, buy:   25, sell:   30, ts: d(2026,  7, 14) },
    { sku: 'CHM-009', qty: 10, buy:   45, sell:   50, ts: d(2026,  7, 14) },
    { sku: 'TYR-004', qty:  2, buy: 4100, sell: 4800, ts: d(2026,  7, 14) },
    { sku: 'OIL-005', qty: 12, buy:  585, sell:  700, ts: d(2026,  7, 14) },
    // ── 23/07/2026 ──────────────────────────────────────────────────────────
    { sku: 'TYR-006', qty:  3, buy: 9000, sell:10000, ts: d(2026,  7, 23) },
    { sku: 'TYR-007', qty:  2, buy: 5800, sell: 7000, ts: d(2026,  7, 23) },
    { sku: 'OIL-016', qty:  1, buy: 2600, sell: 3300, ts: d(2026,  7, 23) },
    // ── 26/08/2026 ──────────────────────────────────────────────────────────
    { sku: 'TYR-004', qty:  4, buy: 4100, sell: 4800, ts: d(2026,  8, 26) },
    { sku: 'TYR-007', qty:  2, buy: 4400, sell: 5200, ts: d(2026,  8, 26) },
    { sku: 'OIL-010', qty:  3, buy: 1933, sell: 2300, ts: d(2026,  8, 26) },
    { sku: 'OIL-014', qty: 10, buy:  290, sell:  400, ts: d(2026,  8, 26) },
    { sku: 'OIL-015', qty:  1, buy: 3036, sell: 3500, ts: d(2026,  8, 26) },
    { sku: 'CHM-010', qty: 10, buy:  200, sell:  300, ts: d(2026,  8, 26) },
    { sku: 'BRK-004', qty:  2, buy:  900, sell: 1300, ts: d(2026,  8, 26) },
    { sku: 'ENG-003', qty:  5, buy:  160, sell:  400, ts: d(2026,  8, 26) },
    { sku: 'OIL-007', qty: 24, buy:  330, sell:  400, ts: d(2026,  8, 26) },
    { sku: 'OIL-011', qty:  6, buy:  668, sell:  800, ts: d(2026,  8, 26) },
    // ── 27/08/2026 ──────────────────────────────────────────────────────────
    { sku: 'OIL-016', qty:  2, buy: 2000, sell: 2800, ts: d(2026,  8, 27) },
    { sku: 'OIL-019', qty: 12, buy:  250, sell:  350, ts: d(2026,  8, 27) },
    { sku: 'OIL-020', qty: 20, buy:  200, sell:  300, ts: d(2026,  8, 27) },
    { sku: 'CHM-003', qty: 10, buy:  700, sell: 1000, ts: d(2026,  8, 27) },
    { sku: 'CHM-002', qty: 24, buy:  160, sell:  200, ts: d(2026,  8, 27) },
    { sku: 'BRK-005', qty: 10, buy:  250, sell:  300, ts: d(2026,  8, 27) },
    { sku: 'BRK-006', qty: 10, buy:  150, sell:  200, ts: d(2026,  8, 27) },
    { sku: 'SUS-019', qty:  5, buy:  550, sell: 1000, ts: d(2026,  8, 27) },
    { sku: 'SUS-020', qty:  5, buy:  650, sell: 1200, ts: d(2026,  8, 27) },
    { sku: 'SUS-003', qty:  5, buy:  200, sell:  300, ts: d(2026,  8, 27) },
    { sku: 'ENG-013', qty:  5, buy:  250, sell:  500, ts: d(2026,  8, 27) },
    { sku: 'ENG-014', qty:  5, buy:  500, sell:  800, ts: d(2026,  8, 27) },
    { sku: 'ENG-015', qty:  5, buy:  350, sell:  600, ts: d(2026,  8, 27) },
    { sku: 'ENG-016', qty:  5, buy:  350, sell:  600, ts: d(2026,  8, 27) },
    // ── 03/09/2026 ──────────────────────────────────────────────────────────
    { sku: 'ENG-010', qty: 10, buy: 1000, sell: 1500, ts: d(2026,  9,  3) },
    { sku: 'CHM-005', qty:  5, buy:  130, sell:  300, ts: d(2026,  9,  3) },
    { sku: 'SUS-012', qty:  3, buy:  500, sell: 1000, ts: d(2026,  9,  3) },
    { sku: 'SUS-013', qty:  3, buy:  500, sell: 1000, ts: d(2026,  9,  3) },
    { sku: 'SUS-014', qty:  3, buy:  500, sell: 1000, ts: d(2026,  9,  3) },
    { sku: 'SUS-015', qty:  3, buy:  350, sell:  700, ts: d(2026,  9,  3) },
    { sku: 'SUS-016', qty:  3, buy:  350, sell:  700, ts: d(2026,  9,  3) },
    { sku: 'SUS-017', qty:  3, buy:  350, sell:  700, ts: d(2026,  9,  3) },
    { sku: 'SUS-021', qty:  3, buy:  700, sell: 1400, ts: d(2026,  9,  3) },
    { sku: 'SUS-022', qty:  3, buy:  700, sell: 1400, ts: d(2026,  9,  3) },
    { sku: 'SUS-023', qty:  3, buy:  700, sell: 1400, ts: d(2026,  9,  3) },
    { sku: 'SUS-024', qty:  3, buy: 1200, sell: 2400, ts: d(2026,  9,  3) },
    { sku: 'ENG-017', qty: 10, buy:  200, sell:  400, ts: d(2026,  9,  3) },
    { sku: 'ENG-005', qty:  5, buy:  200, sell:  400, ts: d(2026,  9,  3) },
    { sku: 'ENG-018', qty: 20, buy:  250, sell:  500, ts: d(2026,  9,  3) },
    { sku: 'OIL-008', qty:  8, buy: 1900, sell: 2300, ts: d(2026,  9,  3) },
    // ── 04/09/2026 ──────────────────────────────────────────────────────────
    { sku: 'SUS-001', qty:  6, buy: 1800, sell: 2500, ts: d(2026,  9,  4) },
    { sku: 'SUS-002', qty:  6, buy: 2800, sell: 3500, ts: d(2026,  9,  4) },
    // ── 07/09/2026 ──────────────────────────────────────────────────────────
    { sku: 'SUS-004', qty:  3, buy: 1500, sell: 2500, ts: d(2026,  9,  7) },
    { sku: 'SUS-005', qty:  3, buy: 1500, sell: 2500, ts: d(2026,  9,  7) },
    { sku: 'SUS-006', qty:  1, buy: 1800, sell: 2700, ts: d(2026,  9,  7) },
    { sku: 'SUS-007', qty:  3, buy: 1500, sell: 2500, ts: d(2026,  9,  7) },
    { sku: 'SUS-008', qty:  4, buy: 1500, sell: 2500, ts: d(2026,  9,  7) },
    { sku: 'SUS-009', qty:  1, buy: 1800, sell: 2700, ts: d(2026,  9,  7) },
    { sku: 'SUS-010', qty:  3, buy: 1500, sell: 2500, ts: d(2026,  9,  7) },
    { sku: 'SUS-011', qty:  3, buy: 1500, sell: 2500, ts: d(2026,  9,  7) },
    { sku: 'SUS-018', qty:  2, buy:  500, sell: 1000, ts: d(2026,  9,  7) },
    // ── 08/09/2026 ──────────────────────────────────────────────────────────
    { sku: 'ELC-008', qty: 10, buy:   40, sell:  100, ts: d(2026,  9,  8) },
    { sku: 'ELC-001', qty: 20, buy:   40, sell:  100, ts: d(2026,  9,  8) },
    { sku: 'ELC-002', qty: 20, buy:   50, sell:  100, ts: d(2026,  9,  8) },
    { sku: 'CHM-013', qty:  8, buy:  150, sell:  300, ts: d(2026,  9,  8) },
    { sku: 'ELC-003', qty: 10, buy:  150, sell:  300, ts: d(2026,  9,  8) },
    { sku: 'ENG-009', qty:  2, buy: 1500, sell: 2500, ts: d(2026,  9,  8) },
    { sku: 'ENG-011', qty: 10, buy:  250, sell:  500, ts: d(2026,  9,  8) },
    { sku: 'ENG-012', qty: 10, buy:  250, sell:  500, ts: d(2026,  9,  8) },
    { sku: 'CHM-011', qty:  2, buy:  350, sell:  500, ts: d(2026,  9,  8) },
    { sku: 'ELC-006', qty: 24, buy:   79, sell:  150, ts: d(2026,  9,  8) },
    { sku: 'ELC-004', qty: 16, buy:  250, sell:  400, ts: d(2026,  9,  8) },
    { sku: 'CHM-012', qty:  7, buy:  300, sell:  500, ts: d(2026,  9,  8) },
    { sku: 'ELC-005', qty: 10, buy:  250, sell:  400, ts: d(2026,  9,  8) },
    { sku: 'ENG-019', qty:  4, buy: 1000, sell: 1500, ts: d(2026,  9,  8) },
    { sku: 'ENG-004', qty:  2, buy:  400, sell:  800, ts: d(2026,  9,  8) },
    { sku: 'ELC-007', qty:  6, buy:  100, sell:  200, ts: d(2026,  9,  8) },
  ]

  const products = await db.products.toArray()
  const skuMap = new Map(products.map(p => [p.sku, p.id]))

  // Running quantity per product (in chronological order)
  const runningQty = new Map<string, number>()

  // Use stable deterministic IDs so re-seeding updates in place (not delete + add)
  // Format: seed_<SKU>_<index> — never clashes with user entries (which have UUID ids)
  let entryIndex = 0
  const historyRows = entries
    .filter(e => skuMap.has(e.sku))
    .map(e => {
      const productId = skuMap.get(e.sku)!
      const qBefore = runningQty.get(productId) ?? 0
      const qAfter  = qBefore + e.qty
      runningQty.set(productId, qAfter)
      const changeType = (qBefore === 0 ? 'initial' : 'restock') as 'initial' | 'restock'
      return {
        id: `seed_${e.sku}_${entryIndex++}`,  // stable — same id every seed
        productId,
        changeType,
        quantityBefore: qBefore,
        quantityChange:  e.qty,
        quantityAfter:   qAfter,
        relatedSaleId: '',
        note: changeType === 'initial' ? 'Initial stock entry' : 'Restock',
        createdAt: e.ts,
        buyingPrice:  e.buy,
        sellingPrice: e.sell,
      }
    })

  // Delete only the stable-id seeded entries — never touches user-added restocks (UUID ids)
  const seedIds = historyRows.map(r => r.id)
  await db.stockHistory.bulkDelete(seedIds)
  await db.stockHistory.bulkAdd(historyRows)
}
