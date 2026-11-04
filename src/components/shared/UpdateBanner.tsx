import { useState } from 'react'
import { RefreshCw, X } from 'lucide-react'
import { usePwaUpdate } from '@/hooks/usePwaUpdate'

/**
 * Fixed banner that appears at the bottom of the screen when a new app
 * version has been installed in the background. Reassures the user that
 * their data is safe and lets them reload at a convenient moment.
 */
export function UpdateBanner() {
  const { updateReady, applyUpdate } = usePwaUpdate()
  const [dismissed, setDismissed] = useState(false)

  if (!updateReady || dismissed) return null

  return (
    <div className="fixed bottom-4 inset-x-4 z-[200] flex justify-center pointer-events-none">
      <div className="w-full max-w-sm bg-slate-900 text-white rounded-2xl shadow-2xl px-4 py-3 flex items-center gap-3 pointer-events-auto border border-white/10">
        <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center shrink-0">
          <RefreshCw className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold leading-tight">Update Ready</p>
          <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
            All your data is safe — just reload to apply.
          </p>
        </div>
        <button
          onClick={applyUpdate}
          className="shrink-0 h-8 px-3 bg-red-600 hover:bg-red-700 rounded-lg text-[12px] font-bold transition-colors whitespace-nowrap"
        >
          Reload
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
          aria-label="Dismiss update notification"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
