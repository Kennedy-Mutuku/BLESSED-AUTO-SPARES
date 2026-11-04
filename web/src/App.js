import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { getToken } from '@/lib/api';
import { LandingPage } from '@/pages/Landing';
import { LoginPage } from '@/pages/Login';
import { ResetPinPage } from '@/pages/ResetPin';
import { ForgotPinPage } from '@/pages/ForgotPin';
import { AppShell } from '@/components/layout/AppShell';
import { DashboardPage } from '@/pages/Dashboard';
import { InventoryPage } from '@/pages/Inventory';
import { SalesPage } from '@/pages/Sales';
import { ReportsPage } from '@/pages/Reports';
function RequireAuth({ children }) {
    return getToken() ? _jsx(_Fragment, { children: children }) : _jsx(Navigate, { to: "/login", replace: true });
}
export default function App() {
    return (_jsxs(BrowserRouter, { children: [_jsx(Toaster, { position: "top-right", toastOptions: { duration: 3000 } }), _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(LandingPage, {}) }), _jsx(Route, { path: "/login", element: _jsx(LoginPage, {}) }), _jsx(Route, { path: "/forgot-pin", element: _jsx(ForgotPinPage, {}) }), _jsx(Route, { path: "/reset-pin", element: _jsx(ResetPinPage, {}) }), _jsxs(Route, { element: _jsx(RequireAuth, { children: _jsx(AppShell, {}) }), children: [_jsx(Route, { path: "/dashboard", element: _jsx(DashboardPage, {}) }), _jsx(Route, { path: "/inventory", element: _jsx(InventoryPage, {}) }), _jsx(Route, { path: "/sales", element: _jsx(SalesPage, {}) }), _jsx(Route, { path: "/reports", element: _jsx(ReportsPage, {}) })] })] })] }));
}
