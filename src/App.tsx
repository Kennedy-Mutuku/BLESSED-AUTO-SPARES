import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppShell } from '@/components/layout/AppShell'
import { DashboardPage } from '@/pages/Dashboard'
import { InventoryPage } from '@/pages/Inventory'
import { POSPage } from '@/pages/POS'
import { SalesLogPage } from '@/pages/SalesLog'
import { StockAlertsPage } from '@/pages/StockAlerts'
import { ReportsPage } from '@/pages/Reports'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      retry: 1,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/pos" element={<POSPage />} />
            <Route path="/sales" element={<SalesLogPage />} />
            <Route path="/alerts" element={<StockAlertsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
