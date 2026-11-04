import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { getToken } from '@/lib/api'
import { LandingPage } from '@/pages/Landing'
import { LoginPage } from '@/pages/Login'
import { ResetPinPage } from '@/pages/ResetPin'
import { ForgotPinPage } from '@/pages/ForgotPin'
import { AppShell } from '@/components/layout/AppShell'
import { DashboardPage } from '@/pages/Dashboard'
import { InventoryPage } from '@/pages/Inventory'
import { SalesPage } from '@/pages/Sales'
import { ReportsPage } from '@/pages/Reports'

function RequireAuth({ children }: { children: React.ReactNode }) {
  return getToken() ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <Routes>
        {/* Public landing page */}
        <Route path="/"           element={<LandingPage />} />
        <Route path="/login"      element={<LoginPage />} />
        <Route path="/forgot-pin" element={<ForgotPinPage />} />
        <Route path="/reset-pin"  element={<ResetPinPage />} />
        {/* Protected portal */}
        <Route
          element={
            <RequireAuth>
              <AppShell />
            </RequireAuth>
          }
        >
          <Route path="/dashboard"  element={<DashboardPage />} />
          <Route path="/inventory"  element={<InventoryPage />} />
          <Route path="/sales"      element={<SalesPage />} />
          <Route path="/reports"    element={<ReportsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
