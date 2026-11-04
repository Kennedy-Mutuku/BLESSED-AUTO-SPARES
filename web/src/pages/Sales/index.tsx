import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, ChevronDown } from 'lucide-react'
import { api } from '@/lib/api'

const METHODS = ['all', 'cash', 'mpesa', 'card', 'credit']

export function SalesPage() {
  const [search, setSearch]   = useState('')
  const [method, setMethod]   = useState('all')
  const [expanded, setExpanded] = useState<string | null>(null)

  const { data, isLoading } = useQuery<{ sales: any[]; settings: any[] }>({
    queryKey: ['shopData'],
    queryFn:  () => api.get('/api/sync/all'),
  })

  const currency = data?.settings?.find((s: any) => s.key === 'currencySymbol')?.value ?? 'KES'
  const fmt = (n: number) => `${currency} ${n.toLocaleString('en-KE')}`

  const sales = (data?.sales ?? [])
    .filter((s: any) => method === 'all' || s.paymentMethod === method)
    .filter((s: any) =>
      s.receiptNumber?.toLowerCase().includes(search.toLowerCase()) ||
      s.customerName?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a: any, b: any) => b.soldAt - a.soldAt)

  const totalRev    = sales.reduce((a: number, s: any) => a + (s.subtotal ?? 0), 0)
  const totalProfit = sales.reduce((a: number, s: any) => a + (s.totalProfit ?? 0), 0)

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-7 h-7 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="p-6 lg:p-8 space-y-6">

      {/* Branded header */}
      <div className="relative rounded-2xl overflow-hidden" style={{ background: '#0f172a' }}>
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        <div className="relative z-10 px-6 pt-6 pb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-red-500/60 text-[10px] font-black uppercase tracking-widest mb-1.5">Blessed Auto Spares</p>
            <h1 className="text-2xl font-black text-white tracking-tight">Sales Transactions</h1>
            <p className="text-slate-400 text-sm mt-1.5">Complete record of every parts sale · Cash · M-Pesa · Card · Credit</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-3xl font-black text-white">{sales.length}</p>
            <p className="text-slate-500 text-xs mt-0.5">Transactions</p>
          </div>
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <p className="text-2xl font-black text-blue-600">{fmt(totalRev)}</p>
          <p className="text-slate-400 text-xs mt-1 font-medium">Parts Revenue (filtered)</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <p className="text-2xl font-black text-green-600">{fmt(totalProfit)}</p>
          <p className="text-slate-400 text-xs mt-1 font-medium">Net Profit (filtered)</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Receipt # or customer…"
            className="pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-400 bg-white w-56"
          />
        </div>
        <div className="flex gap-2">
          {METHODS.map(m => (
            <button
              key={m}
              onClick={() => setMethod(m)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold capitalize transition-all ${
                method === m
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-500 hover:border-red-300 hover:text-red-600'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Sales list */}
      <div className="space-y-2">
        {sales.map((s: any) => (
          <div key={s.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <button
              onClick={() => setExpanded(expanded === s.id ? null : s.id)}
              className="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors text-left"
            >
              <div className="flex-1 grid grid-cols-4 gap-4">
                <div>
                  <p className="font-mono text-xs text-slate-400">{s.receiptNumber}</p>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">
                    {new Date(s.soldAt).toLocaleDateString('en-KE', { day: '2-digit', month: 'short' })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Revenue</p>
                  <p className="text-sm font-bold text-slate-800">{fmt(s.subtotal ?? 0)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Profit</p>
                  <p className="text-sm font-bold text-green-600">{fmt(s.totalProfit ?? 0)}</p>
                </div>
                <div>
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                    s.paymentMethod === 'cash'   ? 'bg-green-50 text-green-700'   :
                    s.paymentMethod === 'mpesa'  ? 'bg-blue-50 text-blue-700'    :
                    s.paymentMethod === 'card'   ? 'bg-purple-50 text-purple-700' :
                    'bg-amber-50 text-amber-700'
                  }`}>
                    {s.paymentMethod}
                  </span>
                </div>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${expanded === s.id ? 'rotate-180' : ''}`} />
            </button>

            {expanded === s.id && (
              <div className="border-t border-slate-100 px-5 py-4 bg-slate-50 space-y-2">
                {(s.items ?? []).map((item: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-slate-700">{item.productName} × {item.quantity}</span>
                    <span className="font-semibold text-slate-800">{fmt(item.lineTotal ?? 0)}</span>
                  </div>
                ))}
                {s.customerName && (
                  <p className="text-xs text-slate-400 pt-2 border-t border-slate-200">
                    Customer: <span className="font-medium text-slate-600">{s.customerName}</span>
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
        {sales.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center text-slate-300 text-sm">
            No sales found. Sync your app to see data here.
          </div>
        )}
      </div>
    </div>
  )
}
