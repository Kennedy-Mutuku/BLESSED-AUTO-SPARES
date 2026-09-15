import React from 'react'
import type { Sale } from '@/db/schema'
import { formatDateTime, formatCurrency } from '@/lib/utils'

interface ReceiptTemplateProps {
  sale: Sale
  settings: Record<string, string>
}

export const ReceiptTemplate = React.forwardRef<HTMLDivElement, ReceiptTemplateProps>(
  ({ sale, settings }, ref) => {
    const currency = settings.currencySymbol ?? 'KES'
    return (
      <div
        ref={ref}
        className="bg-white text-black font-mono text-xs w-72 mx-auto p-4"
        style={{ fontFamily: 'monospace', fontSize: '12px', width: '72mm', padding: '8px' }}
      >
        <div className="text-center mb-3">
          <div className="font-bold text-base">{settings.shopName ?? 'Blessed Auto Spares'}</div>
          {settings.shopPhone && <div>{settings.shopPhone}</div>}
          {settings.shopAddress && <div>{settings.shopAddress}</div>}
        </div>

        <div className="border-t border-dashed border-black my-2" />

        <div className="mb-2">
          <div>Receipt: {sale.receiptNumber}</div>
          <div>Date: {formatDateTime(sale.soldAt)}</div>
          {sale.customerName && <div>Customer: {sale.customerName}</div>}
          <div>Cashier: {sale.createdBy || settings.operatorName}</div>
        </div>

        <div className="border-t border-dashed border-black my-2" />

        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="text-left">Item</th>
              <th className="text-right">Qty</th>
              <th className="text-right">Price</th>
              <th className="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {sale.items.map((item, i) => (
              <tr key={i}>
                <td className="text-left" style={{ maxWidth: '100px', wordBreak: 'break-word' }}>
                  {item.productName}
                </td>
                <td className="text-right">{item.quantity}</td>
                <td className="text-right">{item.sellingPriceSnapshot}</td>
                <td className="text-right">{item.lineTotal}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="border-t border-dashed border-black my-2" />

        <div className="flex justify-between font-bold">
          <span>TOTAL</span>
          <span>{formatCurrency(sale.subtotal, currency)}</span>
        </div>
        <div className="flex justify-between">
          <span>Payment ({sale.paymentMethod.toUpperCase()})</span>
          <span>{formatCurrency(sale.amountTendered, currency)}</span>
        </div>
        {sale.changeGiven > 0 && (
          <div className="flex justify-between">
            <span>Change</span>
            <span>{formatCurrency(sale.changeGiven, currency)}</span>
          </div>
        )}

        <div className="border-t border-dashed border-black my-2" />

        <div className="text-center text-xs">
          {settings.receiptFooter ?? 'Thank you for your business!'}
        </div>
      </div>
    )
  }
)
ReceiptTemplate.displayName = 'ReceiptTemplate'
