import { useState, useMemo } from 'react'
import { BarChart2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { db } from '@/db/database'
import { useProducts } from '@/hooks/useProducts'
import { useCategories } from '@/hooks/useCategories'
import { useSettings } from '@/hooks/useLocalSettings'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCurrency } from '@/lib/utils'
import { stockValuation } from '@/lib/calculations'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'

const PERIOD_OPTIONS = [
  { label: 'Last 7 days', value: '7' },
  { label: 'Last 30 days', value: '30' },
  { label: 'Last 90 days', value: '90' },
]

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

export function ReportsPage() {
  const [period, setPeriod] = useState('30')
  const { data: products = [] } = useProducts()
  const { data: categories = [] } = useCategories()
  const { data: settings } = useSettings()
  const currency = settings?.currencySymbol ?? 'KES'
  const days = Number(period)

  const { data: sales = [] } = useQuery({
    queryKey: ['sales-report', days],
    queryFn: async () => {
      const start = startOfDay(subDays(new Date(), days)).getTime()
      const end = endOfDay(new Date()).getTime()
      return db.sales.where('soldAt').between(start, end, true, true).toArray()
    },
  })

  // Daily revenue/profit chart data
  const chartData = useMemo(() => {
    const map = new Map<string, { revenue: number; profit: number }>()
    for (let i = days - 1; i >= 0; i--) {
      const d = format(subDays(new Date(), i), 'MMM d')
      map.set(d, { revenue: 0, profit: 0 })
    }
    for (const sale of sales) {
      const d = format(new Date(sale.soldAt), 'MMM d')
      if (map.has(d)) {
        const entry = map.get(d)!
        entry.revenue += sale.subtotal
        entry.profit += sale.totalProfit
      }
    }
    return Array.from(map.entries()).map(([date, v]) => ({ date, ...v }))
  }, [sales, days])

  // Category breakdown
  const categoryData = useMemo(() => {
    const catMap = Object.fromEntries(categories.map((c) => [c.id, c.name]))
    const totals = new Map<string, number>()
    for (const sale of sales) {
      for (const item of sale.items) {
        const product = products.find((p) => p.id === item.productId)
        if (!product) continue
        const catName = catMap[product.categoryId] ?? 'Uncategorized'
        totals.set(catName, (totals.get(catName) ?? 0) + item.lineTotal)
      }
    }
    return Array.from(totals.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [sales, products, categories])

  // Stock valuation
  const valuation = useMemo(() => stockValuation(products), [products])

  // Best performers
  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; revenue: number; profit: number; qty: number }>()
    for (const sale of sales) {
      for (const item of sale.items) {
        const existing = map.get(item.productId)
        if (existing) {
          existing.revenue += item.lineTotal
          existing.profit += item.lineProfit
          existing.qty += item.quantity
        } else {
          map.set(item.productId, { name: item.productName, revenue: item.lineTotal, profit: item.lineProfit, qty: item.quantity })
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 10)
  }, [sales])

  // Payment breakdown
  const paymentBreakdown = useMemo(() => {
    const map = new Map<string, number>()
    for (const sale of sales) {
      map.set(sale.paymentMethod, (map.get(sale.paymentMethod) ?? 0) + sale.subtotal)
    }
    return Array.from(map.entries()).map(([name, value]) => ({ name: name.toUpperCase(), value }))
  }, [sales])

  const totalRevenue = sales.reduce((s, x) => s + x.subtotal, 0)
  const totalProfit = sales.reduce((s, x) => s + x.totalProfit, 0)

  return (
    <div className="flex flex-col h-dvh bg-white overflow-hidden">

      {/* ── STICKY HEADER ── */}
      <div className="shrink-0 px-4 pt-4 bg-red-600">
        <PageHeader
          title="Reports"
          backTo="/"
          actions={
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-32 h-8 bg-white/20 border-white/30 text-white text-xs font-medium focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIOD_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          }
        />
      </div>

      {/* ── SCROLLABLE CONTENT ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4">

      {sales.length === 0 ? (
        <EmptyState icon={BarChart2} title="No sales data" description="Start making sales to see reports" />
      ) : (
        <div className="space-y-6">
          {/* KPI Summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
              <div className="text-xs text-slate-500 mb-1">Total Revenue</div>
              <div className="text-xl font-bold text-slate-900 dark:text-slate-100">{formatCurrency(totalRevenue, currency)}</div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
              <div className="text-xs text-slate-500 mb-1">Total Profit</div>
              <div className="text-xl font-bold text-green-600">{formatCurrency(totalProfit, currency)}</div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
              <div className="text-xs text-slate-500 mb-1">Total Sales</div>
              <div className="text-xl font-bold text-slate-900 dark:text-slate-100">{sales.length}</div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
              <div className="text-xs text-slate-500 mb-1">Avg. per Sale</div>
              <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {formatCurrency(sales.length > 0 ? totalRevenue / sales.length : 0, currency)}
              </div>
            </div>
          </div>

          {/* Revenue/Profit Chart */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Revenue vs Profit</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip
                  formatter={(v: number) => formatCurrency(v, currency)}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="#dbeafe" name="Revenue" />
                <Area type="monotone" dataKey="profit" stroke="#10b981" fill="#d1fae5" name="Profit" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Category Breakdown */}
          {categoryData.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Revenue by Category</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Legend />
                  <Tooltip formatter={(v: number) => formatCurrency(v, currency)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Stock Valuation */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Stock Valuation</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Capital Tied Up</span>
                <span className="font-medium">{formatCurrency(valuation.capitalTiedUp, currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Potential Revenue</span>
                <span className="font-medium">{formatCurrency(valuation.potentialRevenue, currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Potential Profit</span>
                <span className="font-medium text-green-600">{formatCurrency(valuation.potentialProfit, currency)}</span>
              </div>
            </div>
          </div>

          {/* Top Products */}
          {topProducts.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Top Products</h3>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700">
                    <th className="text-left pb-1 text-slate-500">Product</th>
                    <th className="text-right pb-1 text-slate-500">Qty</th>
                    <th className="text-right pb-1 text-slate-500">Revenue</th>
                    <th className="text-right pb-1 text-slate-500">Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((p, i) => (
                    <tr key={i} className="border-b border-slate-50 dark:border-slate-800">
                      <td className="py-1.5 font-medium text-slate-800 dark:text-slate-200 truncate max-w-[120px]">{p.name}</td>
                      <td className="text-right py-1.5 text-slate-500">{p.qty}</td>
                      <td className="text-right py-1.5">{formatCurrency(p.revenue, currency)}</td>
                      <td className="text-right py-1.5 text-green-600">{formatCurrency(p.profit, currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Payment Breakdown */}
          {paymentBreakdown.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Payment Methods</h3>
              <div className="space-y-2">
                {paymentBreakdown.map((p, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">{p.name}</span>
                    <span className="font-medium">{formatCurrency(p.value, currency)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  )
}
