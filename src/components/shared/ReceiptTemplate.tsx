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
        style={{
          fontFamily: "'Courier New', Courier, monospace",
          fontSize: '12px',
          color: '#000',
          background: '#fff',
          width: '80mm',
          margin: '0 auto',
          padding: '12px 8px',
        }}
      >
        {/* Shop Header */}
        <div style={{ textAlign: 'center', marginBottom: '10px', lineHeight: '1.5' }}>
          <div style={{ fontSize: '16px', fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase' }}>
            {settings.shopName ?? 'Blessed Auto Spares'}
          </div>
          <div style={{ fontSize: '11px' }}>Auto Parts &amp; Accessories</div>
          {settings.shopPhone && <div style={{ fontSize: '11px' }}>{settings.shopPhone}</div>}
          {settings.shopAddress && <div style={{ fontSize: '11px' }}>{settings.shopAddress}</div>}
        </div>

        <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }} />

        {/* Receipt Meta */}
        <div style={{ marginBottom: '8px', lineHeight: '1.6', fontSize: '11px' }}>
          <div><strong>Receipt#:</strong> {sale.receiptNumber}</div>
          <div><strong>Date:</strong> {formatDateTime(sale.soldAt)}</div>
          {sale.customerName && <div><strong>Customer:</strong> {sale.customerName}</div>}
          <div><strong>Cashier:</strong> {sale.createdBy || settings.operatorName || 'Staff'}</div>
          <div><strong>Payment:</strong> {sale.paymentMethod.toUpperCase()}</div>
        </div>

        <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }} />

        {/* Items Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
          <thead>
            <tr style={{ borderBottom: '1px dashed #000' }}>
              <th style={{ textAlign: 'left', padding: '2px 0', fontWeight: 700 }}>Item</th>
              <th style={{ textAlign: 'right', padding: '2px 3px', fontWeight: 700 }}>Qty</th>
              <th style={{ textAlign: 'right', padding: '2px 3px', fontWeight: 700 }}>Price</th>
              <th style={{ textAlign: 'right', padding: '2px 0', fontWeight: 700 }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {sale.items.map((item, i) => (
              <tr key={i}>
                <td style={{ padding: '3px 0', wordBreak: 'break-word', maxWidth: '110px' }}>
                  {item.productName}
                </td>
                <td style={{ textAlign: 'right', padding: '3px 3px' }}>{item.quantity}</td>
                <td style={{ textAlign: 'right', padding: '3px 3px', whiteSpace: 'nowrap' }}>
                  {formatCurrency(item.sellingPriceSnapshot, currency)}
                </td>
                <td style={{ textAlign: 'right', padding: '3px 0', whiteSpace: 'nowrap' }}>
                  {formatCurrency(item.lineTotal, currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }} />

        {/* Totals */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: '13px', marginBottom: '4px' }}>
          <span>TOTAL</span>
          <span>{formatCurrency(sale.subtotal, currency)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
          <span>Tendered ({sale.paymentMethod.toUpperCase()})</span>
          <span>{formatCurrency(sale.amountTendered, currency)}</span>
        </div>
        {sale.changeGiven > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
            <span>Change</span>
            <span>{formatCurrency(sale.changeGiven, currency)}</span>
          </div>
        )}

        <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }} />

        {/* Footer */}
        <div style={{ textAlign: 'center', fontSize: '11px', lineHeight: '1.6' }}>
          <div>{settings.receiptFooter ?? 'Thank you for your business!'}</div>
          <div style={{ fontSize: '10px', marginTop: '2px', color: '#444' }}>
            Goods once sold are not returnable
          </div>
        </div>
      </div>
    )
  }
)
ReceiptTemplate.displayName = 'ReceiptTemplate'
