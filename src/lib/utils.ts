import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, symbol = 'KES'): string {
  return `${symbol} ${amount.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-KE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString('en-KE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function generateId(): string {
  return crypto.randomUUID()
}

export function generateReceiptNumber(): string {
  const now = Date.now()
  const rand = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `RCP-${now.toString().slice(-6)}${rand}`
}

export function profitMarginClass(margin: number): string {
  if (margin >= 30) return 'text-green-500'
  if (margin >= 10) return 'text-amber-500'
  return 'text-red-500'
}
