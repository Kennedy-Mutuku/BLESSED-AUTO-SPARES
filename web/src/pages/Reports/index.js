import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useQuery } from '@tanstack/react-query';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, } from 'recharts';
import { api } from '@/lib/api';
const PIE_COLORS = ['#dc2626', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#06b6d4'];
export function ReportsPage() {
    const { data, isLoading } = useQuery({
        queryKey: ['shopData'],
        queryFn: () => api.get('/api/sync/all'),
    });
    const sales = data?.sales ?? [];
    const products = data?.products ?? [];
    const currency = data?.settings?.find((s) => s.key === 'currencySymbol')?.value ?? 'KES';
    const fmt = (n) => `${currency} ${n.toLocaleString('en-KE')}`;
    // Last 30 days revenue by day
    const now = Date.now();
    const monthData = Array.from({ length: 30 }, (_, i) => {
        const d = new Date(now - (29 - i) * 86400000);
        const start = new Date(d).setHours(0, 0, 0, 0);
        const end = new Date(d).setHours(23, 59, 59, 999);
        const daySales = sales.filter((s) => s.soldAt >= start && s.soldAt <= end);
        return {
            day: d.toLocaleDateString('en-KE', { day: '2-digit', month: 'short' }),
            revenue: daySales.reduce((a, s) => a + (s.subtotal ?? 0), 0),
            profit: daySales.reduce((a, s) => a + (s.totalProfit ?? 0), 0),
        };
    });
    // Payment method breakdown
    const pmBreakdown = {};
    for (const s of sales) {
        pmBreakdown[s.paymentMethod ?? 'other'] = (pmBreakdown[s.paymentMethod ?? 'other'] ?? 0) + (s.subtotal ?? 0);
    }
    const pmData = Object.entries(pmBreakdown).map(([name, value]) => ({ name, value }));
    // Top 10 products by revenue
    const revByProduct = {};
    for (const sale of sales) {
        for (const item of sale.items ?? []) {
            if (!revByProduct[item.productId]) {
                revByProduct[item.productId] = { name: item.productName, revenue: 0, profit: 0 };
            }
            revByProduct[item.productId].revenue += item.lineTotal ?? 0;
            revByProduct[item.productId].profit += item.lineProfit ?? 0;
        }
    }
    const topByRev = Object.values(revByProduct).sort((a, b) => b.revenue - a.revenue).slice(0, 10);
    // Stock valuation
    const stockWorth = products.reduce((a, p) => a + (p.buyingPrice ?? 0) * (p.stockQuantity ?? 0), 0);
    const stockRetail = products.reduce((a, p) => a + (p.sellingPrice ?? 0) * (p.stockQuantity ?? 0), 0);
    const expectedProfit = stockRetail - stockWorth;
    if (isLoading)
        return (_jsx("div", { className: "flex items-center justify-center min-h-screen", children: _jsx("div", { className: "w-7 h-7 border-4 border-red-600 border-t-transparent rounded-full animate-spin" }) }));
    return (_jsxs("div", { className: "p-6 lg:p-8 space-y-6", children: [_jsxs("div", { className: "relative rounded-2xl overflow-hidden", style: { background: 'linear-gradient(135deg, #0f172a 60%, #1f0505 100%)' }, children: [_jsx("div", { className: "absolute inset-0 opacity-[0.07]", style: { backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)', backgroundSize: '20px 20px' } }), _jsx("div", { className: "absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-red-950/30 to-transparent" }), _jsxs("div", { className: "relative z-10 px-6 py-6", children: [_jsx("p", { className: "text-red-500/60 text-[10px] font-black uppercase tracking-widest mb-1.5", children: "Blessed Auto Spares" }), _jsx("h1", { className: "text-2xl font-black text-white tracking-tight", children: "Business Performance" }), _jsx("p", { className: "text-slate-400 text-sm mt-1.5", children: "Revenue trends, profit margins & stock intelligence for all synced data" })] })] }), _jsx("div", { className: "grid grid-cols-2 xl:grid-cols-4 gap-4", children: [
                    { label: 'Total Revenue', value: fmt(sales.reduce((a, s) => a + (s.subtotal ?? 0), 0)), color: 'text-blue-600' },
                    { label: 'Total Profit', value: fmt(sales.reduce((a, s) => a + (s.totalProfit ?? 0), 0)), color: 'text-green-600' },
                    { label: 'Parts Inventory Value', value: fmt(stockWorth), color: 'text-slate-700' },
                    { label: 'Potential Profit', value: fmt(expectedProfit), color: 'text-emerald-600' },
                ].map(k => (_jsxs("div", { className: "bg-white rounded-2xl p-5 border border-slate-100 shadow-sm", children: [_jsx("p", { className: `text-xl font-black ${k.color}`, children: k.value }), _jsx("p", { className: "text-slate-400 text-xs mt-1 font-medium", children: k.label })] }, k.label))) }), _jsxs("div", { className: "bg-white rounded-2xl p-6 border border-slate-100 shadow-sm", children: [_jsx("h2", { className: "text-sm font-bold text-slate-700 mb-4", children: "Revenue & Profit \u2014 Last 30 Days" }), _jsx(ResponsiveContainer, { width: "100%", height: 260, children: _jsxs(AreaChart, { data: monthData, children: [_jsxs("defs", { children: [_jsxs("linearGradient", { id: "gRev30", x1: "0", y1: "0", x2: "0", y2: "1", children: [_jsx("stop", { offset: "5%", stopColor: "#dc2626", stopOpacity: 0.15 }), _jsx("stop", { offset: "95%", stopColor: "#dc2626", stopOpacity: 0 })] }), _jsxs("linearGradient", { id: "gPro30", x1: "0", y1: "0", x2: "0", y2: "1", children: [_jsx("stop", { offset: "5%", stopColor: "#22c55e", stopOpacity: 0.15 }), _jsx("stop", { offset: "95%", stopColor: "#22c55e", stopOpacity: 0 })] })] }), _jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#f1f5f9" }), _jsx(XAxis, { dataKey: "day", tick: { fontSize: 10, fill: '#94a3b8' }, axisLine: false, tickLine: false, interval: 4 }), _jsx(YAxis, { tick: { fontSize: 10, fill: '#94a3b8' }, axisLine: false, tickLine: false, width: 65, tickFormatter: v => `${v.toLocaleString()}` }), _jsx(Tooltip, { contentStyle: { borderRadius: 12, border: '1px solid #e2e8f0' }, formatter: (v) => [`${currency} ${Number(v).toLocaleString()}`, ''] }), _jsx(Area, { type: "monotone", dataKey: "revenue", name: "Revenue", stroke: "#dc2626", strokeWidth: 2, fill: "url(#gRev30)" }), _jsx(Area, { type: "monotone", dataKey: "profit", name: "Profit", stroke: "#22c55e", strokeWidth: 2, fill: "url(#gPro30)" })] }) })] }), _jsxs("div", { className: "grid grid-cols-1 xl:grid-cols-2 gap-6", children: [_jsxs("div", { className: "bg-white rounded-2xl p-6 border border-slate-100 shadow-sm", children: [_jsx("h2", { className: "text-sm font-bold text-slate-700 mb-4", children: "Top-Selling Parts by Revenue" }), _jsx(ResponsiveContainer, { width: "100%", height: 260, children: _jsxs(BarChart, { data: topByRev, layout: "vertical", children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#f1f5f9", horizontal: false }), _jsx(XAxis, { type: "number", tick: { fontSize: 10, fill: '#94a3b8' }, axisLine: false, tickLine: false, tickFormatter: v => `${v.toLocaleString()}` }), _jsx(YAxis, { type: "category", dataKey: "name", tick: { fontSize: 11, fill: '#475569' }, axisLine: false, tickLine: false, width: 120, tickFormatter: (v) => v.length > 16 ? v.slice(0, 16) + '…' : v }), _jsx(Tooltip, { formatter: (v) => [`${currency} ${Number(v).toLocaleString()}`, ''], contentStyle: { borderRadius: 12 } }), _jsx(Bar, { dataKey: "revenue", name: "Revenue", fill: "#dc2626", radius: [0, 6, 6, 0] }), _jsx(Bar, { dataKey: "profit", name: "Profit", fill: "#22c55e", radius: [0, 6, 6, 0] })] }) })] }), _jsxs("div", { className: "bg-white rounded-2xl p-6 border border-slate-100 shadow-sm", children: [_jsx("h2", { className: "text-sm font-bold text-slate-700 mb-4", children: "Sales by Payment Method" }), pmData.length === 0 ? (_jsx("div", { className: "flex items-center justify-center h-60 text-slate-300 text-sm", children: "No data" })) : (_jsx(ResponsiveContainer, { width: "100%", height: 260, children: _jsxs(PieChart, { children: [_jsx(Pie, { data: pmData, dataKey: "value", nameKey: "name", cx: "50%", cy: "50%", innerRadius: 60, outerRadius: 100, paddingAngle: 3, children: pmData.map((_, i) => _jsx(Cell, { fill: PIE_COLORS[i % PIE_COLORS.length] }, i)) }), _jsx(Legend, { iconType: "circle", iconSize: 8, wrapperStyle: { fontSize: 12 } }), _jsx(Tooltip, { formatter: (v) => [`${currency} ${Number(v).toLocaleString()}`, ''] })] }) }))] })] })] }));
}
