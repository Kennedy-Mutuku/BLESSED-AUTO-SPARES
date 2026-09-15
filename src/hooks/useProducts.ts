import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { db } from '../db/database'
import type { Product } from '../db/schema'
import { generateId } from '../lib/utils'

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const all = await db.products.toArray()
      return all.filter((p) => p.isActive).sort((a, b) => a.name.localeCompare(b.name))
    },
  })
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['products', id],
    queryFn: () => db.products.get(id),
    enabled: !!id,
  })
}

export function useAddProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
      const product: Product = {
        ...data,
        id: generateId(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      await db.products.add(product)
      return product
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  })
}

export function useUpdateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Product> & { id: string }) => {
      await db.products.update(id, { ...data, updatedAt: Date.now() })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] })
      qc.invalidateQueries({ queryKey: ['stock-alerts'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useDeleteProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await db.products.update(id, { isActive: false, updatedAt: Date.now() })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  })
}

export function useRestockProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      productId,
      addQty,
      newBuyingPrice,
      note,
    }: {
      productId: string
      addQty: number
      newBuyingPrice?: number
      note?: string
    }) => {
      await db.transaction('rw', db.products, db.stockHistory, async () => {
        const product = await db.products.get(productId)
        if (!product) throw new Error('Product not found')
        const qBefore = product.stockQuantity
        const qAfter = qBefore + addQty
        await db.products.update(productId, {
          stockQuantity: qAfter,
          ...(newBuyingPrice !== undefined ? { buyingPrice: newBuyingPrice } : {}),
          updatedAt: Date.now(),
        })
        await db.stockHistory.add({
          id: generateId(),
          productId,
          changeType: 'restock',
          quantityBefore: qBefore,
          quantityChange: addQty,
          quantityAfter: qAfter,
          relatedSaleId: '',
          note: note ?? 'Manual restock',
          createdAt: Date.now(),
        })
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] })
      qc.invalidateQueries({ queryKey: ['stock-alerts'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
