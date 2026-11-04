import { useRef, useState } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ReceiptTemplate } from '@/components/shared/ReceiptTemplate'
import { useSettings } from '@/hooks/useLocalSettings'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { useReactToPrint } from 'react-to-print'
import type { Sale } from '@/db/schema'
import { Printer, Trash2, FileDown } from 'lucide-react'
import { useDeleteSale } from '@/hooks/useSales'
import { exportHtmlAsPdf } from '@/lib/pdfExport'
import toast from 'react-hot-toast'

interface SaleDetailModalProps {
  open: boolean
  onClose: () => void
  sale: Sale | null
}

export function SaleDetailModal({ open, onClose, sale }: SaleDetailModalProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const { data: settings } = useSettings()
  const receiptRef = useRef<HTMLDivElement>(null)
  const handlePrint = useReactToPrint({ contentRef: receiptRef })
  const currency = settings?.currencySymbol ?? 'KES'
  const deleteMutation = useDeleteSale()

  if (!sale) return null

  async function handleDownloadReceipt() {
    if (!sale) return
    const cur = currency
    const rows = sale.items.map(item => `
      <tr>
        <td style="padding:3px 0;word-break:break-word;max-width:120px">${item.productName}</td>
        <td style="text-align:right;padding:3px 4px;white-space:nowrap">${item.quantity}</td>
        <td style="text-align:right;padding:3px 4px;white-space:nowrap">${formatCurrency(item.sellingPriceSnapshot, cur)}</td>
        <td style="text-align:right;padding:3px 0;white-space:nowrap">${formatCurrency(item.lineTotal, cur)}</td>
      </tr>`).join('')

    const html = `
      <div style="font-family:'Courier New',Courier,monospace;font-size:12px;color:#000;width:300px;margin:0 auto;padding:20px 12px">
        <div style="text-align:center;margin-bottom:12px;line-height:1.6">
          <div style="font-size:17px;font-weight:900;letter-spacing:1px;text-transform:uppercase">${settings?.shopName ?? 'Blessed Auto Spares'}</div>
          <div style="font-size:11px">Auto Parts &amp; Accessories</div>
          ${settings?.shopPhone ? `<div style="font-size:11px">${settings.shopPhone}</div>` : ''}
          ${settings?.shopAddress ? `<div style="font-size:11px">${settings.shopAddress}</div>` : ''}
        </div>
        <div style="border-top:1px dashed #000;margin:8px 0"></div>
        <div style="line-height:1.7;font-size:11px;margin-bottom:8px">
          <div><b>Receipt#:</b> ${sale.receiptNumber}</div>
          <div><b>Date:</b> ${formatDateTime(sale.soldAt)}</div>
          ${sale.customerName ? `<div><b>Customer:</b> ${sale.customerName}</div>` : ''}
          <div><b>Cashier:</b> ${sale.createdBy || settings?.operatorName || 'Staff'}</div>
          <div><b>Payment:</b> ${sale.paymentMethod.toUpperCase()}</div>
        </div>
        <div style="border-top:1px dashed #000;margin:8px 0"></div>
        <table style="width:100%;border-collapse:collapse;font-size:11px">
          <thead>
            <tr style="border-bottom:1px dashed #000">
              <th style="text-align:left;padding:3px 0;font-weight:700">Item</th>
              <th style="text-align:right;padding:3px 4px;font-weight:700">Qty</th>
              <th style="text-align:right;padding:3px 4px;font-weight:700">Price</th>
              <th style="text-align:right;padding:3px 0;font-weight:700">Total</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div style="border-top:1px dashed #000;margin:8px 0"></div>
        <div style="display:flex;justify-content:space-between;font-weight:900;font-size:14px;margin-bottom:4px">
          <span>TOTAL</span><span>${formatCurrency(sale.subtotal, cur)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:11px">
          <span>Tendered (${sale.paymentMethod.toUpperCase()})</span><span>${formatCurrency(sale.amountTendered, cur)}</span>
        </div>
        ${sale.changeGiven > 0 ? `<div style="display:flex;justify-content:space-between;font-size:11px"><span>Change</span><span>${formatCurrency(sale.changeGiven, cur)}</span></div>` : ''}
        <div style="border-top:1px dashed #000;margin:8px 0"></div>
        <div style="text-align:center;font-size:11px;line-height:1.7">
          <div>${settings?.receiptFooter ?? 'Thank you for your business!'}</div>
          <div style="font-size:10px;color:#555;margin-top:2px">Goods once sold are not returnable</div>
        </div>
      </div>`

    await exportHtmlAsPdf(html, `Receipt-${sale.receiptNumber}.pdf`)
  }

  async function handleDelete() {
    try {
      await deleteMutation.mutateAsync(sale!)
      toast.success('Sale deleted. Stock has been restored.')
      setConfirmDelete(false)
      onClose()
    } catch {
      toast.error('Failed to delete sale. Please try again.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { setConfirmDelete(false); onClose() } }}>
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
              </tr>
            </thead>
            <tbody>
              {sale.items.map((item, i) => (
                <tr key={i} className="border-b border-slate-100 dark:border-slate-800">
                  <td className="py-1.5 font-medium text-slate-800 dark:text-slate-200">{item.productName}</td>
                  <td className="text-right py-1.5 text-slate-600 dark:text-slate-400">{item.quantity}</td>
                  <td className="text-right py-1.5 text-slate-600 dark:text-slate-400">{formatCurrency(item.sellingPriceSnapshot, currency)}</td>
                  <td className="text-right py-1.5 font-medium text-slate-800 dark:text-slate-200">{formatCurrency(item.lineTotal, currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 space-y-1">
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>{formatCurrency(sale.subtotal, currency)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Tendered ({sale.paymentMethod.toUpperCase()})</span>
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

        {/* ── DELETE CONFIRMATION ── */}
        {confirmDelete && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mt-1">
            <p className="text-[13px] font-semibold text-red-700 mb-0.5">Delete this sale?</p>
            <p className="text-[11px] text-red-500 mb-3">
              This will permanently remove sale #{sale.receiptNumber} and restore stock for all items.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="flex-1 h-9 rounded-lg border border-slate-200 text-[12px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="flex-1 h-9 rounded-lg bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white text-[12px] font-bold transition-colors"
              >
                {deleteMutation.isPending ? 'Deleting…' : 'Yes, Delete Sale'}
              </button>
            </div>
          </div>
        )}

        <DialogFooter>
          <div className="flex w-full items-center justify-between gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirmDelete(true)}
              className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" /> Delete Sale
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleDownloadReceipt}>
                <FileDown className="h-4 w-4" /> Download PDF
              </Button>
              <Button variant="outline" onClick={() => handlePrint()}>
                <Printer className="h-4 w-4" /> Print
              </Button>
              <Button onClick={onClose}>Close</Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
