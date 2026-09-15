import { useState, useRef, useEffect } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCompleteSale } from '@/hooks/useSales'
import { useSettings } from '@/hooks/useLocalSettings'
import { useCartStore } from '@/store/cartStore'
import { cartTotal } from '@/lib/calculations'
import { formatCurrency } from '@/lib/utils'
import { ReceiptTemplate } from '@/components/shared/ReceiptTemplate'
import { useReactToPrint } from 'react-to-print'
import type { Sale } from '@/db/schema'
import toast from 'react-hot-toast'
import { CheckCircle, Printer, ChevronDown, ChevronUp } from 'lucide-react'

interface CheckoutModalProps {
  open: boolean
  onClose: () => void
}

// Round up to the nearest step (100, 500, 1000)
function quickAmounts(total: number): number[] {
  const seen = new Set<number>()
  const results: number[] = [total] // Exact always first
  seen.add(total)
  for (const step of [100, 500, 1000]) {
    const rounded = Math.ceil(total / step) * step
    if (!seen.has(rounded)) { results.push(rounded); seen.add(rounded) }
    if (results.length >= 4) break
  }
  return results
}

const PAYMENT_BUTTONS: { value: Sale['paymentMethod']; label: string; color: string }[] = [
  { value: 'cash',   label: '💵  Cash',   color: 'bg-emerald-600 hover:bg-emerald-700' },
  { value: 'mpesa',  label: '📱  M-Pesa', color: 'bg-green-600 hover:bg-green-700' },
  { value: 'card',   label: '💳  Card',   color: 'bg-blue-600 hover:bg-blue-700' },
  { value: 'credit', label: '📋  Credit', color: 'bg-amber-600 hover:bg-amber-700' },
]

export function CheckoutModal({ open, onClose }: CheckoutModalProps) {
  const { items, clearCart } = useCartStore()
  const [step, setStep] = useState<'pay' | 'cash' | 'done'>('pay')
  const [customAmount, setCustomAmount] = useState('')
  const [changeGiven, setChangeGiven] = useState(0)
  const [completedSale, setCompletedSale] = useState<Sale | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [notes, setNotes] = useState('')
  const [processing, setProcessing] = useState(false)

  const completeSale = useCompleteSale()
  const { data: settings } = useSettings()
  const receiptRef = useRef<HTMLDivElement>(null)
  const customInputRef = useRef<HTMLInputElement>(null)

  const { subtotal, profit } = cartTotal(items)
  const currency = settings?.currencySymbol ?? 'KES'
  const presets = quickAmounts(subtotal)

  const tendered = Number(customAmount) || 0
  const computedChange = Math.max(0, tendered - subtotal)

  const handlePrint = useReactToPrint({ contentRef: receiptRef })

  // Reset when modal opens
  useEffect(() => {
    if (open) {
      setStep('pay')
      setCustomAmount('')
      setChangeGiven(0)
      setCompletedSale(null)
      setShowDetails(false)
      setCustomerName('')
      setNotes('')
    }
  }, [open])

  // Focus custom input when cash step opens
  useEffect(() => {
    if (step === 'cash') setTimeout(() => customInputRef.current?.focus(), 80)
  }, [step])

  async function confirm(method: Sale['paymentMethod'], tendered: number) {
    if (processing) return
    setProcessing(true)
    try {
      const sale = await completeSale.mutateAsync({
        cartItems: items,
        paymentMethod: method,
        amountTendered: tendered,
        customerName,
        notes,
        createdBy: settings?.operatorName ?? 'Staff',
      })
      clearCart()
      setChangeGiven(sale.changeGiven)
      setCompletedSale(sale)
      setStep('done')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Sale failed')
    } finally {
      setProcessing(false)
    }
  }

  function handleNonCash(method: Sale['paymentMethod']) {
    confirm(method, subtotal)
  }

  function handleCashPreset(amount: number) {
    confirm('cash', amount)
  }

  function handleCashCustom(e: React.FormEvent) {
    e.preventDefault()
    if (tendered < subtotal) {
      toast.error(`Amount must be at least ${formatCurrency(subtotal, currency)}`)
      return
    }
    confirm('cash', tendered)
  }

  function handleClose() {
    setCompletedSale(null)
    setStep('pay')
    onClose()
  }

  // ── DONE screen ──
  if (step === 'done' && completedSale) {
    return (
      <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
        <DialogContent className="text-center">
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle className="w-9 h-9 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {formatCurrency(completedSale.subtotal, currency)}
              </div>
              <div className="text-sm text-slate-500 mt-0.5">
                {completedSale.paymentMethod.toUpperCase()} · #{completedSale.receiptNumber}
              </div>
            </div>
            {changeGiven > 0 && (
              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl px-6 py-3 w-full">
                <div className="text-xs text-emerald-600 font-medium uppercase tracking-wide">Give back change</div>
                <div className="text-3xl font-bold text-emerald-600 mt-0.5">
                  {formatCurrency(changeGiven, currency)}
                </div>
              </div>
            )}
          </div>
          <div className="hidden">
            <ReceiptTemplate ref={receiptRef} sale={completedSale} settings={settings ?? {}} />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => handlePrint()}>
              <Printer className="h-4 w-4" /> Receipt
            </Button>
            <Button className="flex-1" onClick={handleClose}>
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // ── CASH sub-screen ──
  if (step === 'cash') {
    return (
      <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
        <DialogContent>
          {/* Total */}
          <div className="text-center pb-1">
            <div className="text-xs text-slate-500 uppercase tracking-wide">Total to pay</div>
            <div className="text-3xl font-bold text-slate-900 dark:text-white">
              {formatCurrency(subtotal, currency)}
            </div>
          </div>

          {/* Quick preset amounts */}
          <div className="space-y-2">
            <div className="text-xs text-slate-500 font-medium">Quick amounts — tap to confirm instantly</div>
            <div className="grid grid-cols-2 gap-2">
              {presets.map((amt) => (
                <button
                  key={amt}
                  disabled={processing}
                  onClick={() => handleCashPreset(amt)}
                  className={`h-14 rounded-xl font-bold text-white text-base transition-opacity disabled:opacity-50 ${
                    amt === subtotal
                      ? 'bg-emerald-600 hover:bg-emerald-700 col-span-2'
                      : 'bg-slate-700 hover:bg-slate-600'
                  }`}
                >
                  {amt === subtotal ? `✓  Exact — ${formatCurrency(amt, currency)}` : formatCurrency(amt, currency)}
                  {amt > subtotal && (
                    <span className="block text-xs font-normal opacity-75">
                      Change: {formatCurrency(amt - subtotal, currency)}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Custom amount */}
          <form onSubmit={handleCashCustom} className="space-y-2">
            <div className="text-xs text-slate-500 font-medium">Or type the exact amount given</div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">{currency}</span>
                <Input
                  ref={customInputRef}
                  type="number"
                  inputMode="numeric"
                  min={subtotal}
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder={String(subtotal)}
                  className="pl-14 h-12 text-base"
                />
              </div>
              <Button
                type="submit"
                variant="success"
                size="lg"
                disabled={processing || tendered < subtotal}
                className="shrink-0 px-5"
              >
                {processing ? '…' : 'Confirm'}
              </Button>
            </div>
            {tendered >= subtotal && tendered > 0 && (
              <div className="text-sm font-semibold text-emerald-600 text-right">
                Change: {formatCurrency(computedChange, currency)}
              </div>
            )}
          </form>

          {/* Optional details (collapsed) */}
          <button
            type="button"
            onClick={() => setShowDetails((v) => !v)}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600"
          >
            {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            Add customer name / note
          </button>
          {showDetails && (
            <div className="space-y-2">
              <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Customer name (optional)" className="h-10" />
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Note (optional)" className="h-10" />
            </div>
          )}

          <Button variant="outline" onClick={() => setStep('pay')}>← Back</Button>
        </DialogContent>
      </Dialog>
    )
  }

  // ── MAIN PAY screen ──
  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent>
        {/* Total */}
        <div className="text-center pb-2">
          <div className="text-xs text-slate-500 uppercase tracking-wide">
            {items.length} item{items.length !== 1 ? 's' : ''} · profit {formatCurrency(profit, currency)}
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white mt-0.5">
            {formatCurrency(subtotal, currency)}
          </div>
        </div>

        {/* Payment method buttons */}
        <div className="space-y-1.5">
          <div className="text-sm font-semibold text-slate-600 dark:text-slate-400">How is the customer paying?</div>
          <div className="grid grid-cols-2 gap-2.5">
            {PAYMENT_BUTTONS.map(({ value, label, color }) => (
              <button
                key={value}
                disabled={processing}
                onClick={() => value === 'cash' ? setStep('cash') : handleNonCash(value)}
                className={`h-16 rounded-xl text-white font-semibold text-base ${color} transition-opacity disabled:opacity-50 flex flex-col items-center justify-center`}
              >
                <span>{label}</span>
                {value !== 'cash' && (
                  <span className="text-xs opacity-75 font-normal mt-0.5">Tap to confirm</span>
                )}
                {value === 'cash' && (
                  <span className="text-xs opacity-75 font-normal mt-0.5">Enter amount →</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Optional details (collapsed) */}
        <button
          type="button"
          onClick={() => setShowDetails((v) => !v)}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600"
        >
          {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          Add customer name / note
        </button>
        {showDetails && (
          <div className="space-y-2">
            <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Customer name (optional)" className="h-10" />
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Note (optional)" className="h-10" />
          </div>
        )}

        <Button variant="outline" onClick={handleClose}>Cancel</Button>
      </DialogContent>
    </Dialog>
  )
}
