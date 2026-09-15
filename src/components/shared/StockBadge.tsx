import { cn } from '@/lib/utils'

interface StockBadgeProps {
  stock: number
  reorderLevel: number
  className?: string
}

export function StockBadge({ stock, reorderLevel, className }: StockBadgeProps) {
  if (stock === 0) {
    return (
      <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', className)}>
        Out of Stock
      </span>
    )
  }
  if (stock <= reorderLevel) {
    return (
      <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', className)}>
        Low: {stock}
      </span>
    )
  }
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', className)}>
      {stock} in stock
    </span>
  )
}
