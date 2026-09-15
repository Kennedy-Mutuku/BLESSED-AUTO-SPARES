import { useState } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRestockProduct } from '@/hooks/useProducts'
import { useSettings } from '@/hooks/useLocalSettings'
import type { Product } from '@/db/schema'
import toast from 'react-hot-toast'

interface RestockModalProps {
  open: boolean
  onClose: () => void
  product: Product | null
}

export function RestockModal({ open, onClose, product }: RestockModalProps) {
  const [qty, setQty] = useState(10)
  const [newBuyingPrice, setNewBuyingPrice] = useState<number | ''>('')
  const [note, setNote] = useState('')
  const restock = useRestockProduct()
  const { data: settings } = useSettings()
  const currency = settings?.currencySymbol ?? 'KES'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!product) return
    if (qty <= 0) return toast.error('Quantity must be greater than 0')
    try {
      await restock.mutateAsync({
        productId: product.id,
        addQty: qty,
        newBuyingPrice: newBuyingPrice !== '' ? Number(newBuyingPrice) : undefined,
        note,
      })
      toast.success(`Restocked ${qty} ${product.unit} of ${product.name}`)
      onClose()
      setQty(10)
      setNewBuyingPrice('')
      setNote('')
    } catch {
      toast.error('Restock failed')
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Restock: {product?.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-sm text-slate-500">
            Current stock: <strong className="text-slate-900 dark:text-slate-100">{product?.stockQuantity} {product?.unit}</strong>
          </div>
          <div className="space-y-1">
            <Label>Quantity to Add *</Label>
            <Input type="number" min={1} value={qty} onChange={(e) => setQty(Number(e.target.value))} required />
          </div>
          <div className="space-y-1">
            <Label>Update Buying Price ({currency}) — optional</Label>
            <Input
              type="number"
              min={0}
              placeholder={`Current: ${currency} ${product?.buyingPrice}`}
              value={newBuyingPrice}
              onChange={(e) => setNewBuyingPrice(e.target.value === '' ? '' : Number(e.target.value))}
            />
          </div>
          <div className="space-y-1">
            <Label>Note</Label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Supplier delivery" />
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="success" disabled={restock.isPending}>
              Restock
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
