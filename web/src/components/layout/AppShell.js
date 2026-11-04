import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
export function AppShell() {
    return (_jsxs("div", { className: "flex min-h-screen bg-slate-100/60", children: [_jsx(Sidebar, {}), _jsxs("main", { className: "flex-1 overflow-y-auto", children: [_jsx(Outlet, {}), _jsx("footer", { className: "px-6 lg:px-8 py-5 mt-4 border-t border-slate-200", children: _jsx("p", { className: "text-slate-400 text-xs", children: "Blessed Auto Spares \u00B7 Genuine Parts & Accessories \u00B7 Sondu, Nyamira County, Kenya \u00B7 +254 700 225849" }) })] })] }));
}
