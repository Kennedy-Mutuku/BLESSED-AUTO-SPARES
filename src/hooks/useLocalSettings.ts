import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { db } from '../db/database'

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const rows = await db.settings.toArray()
      return Object.fromEntries(rows.map((r) => [r.key, r.value])) as Record<string, string>
    },
  })
}

export function useUpdateSetting() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      await db.settings.put({ key, value })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
  })
}

export function useUpdateSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (entries: Record<string, string>) => {
      await db.settings.bulkPut(Object.entries(entries).map(([key, value]) => ({ key, value })))
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
  })
}
