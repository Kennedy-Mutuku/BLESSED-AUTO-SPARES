import { Outlet } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

export function AppShell() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <main className="max-w-2xl mx-auto min-h-screen">
        <Outlet />
      </main>
      <Toaster
        position="bottom-center"
        toastOptions={{
          className: 'dark:bg-slate-800 dark:text-slate-100',
          duration: 3000,
        }}
      />
    </div>
  )
}
