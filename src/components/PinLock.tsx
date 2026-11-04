import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { db } from '@/db/database'
import { api } from '@/lib/api'

const DEFAULT_PIN = '1234'

// ── Forgot-PIN modal ──────────────────────────────────────────────────────────

function ForgotPinModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail]       = useState('')
  const [status, setStatus]     = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')
  const [errMsg, setErrMsg]     = useState('')

  async function send(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setErrMsg('')
    try {
      await api.post('/api/auth/forgot-pin', { email }, false)
      setStatus('sent')
    } catch (err: any) {
      setErrMsg(err.message || 'Failed to send email')
      setStatus('error')
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">

        <div className="bg-red-600 px-6 py-5 flex flex-col items-center gap-1">
          <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center mb-1">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-white font-bold text-lg">Forgot PIN?</h2>
          <p className="text-red-100 text-xs text-center">We'll email you a reset link</p>
        </div>

        {status === 'sent' ? (
          <div className="flex flex-col items-center gap-3 py-10 px-6">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-slate-700 font-semibold text-center">Email sent!</p>
            <p className="text-slate-400 text-sm text-center">
              Check your inbox for a PIN reset link. It expires in 15 minutes.
            </p>
            <button
              onClick={onClose}
              className="mt-2 w-full h-11 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700 transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={send} className="p-6 space-y-4">
            <p className="text-slate-500 text-sm leading-relaxed">
              Enter the email address linked to your account and we'll send a secure reset link.
            </p>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-red-400 transition"
            />
            {status === 'error' && (
              <p className="text-xs text-red-500 font-medium">{errMsg}</p>
            )}
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full h-11 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
            >
              {status === 'loading' && (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {status === 'loading' ? 'Sending…' : 'Send Reset Link'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full text-center text-sm text-slate-400 hover:text-slate-600 transition-colors py-1"
            >
              Cancel
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

// ── PinLock ───────────────────────────────────────────────────────────────────

export function PinLock({ onUnlock }: { onUnlock: () => void }) {
  const [pin, setPin]           = useState('')
  const [shake, setShake]       = useState(false)
  const [error, setError]       = useState(false)
  const [showForgot, setShowForgot] = useState(false)

  const { data: storedPin, isLoading } = useQuery({
    queryKey: ['settings', 'appPin'],
    queryFn: async () => {
      const row = await db.settings.get('appPin')
      return row?.value ?? DEFAULT_PIN
    },
  })

  const correctPin = storedPin ?? DEFAULT_PIN

  function press(digit: string) {
    if (isLoading || pin.length >= 4) return
    const next = pin + digit
    setPin(next)
    setError(false)
    if (next.length === 4) {
      if (next === correctPin) {
        setTimeout(onUnlock, 200)
      } else {
        setShake(true)
        setError(true)
        setTimeout(() => { setPin(''); setShake(false) }, 600)
      }
    }
  }

  function del() {
    if (isLoading) return
    setPin(p => p.slice(0, -1))
    setError(false)
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-80 flex flex-col items-center gap-6">

          {/* Logo / title */}
          <div className="flex flex-col items-center gap-1">
            <div className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center mb-1">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C8.134 2 5 5.134 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.866-3.134-7-7-7z" />
                <circle cx="12" cy="9" r="2.5" fill="white" stroke="none" />
              </svg>
            </div>
            <h1 className="text-lg font-bold text-gray-800">Blessed Auto Spares</h1>
            <p className="text-sm text-gray-500">
              {isLoading ? 'Loading…' : 'Enter PIN to continue'}
            </p>
          </div>

          {/* PIN dots */}
          <div
            className={`flex gap-4 ${shake ? 'animate-shake' : ''}`}
            style={shake ? { animation: 'shake 0.5s ease-in-out' } : {}}
          >
            {[0, 1, 2, 3].map(i => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full border-2 transition-all ${
                  pin.length > i
                    ? error ? 'bg-red-500 border-red-500' : 'bg-red-600 border-red-600'
                    : 'bg-transparent border-gray-300'
                }`}
              />
            ))}
          </div>

          {error && (
            <p className="text-xs text-red-500 -mt-3 font-medium">Incorrect PIN. Try again.</p>
          )}

          {/* Numpad */}
          <div className="grid grid-cols-3 gap-3 w-full">
            {['1','2','3','4','5','6','7','8','9'].map(d => (
              <button
                key={d}
                onClick={() => press(d)}
                disabled={isLoading}
                className="h-14 rounded-xl bg-gray-100 text-gray-800 text-xl font-semibold hover:bg-red-50 active:bg-red-100 transition-colors disabled:opacity-40"
              >
                {d}
              </button>
            ))}
            <div />
            <button
              onClick={() => press('0')}
              disabled={isLoading}
              className="h-14 rounded-xl bg-gray-100 text-gray-800 text-xl font-semibold hover:bg-red-50 active:bg-red-100 transition-colors disabled:opacity-40"
            >
              0
            </button>
            <button
              onClick={del}
              disabled={isLoading}
              className="h-14 rounded-xl bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-red-50 active:bg-red-100 transition-colors disabled:opacity-40"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l-7-7 7-7M19 19l-7-7 7-7" />
              </svg>
            </button>
          </div>

          {/* Forgot PIN */}
          <button
            type="button"
            onClick={() => setShowForgot(true)}
            className="text-xs text-slate-400 hover:text-red-500 transition-colors font-medium -mt-2"
          >
            Forgot PIN?
          </button>

        </div>

        <style>{`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            15% { transform: translateX(-8px); }
            30% { transform: translateX(8px); }
            45% { transform: translateX(-6px); }
            60% { transform: translateX(6px); }
            75% { transform: translateX(-4px); }
            90% { transform: translateX(4px); }
          }
          .animate-shake { animation: shake 0.5s ease-in-out; }
        `}</style>
      </div>

      {showForgot && <ForgotPinModal onClose={() => setShowForgot(false)} />}
    </>
  )
}
