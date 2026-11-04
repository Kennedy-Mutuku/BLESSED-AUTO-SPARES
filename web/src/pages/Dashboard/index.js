import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, ShoppingCart, Package, RefreshCw } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, } from 'recharts';
import { api } from '@/lib/api';
import { getUser } from '@/lib/api';
function fmt(n, cur = 'KES') {
    return `${cur} ${n.toLocaleString('en-KE', { minimumFractionDigits: 0 })}`;
}
function getSetting(settings, key, fallback = '') {
    return settings?.find((s) => s.key === key)?.value ?? fallback;
}
export function DashboardPage() {
    const user = getUser();
    const { data, isLoading, refetch, isFetching } = useQuery({
        queryKey: ['shopData'],
        queryFn: () => api.get('/api/sync/all'),
    });
    const products = data?.products ?? [];
    const sales = data?.sales ?? [];
    const settings = data?.settings ?? [];
    const currency = getSetting(settings, 'currencySymbol', 'KES');
    const shopName = getSetting(settings, 'shopName', user?.shopName ?? 'Blessed Auto Spares');
    // ── Stats ──────────────────────────────────────────────────────────────────
    const now = Date.now();
    const startOfDay = new Date().setHours(0, 0, 0, 0);
    const todaySales = sales.filter((s) => s.soldAt >= startOfDay);
    const todayRev = todaySales.reduce((a, s) => a + (s.subtotal ?? 0), 0);
    const todayProfit = todaySales.reduce((a, s) => a + (s.totalProfit ?? 0), 0);
    const totalStock = products.reduce((a, p) => a + (p.buyingPrice ?? 0) * (p.stockQuantity ?? 0), 0);
    const lowStock = products.filter((p) => (p.stockQuantity ?? 0) <= (p.reorderLevel ?? 5) && p.isActive).length;
    const stats = [
        { label: "Today's Revenue", value: fmt(todayRev, currency), color: 'text-blue-600', bg: 'bg-blue-50', icon: TrendingUp },
        { label: "Today's Profit", value: fmt(todayProfit, currency), color: 'text-green-600', bg: 'bg-green-50', icon: TrendingUp },
        { label: 'Parts Sold Today', value: String(todaySales.length), color: 'text-purple-600', bg: 'bg-purple-50', icon: ShoppingCart },
        { label: 'Need Restocking', value: String(lowStock), color: 'text-red-600', bg: 'bg-red-50', icon: Package },
    ];
    // ── Revenue chart: last 7 days ─────────────────────────────────────────────
    const chartData = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now - (6 - i) * 86400000);
        const start = new Date(d).setHours(0, 0, 0, 0);
        const end = new Date(d).setHours(23, 59, 59, 999);
        const daySales = sales.filter((s) => s.soldAt >= start && s.soldAt <= end);
        return {
            day: d.toLocaleDateString('en-KE', { weekday: 'short' }),
            revenue: daySales.reduce((a, s) => a + (s.subtotal ?? 0), 0),
            profit: daySales.reduce((a, s) => a + (s.totalProfit ?? 0), 0),
        };
    });
    // ── Top 5 products by quantity sold ───────────────────────────────────────
    const qtyByProduct = {};
    for (const sale of sales) {
        for (const item of sale.items ?? []) {
            if (!qtyByProduct[item.productId]) {
                qtyByProduct[item.productId] = { name: item.productName, qty: 0 };
            }
            qtyByProduct[item.productId].qty += item.quantity ?? 0;
        }
    }
    const topProducts = Object.values(qtyByProduct)
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 5);
    const PIE_COLORS = ['#dc2626', '#f97316', '#eab308', '#22c55e', '#3b82f6'];
    if (isLoading)
        return (_jsx("div", { className: "flex items-center justify-center min-h-screen", children: _jsxs("div", { className: "flex flex-col items-center gap-3 text-slate-400", children: [_jsx("div", { className: "w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" }), _jsx("span", { className: "text-sm", children: "Loading your data\u2026" })] }) }));
    return (_jsxs("div", { className: "p-6 lg:p-8 space-y-6", children: [_jsxs("div", { className: "relative rounded-2xl overflow-hidden", style: { background: 'linear-gradient(135deg, #0f172a 60%, #1f0505 100%)' }, children: [_jsx("div", { className: "absolute inset-0 opacity-[0.07]", style: { backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)', backgroundSize: '24px 24px' } }), _jsx("div", { className: "absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-red-950/40 to-transparent" }), _jsxs("div", { className: "relative z-10 px-7 py-7 flex items-end justify-between gap-4 flex-wrap", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-2 mb-3", children: [_jsx("span", { className: "w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block" }), _jsx("span", { className: "text-green-400/80 text-[10px] font-black uppercase tracking-widest", children: "Live Dashboard" })] }), _jsx("h1", { className: "text-3xl font-black text-white tracking-tight", children: shopName }), _jsx("p", { className: "text-slate-400 text-sm mt-1.5", children: "Auto parts & accessories \u00B7 Sondu, Nyamira County, Kenya" }), _jsx("p", { className: "text-slate-600 text-xs mt-1", children: new Date().toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) })] }), _jsxs("button", { onClick: () => refetch(), disabled: isFetching, className: "flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white text-sm font-semibold hover:bg-white/[0.15] disabled:opacity-50 transition-all", children: [_jsx(RefreshCw, { className: `w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}` }), "Refresh"] })] })] }), _jsx("div", { className: "grid grid-cols-2 xl:grid-cols-4 gap-4", children: stats.map(s => (_jsxs("div", { className: "bg-white rounded-2xl p-5 border border-slate-100 shadow-sm", children: [_jsx("div", { className: `w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`, children: _jsx(s.icon, { className: `w-4 h-4 ${s.color}` }) }), _jsx("p", { className: `text-xl font-black ${s.color}`, children: s.value }), _jsx("p", { className: "text-slate-400 text-xs mt-1 font-medium", children: s.label })] }, s.label))) }), _jsxs("div", { className: "grid grid-cols-1 xl:grid-cols-3 gap-6", children: [_jsxs("div", { className: "xl:col-span-2 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm", children: [_jsx("h2", { className: "text-sm font-bold text-slate-700 mb-4", children: "Revenue & Profit \u2014 Last 7 Days" }), _jsx(ResponsiveContainer, { width: "100%", height: 220, children: _jsxs(AreaChart, { data: chartData, children: [_jsxs("defs", { children: [_jsxs("linearGradient", { id: "gRev", x1: "0", y1: "0", x2: "0", y2: "1", children: [_jsx("stop", { offset: "5%", stopColor: "#dc2626", stopOpacity: 0.15 }), _jsx("stop", { offset: "95%", stopColor: "#dc2626", stopOpacity: 0 })] }), _jsxs("linearGradient", { id: "gPro", x1: "0", y1: "0", x2: "0", y2: "1", children: [_jsx("stop", { offset: "5%", stopColor: "#22c55e", stopOpacity: 0.15 }), _jsx("stop", { offset: "95%", stopColor: "#22c55e", stopOpacity: 0 })] })] }), _jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#f1f5f9" }), _jsx(XAxis, { dataKey: "day", tick: { fontSize: 11, fill: '#94a3b8' }, axisLine: false, tickLine: false }), _jsx(YAxis, { tick: { fontSize: 11, fill: '#94a3b8' }, axisLine: false, tickLine: false, width: 60, tickFormatter: v => `${currency} ${v.toLocaleString()}` }), _jsx(Tooltip, { contentStyle: { borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,.08)' }, formatter: (v) => [`${currency} ${Number(v).toLocaleString()}`, ''] }), _jsx(Area, { type: "monotone", dataKey: "revenue", name: "Revenue", stroke: "#dc2626", strokeWidth: 2, fill: "url(#gRev)" }), _jsx(Area, { type: "monotone", dataKey: "profit", name: "Profit", stroke: "#22c55e", strokeWidth: 2, fill: "url(#gPro)" })] }) })] }), _jsxs("div", { className: "bg-white rounded-2xl p-6 border border-slate-100 shadow-sm", children: [_jsx("h2", { className: "text-sm font-bold text-slate-700 mb-4", children: "Top-Selling Parts" }), topProducts.length === 0 ? (_jsx("div", { className: "flex items-center justify-center h-48 text-slate-300 text-sm", children: "No sales data yet" })) : (_jsx(ResponsiveContainer, { width: "100%", height: 220, children: _jsxs(PieChart, { children: [_jsx(Pie, { data: topProducts, dataKey: "qty", nameKey: "name", cx: "50%", cy: "50%", innerRadius: 50, outerRadius: 80, paddingAngle: 3, children: topProducts.map((_, i) => (_jsx(Cell, { fill: PIE_COLORS[i % PIE_COLORS.length] }, i))) }), _jsx(Legend, { iconType: "circle", iconSize: 8, wrapperStyle: { fontSize: 11 }, formatter: (v) => v.length > 18 ? v.slice(0, 18) + '…' : v }), _jsx(Tooltip, { formatter: (v) => [`${v} units`, ''] })] }) }))] })] }), _jsxs("div", { className: "bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden", children: [_jsx("div", { className: "px-6 py-4 border-b border-slate-100", children: _jsx("h2", { className: "text-sm font-bold text-slate-700", children: "Recent Transactions" }) }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { children: _jsx("tr", { className: "bg-slate-50", children: ['Receipt', 'Date', 'Items', 'Revenue', 'Profit', 'Method'].map(h => (_jsx("th", { className: "px-6 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider", children: h }, h))) }) }), _jsxs("tbody", { className: "divide-y divide-slate-50", children: [sales.slice().sort((a, b) => b.soldAt - a.soldAt).slice(0, 10).map((s) => (_jsxs("tr", { className: "hover:bg-slate-50 transition-colors", children: [_jsx("td", { className: "px-6 py-3.5 font-mono text-xs text-slate-500", children: s.receiptNumber }), _jsx("td", { className: "px-6 py-3.5 text-slate-600", children: new Date(s.soldAt).toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' }) }), _jsx("td", { className: "px-6 py-3.5 text-slate-600", children: s.items?.length ?? 0 }), _jsx("td", { className: "px-6 py-3.5 font-semibold text-slate-800", children: fmt(s.subtotal ?? 0, currency) }), _jsx("td", { className: "px-6 py-3.5 font-semibold text-green-600", children: fmt(s.totalProfit ?? 0, currency) }), _jsx("td", { className: "px-6 py-3.5", children: _jsx("span", { className: `inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${s.paymentMethod === 'cash' ? 'bg-green-50 text-green-700' :
                                                            s.paymentMethod === 'mpesa' ? 'bg-blue-50 text-blue-700' :
                                                                s.paymentMethod === 'card' ? 'bg-purple-50 text-purple-700' :
                                                                    'bg-amber-50 text-amber-700'}`, children: s.paymentMethod }) })] }, s.id))), sales.length === 0 && (_jsx("tr", { children: _jsx("td", { colSpan: 6, className: "px-6 py-10 text-center text-slate-300 text-sm", children: "No sales synced yet. Make a sale on the app then tap Sync." }) }))] })] }) })] })] }));
}
