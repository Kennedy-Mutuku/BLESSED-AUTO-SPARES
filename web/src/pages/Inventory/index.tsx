import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Package, AlertTriangle } from 'lucide-react'
import { api } from '@/lib/api'

interface Product {
  id: string; name: string; sku: string; buyingPrice: number
  sellingPrice: number; stockQuantity: number; reorderLevel: number
  unit: string; isActive: boolean; categoryId: string
}

function fmt(n: number) {
  return `KES ${n.toLocaleString('en-KE')}`
}

export function InventoryPage() {
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery<{ products: Product[]; settings: any[] }>({
    queryKey: ['shopData'],
    queryFn:  () => api.get('/api/sync/all'),
  })

  const products = (data?.products ?? []).filter((p: Product) => p.isActive)
  const currency = data?.settings?.find((s: any) => s.key === 'currencySymbol')?.value ?? 'KES'

  const filtered = products.filter((p: Product) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku?.toLowerCase().includes(search.toLowerCase())
  )

  if (isLoading) return <Spinner />

  return (
    <div className="p-6 lg:p-8 space-y-6">

      {/* Branded header */}
      <div className="relative rounded-2xl overflow-hidden" style={{ background: '#0f172a' }}>
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        <div className="relative z-10 px-6 pt-6 pb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-red-500/60 text-[10px] font-black uppercase tracking-widest mb-1.5">Blessed Auto Spares</p>
            <h1 className="text-2xl font-black text-white tracking-tight">Parts Catalog</h1>
            <p className="text-slate-400 text-sm mt-1.5">Genuine OEM &amp; aftermarket · Toyota · Nissan · Mitsubishi · Isuzu</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-3xl font-black text-white">{products.length}</p>
            <p className="text-slate-500 text-xs mt-0.5">Active Parts</p>
          </div>
        </div>
        <div className="relative z-10 border-t border-white/[0.08] px-6 py-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search parts by name or SKU…"
              className="w-full pl-10 pr-4 py-2.5 bg-white/[0.07] border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/40 transition"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              {['Part / Description', 'SKU', 'Buy Price', 'Sell Price', 'Stock', 'Status'].map(h => (
                <th key={h} className="px-6 py-3.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map((p: Product) => {
              const low = p.stockQuantity <= p.reorderLevel
              const out = p.stockQuantity === 0
              return (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                        <Package className="w-3.5 h-3.5 text-red-500" />
                      </div>
                      <span className="font-semibold text-slate-800 text-[13px]">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-500">{p.sku}</td>
                  <td className="px-6 py-4 text-slate-600">{fmt(p.buyingPrice)}</td>
                  <td className="px-6 py-4 font-semibold text-slate-800">{fmt(p.sellingPrice)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      {(low || out) && <AlertTriangle className={`w-3.5 h-3.5 ${out ? 'text-red-500' : 'text-amber-500'}`} />}
                      <span className={`font-semibold ${out ? 'text-red-600' : low ? 'text-amber-600' : 'text-slate-700'}`}>
                        {p.stockQuantity} {p.unit}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                      out ? 'bg-red-50 text-red-700'   :
                      low ? 'bg-amber-50 text-amber-700' :
                      'bg-green-50 text-green-700'
                    }`}>
                      {out ? 'Out of Stock' : low ? 'Low Stock' : 'In Stock'}
                    </span>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-300 text-sm">
                  {search ? 'No products match your search' : 'No products synced yet'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Spinner() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-7 h-7 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
