import type { Sale } from '../db/schema'
import { formatDateTime } from './utils'

export function salesToCSV(sales: Sale[], currencySymbol = 'KES'): string {
  const header = [
    'Receipt #',
    'Date',
    'Customer',
    'Items',
    'Subtotal',
    'Profit',
    'Payment Method',
    'Amount Tendered',
    'Change Given',
  ].join(',')

  const rows = sales.map((s) =>
    [
      s.receiptNumber,
      formatDateTime(s.soldAt),
      `"${s.customerName || ''}"`,
      s.items.length,
      `${currencySymbol} ${s.subtotal}`,
      `${currencySymbol} ${s.totalProfit}`,
      s.paymentMethod,
      `${currencySymbol} ${s.amountTendered}`,
      `${currencySymbol} ${s.changeGiven}`,
    ].join(',')
  )

  return [header, ...rows].join('\n')
}

export function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function downloadJSON(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
