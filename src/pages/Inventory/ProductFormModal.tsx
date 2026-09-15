import { useState, useEffect, useRef } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAddProduct, useUpdateProduct } from '@/hooks/useProducts'
import { useCategories } from '@/hooks/useCategories'
import { useSettings } from '@/hooks/useLocalSettings'
import { formatCurrency } from '@/lib/utils'
import { profitMargin } from '@/lib/calculations'
import type { Product } from '@/db/schema'
import toast from 'react-hot-toast'
import { Camera, ImagePlus, X, TrendingUp } from 'lucide-react'

interface ProductFormModalProps {
  open: boolean
  onClose: () => void
  product?: Product | null
}

const BLANK: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> = {
  name: '',
  sku: '',
  categoryId: '',
  buyingPrice: 0,
  sellingPrice: 0,
  stockQuantity: 0,
  reorderLevel: 5,
  unit: 'pcs',
  description: '',
  imageDataUrl: '',
  isActive: true,
}

const UNITS = ['pcs (pieces)', 'sets', 'litres', 'kg', 'metres', 'boxes', 'pairs']

export function ProductFormModal({ open, onClose, product }: ProductFormModalProps) {
  const [form, setForm] = useState(BLANK)
  const galleryRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)

  const addProduct = useAddProduct()
  const updateProduct = useUpdateProduct()
  const { data: categories } = useCategories()
  const { data: settings } = useSettings()
  const currency = settings?.currencySymbol ?? 'KES'

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name,
        sku: product.sku,
        categoryId: product.categoryId,
        buyingPrice: product.buyingPrice,
        sellingPrice: product.sellingPrice,
        stockQuantity: product.stockQuantity,
        reorderLevel: product.reorderLevel,
        unit: product.unit,
        description: product.description,
        imageDataUrl: product.imageDataUrl ?? '',
        isActive: product.isActive,
      })
    } else {
      setForm({ ...BLANK, reorderLevel: Number(settings?.defaultReorderLevel ?? 5) })
    }
  }, [product, open, settings?.defaultReorderLevel])

  const margin = profitMargin(form.buyingPrice, form.sellingPrice)
  const profitPerItem = form.sellingPrice - form.buyingPrice
  const totalProfit = profitPerItem * form.stockQuantity

  function handleImageFile(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Photo too large. Please use a smaller image.')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => set('imageDataUrl', e.target?.result as string)
    reader.readAsDataURL(file)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return toast.error('Item name is required')
    if (!form.unit.trim()) return toast.error('Unit is required (e.g. pcs, sets)')
    if (!form.stockQuantity || form.stockQuantity < 1) return toast.error('Please enter how many items you currently have in stock')
    if (!form.buyingPrice || form.buyingPrice <= 0) return toast.error('Buying price is required')
    if (!form.sellingPrice || form.sellingPrice <= 0) return toast.error('Selling price is required')
    if (form.sellingPrice < form.buyingPrice) {
      toast.error('Selling price should be higher than buying price')
      return
    }
    if (form.reorderLevel < 0) return toast.error('Reorder level cannot be negative')
    try {
      if (product) {
        await updateProduct.mutateAsync({ id: product.id, ...form })
        toast.success('Item updated!')
      } else {
        await addProduct.mutateAsync(form)
        toast.success('Item added to stock!')
      }
      onClose()
    } catch {
      toast.error('Could not save. Please try again.')
    }
  }

  const set = (field: string, value: unknown) => setForm((f) => ({ ...f, [field]: value }))

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto w-full">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {product ? 'Edit Item' : 'Add New Item'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* ── 1. ITEM NAME ── */}
          <div className="space-y-1.5">
            <Label className="text-base font-semibold text-slate-800 dark:text-slate-200">
              Item Name <span className="text-red-500">*</span>
            </Label>
            <p className="text-xs text-slate-500">What is this spare part called?</p>
            <Input
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="e.g. Brake Pads, Engine Oil Filter…"
              className="h-12 text-base"
              required
            />
          </div>

          {/* ── 2. DESCRIPTION ── */}
          <div className="space-y-1.5">
            <Label className="text-base font-semibold text-slate-800 dark:text-slate-200">
              Description <span className="text-slate-400 font-normal text-sm">(optional)</span>
            </Label>
            <p className="text-xs text-slate-500">Any extra details — brand, size, vehicle model it fits, etc.</p>
            <Input
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="e.g. Fits Toyota Fielder 2008–2014, front axle only"
              className="h-11"
            />
          </div>

          {/* ── 3. PHOTO ── */}
          <div className="space-y-1.5">
            <Label className="text-base font-semibold text-slate-800 dark:text-slate-200">
              Photo <span className="text-slate-400 font-normal text-sm">(optional)</span>
            </Label>
            <p className="text-xs text-slate-500">A photo helps you and your staff identify the item quickly.</p>

            {/* Hidden file inputs */}
            <input
              ref={galleryRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => { if (e.target.files?.[0]) handleImageFile(e.target.files[0]) }}
            />
            <input
              ref={cameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => { if (e.target.files?.[0]) handleImageFile(e.target.files[0]) }}
            />

            {form.imageDataUrl ? (
              /* Compact image preview */
              <div className="flex items-center gap-3">
                <img
                  src={form.imageDataUrl}
                  alt="Item photo"
                  className="w-16 h-16 rounded-lg object-cover border border-slate-200 dark:border-slate-600 shrink-0"
                />
                <div className="flex flex-col gap-1.5 flex-1">
                  <button
                    type="button"
                    onClick={() => galleryRef.current?.click()}
                    className="flex items-center gap-2 h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-sm text-slate-600 dark:text-slate-400 transition-colors"
                  >
                    <ImagePlus className="w-4 h-4" /> Change photo
                  </button>
                  <button
                    type="button"
                    onClick={() => set('imageDataUrl', '')}
                    className="flex items-center gap-2 h-9 px-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-sm text-red-600 dark:text-red-400 transition-colors"
                  >
                    <X className="w-4 h-4" /> Remove photo
                  </button>
                </div>
              </div>
            ) : (
              /* Compact upload buttons */
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => galleryRef.current?.click()}
                  className="flex items-center gap-2 h-10 px-4 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-sm font-medium text-slate-600 dark:text-slate-400 transition-colors"
                >
                  <ImagePlus className="w-4 h-4" /> Gallery
                </button>
                <button
                  type="button"
                  onClick={() => cameraRef.current?.click()}
                  className="flex items-center gap-2 h-10 px-4 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-sm font-medium text-slate-600 dark:text-slate-400 transition-colors"
                >
                  <Camera className="w-4 h-4" /> Camera
                </button>
              </div>
            )}
          </div>

          {/* ── 4. QUANTITY + UNIT ── */}
          <div className="space-y-1.5">
            <Label className="text-base font-semibold text-slate-800 dark:text-slate-200">
              How many do you have right now? <span className="text-red-500">*</span>
            </Label>
            <p className="text-xs text-slate-500">Count the items in your store today and enter that number.</p>
            <div className="flex gap-2">
              <Input
                type="number"
                min={0}
                value={form.stockQuantity}
                onChange={(e) => set('stockQuantity', Number(e.target.value))}
                className="h-12 text-lg font-semibold w-28 text-center"
              />
              <Select
                value={UNITS.includes(form.unit) ? form.unit : 'pcs (pieces)'}
                onValueChange={(v) => set('unit', v.split(' ')[0])}
              >
                <SelectTrigger className="flex-1 h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map((u) => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
              You currently have: <strong>{form.stockQuantity} {form.unit}</strong>
            </p>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-700" />

          {/* ── 5. PRICES ── */}
          <div className="space-y-4">
            <p className="text-base font-semibold text-slate-800 dark:text-slate-200">Prices</p>

            {/* Buying Price */}
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Buying Price ({currency}) <span className="text-red-500">*</span> — <span className="font-normal text-slate-500">What YOU paid for it</span>
              </Label>
              <p className="text-xs text-slate-500">
                The price you bought this item from the supplier (your cost).
              </p>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">{currency}</span>
                <Input
                  type="number"
                  min={0}
                  value={form.buyingPrice || ''}
                  onChange={(e) => set('buyingPrice', Number(e.target.value))}
                  placeholder="0"
                  className="pl-14 h-12 text-base"
                />
              </div>
            </div>

            {/* Selling Price */}
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Selling Price ({currency}) <span className="text-red-500">*</span> — <span className="font-normal text-slate-500">What CUSTOMERS pay</span>
              </Label>
              <p className="text-xs text-slate-500">
                The price you charge the customer when they buy this item.
              </p>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">{currency}</span>
                <Input
                  type="number"
                  min={0}
                  value={form.sellingPrice || ''}
                  onChange={(e) => set('sellingPrice', Number(e.target.value))}
                  placeholder="0"
                  className="pl-14 h-12 text-base"
                />
              </div>
            </div>

            {/* Profit summary */}
            {form.buyingPrice > 0 && form.sellingPrice > 0 && (
              <div className={`rounded-xl p-4 border-2 ${profitPerItem >= 0 ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Your Profit Summary</span>
                </div>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Profit per item you sell:</span>
                    <span className={`font-bold ${profitPerItem >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {formatCurrency(profitPerItem, currency)}
                      {form.sellingPrice > 0 && <span className="text-xs ml-1">({margin.toFixed(0)}%)</span>}
                    </span>
                  </div>
                  {form.stockQuantity > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">If you sell ALL {form.stockQuantity} {form.unit}:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {formatCurrency(totalProfit, currency)} profit
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 dark:border-slate-700" />

          {/* ── 6. LOW STOCK WARNING ── */}
          <div className="space-y-1.5">
            <Label className="text-base font-semibold text-slate-800 dark:text-slate-200">
              Warn me when stock gets low <span className="text-red-500">*</span>
            </Label>
            <p className="text-xs text-slate-500">
              You will receive an alert when you have this many items left — so you know it's time to reorder.
            </p>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                min={0}
                value={form.reorderLevel}
                onChange={(e) => set('reorderLevel', Number(e.target.value))}
                className="w-24 h-11 text-center text-base font-semibold"
              />
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {form.unit} or fewer → show alert
              </span>
            </div>
          </div>

          {/* ── 7. CATEGORY ── */}
          {categories && categories.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-base font-semibold text-slate-800 dark:text-slate-200">
                Category <span className="text-slate-400 font-normal text-sm">(optional)</span>
              </Label>
              <p className="text-xs text-slate-500">Group this item with similar parts for easy searching.</p>
              <Select value={form.categoryId} onValueChange={(v) => set('categoryId', v)}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Choose a category…" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* ── FOOTER ── */}
          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" size="lg" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              type="submit"
              size="lg"
              className="flex-1"
              disabled={addProduct.isPending || updateProduct.isPending}
            >
              {addProduct.isPending || updateProduct.isPending
                ? 'Saving…'
                : product ? 'Save Changes' : 'Add to Stock'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
