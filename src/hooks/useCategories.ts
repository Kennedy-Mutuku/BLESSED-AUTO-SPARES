import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { db } from '../db/database'
import type { Category } from '../db/schema'
import { generateId } from '../lib/utils'

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => db.categories.orderBy('name').toArray(),
  })
}

export function useAddCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: Omit<Category, 'id' | 'createdAt'>) => {
      const cat: Category = { ...data, id: generateId(), createdAt: Date.now() }
      await db.categories.add(cat)
      return cat
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  })
}

export function useUpdateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Category> & { id: string }) => {
      await db.categories.update(id, data)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  })
}

export function useDeleteCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await db.categories.delete(id)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  })
}
