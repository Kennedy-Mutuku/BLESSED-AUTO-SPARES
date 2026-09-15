import { useRef } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ReceiptTemplate } from '@/components/shared/ReceiptTemplate'
import { useSettings } from '@/hooks/useLocalSettings'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { useReactToPrint } from 'react-to-print'
import type { Sale } from '@/db/schema'
import { Printer } from 'lucide-react'

interface SaleDetailModalProps {
  open: boolean
  onClose: () => void
  sale: Sale | null
}

export function SaleDetailModal({ open, onClose, sale }: SaleDetailModalProps) {
  const { data: settings } = useSettings()
  const receiptRef = useRef<HTMLDivElement>(null)
  const handlePrint = useReactToPrint({ contentRef: receiptRef })
  const currency = settings?.currencySymbol ?? 'KES'

  if (!sale) return null

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Sale #{sale.receiptNumber}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-400">
            <div><span className="font-medium">Date:</span> {formatDateTime(sale.soldAt)}</div>
            <div><span className="font-medium">Payment:</span> {sale.paymentMethod.toUpperCase()}</div>
            {sale.customerName && <div className="col-span-2"><span className="font-medium">Customer:</span> {sale.customerName}</div>}
          </div>

          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="text-left pb-1 text-slate-500">Item</th>
                <th className="text-right pb-1 text-slate-500">Qty</th>
                <th className="text-right pb-1 text-slate-500">Price</th>
                <th className="text-right pb-1 text-slate-500">Total</th>
                <th className="text-right pb-1 text-slate-500">Profit</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((item, i) => (
                <tr key={i} className="border-b border-slate-100 dark:border-slate-800">
                  <td className="py-1.5 font-medium text-slate-800 dark:text-slate-200">{item.productName}</td>
                  <td className="text-right py-1.5 text-slate-600 dark:text-slate-400">{item.quantity}</td>
                  <td className="text-right py-1.5 text-slate-600 dark:text-slate-400">{formatCurrency(item.sellingPriceSnapshot, currency)}</td>
                  <td className="text-right py-1.5 font-medium text-slate-800 dark:text-slate-200">{formatCurrency(item.lineTotal, currency)}</td>
                  <td className="text-right py-1.5 text-green-600">{formatCurrency(item.lineProfit, currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 space-y-1">
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>{formatCurrency(sale.subtotal, currency)}</span>
            </div>
            <div className="flex justify-between text-green-600">
              <span>Total Profit</span>
              <span>{formatCurrency(sale.totalProfit, currency)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Tendered</span>
              <span>{formatCurrency(sale.amountTendered, currency)}</span>
            </div>
            {sale.changeGiven > 0 && (
              <div className="flex justify-between text-slate-500">
                <span>Change</span>
                <span>{formatCurrency(sale.changeGiven, currency)}</span>
              </div>
            )}
          </div>

          {sale.notes && (
            <div className="text-slate-500 text-xs">Notes: {sale.notes}</div>
          )}
        </div>

        <div className="hidden">
          <ReceiptTemplate ref={receiptRef} sale={sale} settings={settings ?? {}} />
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => handlePrint()}>
            <Printer className="h-4 w-4" /> Reprint Receipt
          </Button>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
