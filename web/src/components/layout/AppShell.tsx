import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'

export function AppShell() {
  return (
    <div className="flex min-h-screen bg-slate-100/60">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
        <footer className="px-6 lg:px-8 py-5 mt-4 border-t border-slate-200">
          <p className="text-slate-400 text-xs">
            Blessed Auto Spares · Genuine Parts &amp; Accessories · Sondu, Nyamira County, Kenya · +254 700 225849
          </p>
        </footer>
      </main>
    </div>
  )
}
