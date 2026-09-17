import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface PageHeaderProps {
  title: string
  subtitle?: string
  backTo?: string
  actions?: React.ReactNode
}

export function PageHeader({ title, subtitle, backTo, actions }: PageHeaderProps) {
  const navigate = useNavigate()
  return (
    // Negative margins break out of the parent p-4 so the header is full-width flush to the top
    <div className="flex items-center gap-3 -mx-4 -mt-4 px-5 py-3 bg-red-600 shadow-md shrink-0">
      {backTo && (
        <button
          onClick={() => navigate(backTo)}
          aria-label="Go back"
          className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center shrink-0 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 text-white" />
        </button>
      )}
      <div className="flex-1 min-w-0">
        <h1 className="text-[17px] font-black text-white uppercase tracking-wide leading-none drop-shadow-sm truncate">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[9px] text-red-100 font-semibold tracking-widest uppercase mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0">
          {actions}
        </div>
      )}
    </div>
  )
}
