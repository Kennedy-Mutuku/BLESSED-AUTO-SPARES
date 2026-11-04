import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Package, AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api';
function fmt(n) {
    return `KES ${n.toLocaleString('en-KE')}`;
}
export function InventoryPage() {
    const [search, setSearch] = useState('');
    const { data, isLoading } = useQuery({
        queryKey: ['shopData'],
        queryFn: () => api.get('/api/sync/all'),
    });
    const products = (data?.products ?? []).filter((p) => p.isActive);
    const currency = data?.settings?.find((s) => s.key === 'currencySymbol')?.value ?? 'KES';
    const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku?.toLowerCase().includes(search.toLowerCase()));
    if (isLoading)
        return _jsx(Spinner, {});
    return (_jsxs("div", { className: "p-6 lg:p-8 space-y-6", children: [_jsxs("div", { className: "relative rounded-2xl overflow-hidden", style: { background: '#0f172a' }, children: [_jsx("div", { className: "absolute inset-0 opacity-[0.07]", style: { backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)', backgroundSize: '20px 20px' } }), _jsxs("div", { className: "relative z-10 px-6 pt-6 pb-5 flex items-start justify-between gap-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-red-500/60 text-[10px] font-black uppercase tracking-widest mb-1.5", children: "Blessed Auto Spares" }), _jsx("h1", { className: "text-2xl font-black text-white tracking-tight", children: "Parts Catalog" }), _jsx("p", { className: "text-slate-400 text-sm mt-1.5", children: "Genuine OEM & aftermarket \u00B7 Toyota \u00B7 Nissan \u00B7 Mitsubishi \u00B7 Isuzu" })] }), _jsxs("div", { className: "text-right shrink-0", children: [_jsx("p", { className: "text-3xl font-black text-white", children: products.length }), _jsx("p", { className: "text-slate-500 text-xs mt-0.5", children: "Active Parts" })] })] }), _jsx("div", { className: "relative z-10 border-t border-white/[0.08] px-6 py-4", children: _jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" }), _jsx("input", { value: search, onChange: e => setSearch(e.target.value), placeholder: "Search parts by name or SKU\u2026", className: "w-full pl-10 pr-4 py-2.5 bg-white/[0.07] border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/40 transition" })] }) })] }), _jsx("div", { className: "bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { children: _jsx("tr", { className: "bg-slate-50 border-b border-slate-100", children: ['Part / Description', 'SKU', 'Buy Price', 'Sell Price', 'Stock', 'Status'].map(h => (_jsx("th", { className: "px-6 py-3.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider", children: h }, h))) }) }), _jsxs("tbody", { className: "divide-y divide-slate-50", children: [filtered.map((p) => {
                                    const low = p.stockQuantity <= p.reorderLevel;
                                    const out = p.stockQuantity === 0;
                                    return (_jsxs("tr", { className: "hover:bg-slate-50 transition-colors", children: [_jsx("td", { className: "px-6 py-4", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0", children: _jsx(Package, { className: "w-3.5 h-3.5 text-red-500" }) }), _jsx("span", { className: "font-semibold text-slate-800 text-[13px]", children: p.name })] }) }), _jsx("td", { className: "px-6 py-4 font-mono text-xs text-slate-500", children: p.sku }), _jsx("td", { className: "px-6 py-4 text-slate-600", children: fmt(p.buyingPrice) }), _jsx("td", { className: "px-6 py-4 font-semibold text-slate-800", children: fmt(p.sellingPrice) }), _jsx("td", { className: "px-6 py-4", children: _jsxs("div", { className: "flex items-center gap-1.5", children: [(low || out) && _jsx(AlertTriangle, { className: `w-3.5 h-3.5 ${out ? 'text-red-500' : 'text-amber-500'}` }), _jsxs("span", { className: `font-semibold ${out ? 'text-red-600' : low ? 'text-amber-600' : 'text-slate-700'}`, children: [p.stockQuantity, " ", p.unit] })] }) }), _jsx("td", { className: "px-6 py-4", children: _jsx("span", { className: `inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold ${out ? 'bg-red-50 text-red-700' :
                                                        low ? 'bg-amber-50 text-amber-700' :
                                                            'bg-green-50 text-green-700'}`, children: out ? 'Out of Stock' : low ? 'Low Stock' : 'In Stock' }) })] }, p.id));
                                }), filtered.length === 0 && (_jsx("tr", { children: _jsx("td", { colSpan: 6, className: "px-6 py-12 text-center text-slate-300 text-sm", children: search ? 'No products match your search' : 'No products synced yet' }) }))] })] }) })] }));
}
function Spinner() {
    return (_jsx("div", { className: "flex items-center justify-center min-h-screen", children: _jsx("div", { className: "w-7 h-7 border-4 border-red-600 border-t-transparent rounded-full animate-spin" }) }));
}
