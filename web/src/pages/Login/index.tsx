import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, saveAuth } from '@/lib/api'

type Mode = 'signin' | 'register'

interface AuthResult {
  token: string
  user: { id: string; shopName: string; email: string }
}

// ── 4-digit PIN input ─────────────────────────────────────────────────────────

function PinInput({
  value,
  onChange,
  error,
}: {
  value: string
  onChange: (v: string) => void
  error?: boolean
}) {
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  function handleChange(i: number, e: React.ChangeEvent<HTMLInputElement>) {
    const digit = e.target.value.replace(/\D/g, '').slice(-1)
    const arr   = value.padEnd(4, ' ').split('')
    arr[i]      = digit || ' '
    const next  = arr.join('').trimEnd()
    onChange(next)
    if (digit && i < 3) inputs.current[i + 1]?.focus()
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace') {
      if (!value[i] && i > 0) {
        inputs.current[i - 1]?.focus()
        const arr = value.padEnd(4, ' ').split('')
        arr[i - 1] = ' '
        onChange(arr.join('').trimEnd())
      } else {
        const arr = value.padEnd(4, ' ').split('')
        arr[i] = ' '
        onChange(arr.join('').trimEnd())
      }
    }
    if (e.key === 'ArrowLeft' && i > 0) inputs.current[i - 1]?.focus()
    if (e.key === 'ArrowRight' && i < 3) inputs.current[i + 1]?.focus()
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault()
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4)
    onChange(digits)
    inputs.current[Math.min(digits.length, 3)]?.focus()
  }

  return (
    <div className="flex gap-3 justify-center">
      {[0, 1, 2, 3].map(i => (
        <input
          key={i}
          ref={el => { inputs.current[i] = el }}
          type="password"
          inputMode="numeric"
          maxLength={1}
          value={value[i] && value[i] !== ' ' ? value[i] : ''}
          onChange={e => handleChange(i, e)}
          onKeyDown={e => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onClick={() => inputs.current[i]?.select()}
          className={`w-14 h-14 text-center text-2xl font-black rounded-xl border-2 transition-all focus:outline-none
            ${error
              ? 'border-red-400 bg-red-50 text-red-600'
              : value[i] && value[i] !== ' '
                ? 'border-red-500 bg-red-50 text-red-700'
                : 'border-slate-200 bg-slate-50 text-slate-800 focus:border-red-400 focus:bg-white'
            }`}
        />
      ))}
    </div>
  )
}

// ── Login page ────────────────────────────────────────────────────────────────

export function LoginPage() {
  const navigate                = useNavigate()
  const [mode, setMode]         = useState<Mode>('signin')
  const [shopName, setShopName] = useState('')
  const [email, setEmail]       = useState('')
  const [pin, setPin]           = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [pinError, setPinError] = useState(false)

  // Auto-focus first PIN box when switching to signin
  const emailRef = useRef<HTMLInputElement>(null)
  useEffect(() => { emailRef.current?.focus() }, [mode])

  function switchMode(m: Mode) {
    setMode(m)
    setPin('')
    setError('')
    setPinError(false)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (pin.trim().length < 4) {
      setPinError(true)
      setError('Please enter all 4 PIN digits')
      return
    }
    setError('')
    setPinError(false)
    setLoading(true)
    try {
      const path   = mode === 'signin' ? '/api/auth/login' : '/api/auth/register'
      const body   = mode === 'signin'
        ? { email, pin }
        : { shopName, email, pin }
      const result = await api.post<AuthResult>(path, body, false)
      saveAuth(result.token, result.user)
      navigate('/dashboard', { replace: true })
    } catch (err: any) {
      const msg = err.message || 'Something went wrong'
      setError(msg)
      if (msg.includes('PIN') || msg.includes('pin') || msg.includes('Invalid')) {
        setPinError(true)
        setPin('')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-950 to-slate-900 flex">

      {/* ── Left panel — brand (lg+) ── */}
      <div className="hidden lg:flex flex-col justify-between w-[48%] p-14 relative overflow-hidden select-none">
        {/* Decorative rings */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full border border-white/5" />
        <div className="absolute -top-16 -left-16 w-80 h-80 rounded-full border border-white/5" />
        <div className="absolute bottom-10 right-0 w-64 h-64 rounded-full border border-white/5" />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-red-600 flex items-center justify-center shadow-xl shadow-red-900/40">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <p className="text-white font-black text-lg leading-tight tracking-wide">Blessed Auto Spares</p>
              <p className="text-red-400/60 text-[10px] uppercase tracking-widest font-semibold">Web Portal</p>
            </div>
          </div>
        </div>

        {/* Hero text */}
        <div className="relative z-10 space-y-8">
          <div>
            <h1 className="text-[52px] font-black text-white leading-[1.1] tracking-tight">
              Blessed Auto<br />
              <span className="text-red-400">Spares.</span>
            </h1>
            <p className="text-slate-400 mt-4 text-base leading-relaxed max-w-sm">
              Sondu Nyamira's trusted source for genuine auto parts &amp; accessories.
              Filters, oils, brakes, engine &amp; electrical parts for Toyota, Nissan, Mitsubishi and more.
            </p>
            <div className="flex items-center gap-2 mt-4">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
              <span className="text-slate-500 text-xs">Sondu, Nyamira County — Kenya</span>
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
              <span className="text-slate-500 text-xs">+254 700 225849</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: '🔧', label: 'Filters & Oils'    },
              { icon: '⚙️',  label: 'Brakes & Engine'  },
              { icon: '☁️',  label: 'Live Inventory'   },
            ].map(f => (
              <div key={f.label} className="bg-white/5 border border-white/8 rounded-2xl p-4 backdrop-blur-sm text-center">
                <div className="text-xl mb-2">{f.icon}</div>
                <div className="text-white/70 text-[11px] font-semibold leading-tight">{f.label}</div>
              </div>
            ))}
          </div>

          <div className="bg-white/5 border border-white/8 rounded-2xl px-5 py-4 backdrop-blur-sm">
            <p className="text-white/60 text-xs leading-relaxed">
              "Quality parts, honest prices. Serving Nyamira County and the greater Kisii region."
            </p>
          </div>
        </div>

        <p className="relative z-10 text-slate-600 text-xs">
          © {new Date().getFullYear()} Blessed Auto Spares · Sondu Nyamira, Kenya
        </p>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-16">
        <div className="w-full max-w-[400px]">

          {/* Mobile logo */}
          <div className="flex flex-col items-center mb-8 lg:hidden">
            <div className="w-14 h-14 rounded-2xl bg-red-600 flex items-center justify-center mb-3 shadow-2xl">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h1 className="text-white text-xl font-black">Blessed Auto Spares</h1>
            <p className="text-red-400/70 text-xs tracking-widest uppercase mt-1">Sondu Nyamira, Kenya</p>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">

            {/* Tab switcher */}
            <div className="grid grid-cols-2 bg-slate-50 border-b border-slate-100">
              {(['signin', 'register'] as Mode[]).map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => switchMode(m)}
                  className={`py-4 text-sm font-semibold transition-all ${
                    mode === m
                      ? 'bg-white text-red-600 border-b-2 border-red-600'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {m === 'signin' ? 'Sign In' : 'Create Account'}
                </button>
              ))}
            </div>

            <form onSubmit={submit} className="p-8 space-y-6">

              <div>
                <h2 className="text-2xl font-black text-slate-900">
                  {mode === 'signin' ? 'Welcome back' : 'Create account'}
                </h2>
                <p className="text-slate-400 text-sm mt-1">
                  {mode === 'signin'
                    ? 'Access your Blessed Auto Spares portal'
                    : 'Link your Blessed Auto Spares app account'}
                </p>
              </div>

              {mode === 'register' && (
                <FormField label="Shop Name">
                  <input
                    type="text"
                    value={shopName}
                    onChange={e => setShopName(e.target.value)}
                    placeholder="Blessed Auto Spares"
                    required
                    className={inputCls}
                  />
                </FormField>
              )}

              <FormField label="Email Address">
                <input
                  ref={emailRef}
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className={inputCls}
                />
              </FormField>

              <FormField label="4-Digit PIN">
                <PinInput value={pin} onChange={v => { setPin(v); setPinError(false); setError('') }} error={pinError} />
                <p className="text-center text-xs text-slate-400 mt-2">
                  {mode === 'signin'
                    ? 'Use the same PIN as your mobile app'
                    : 'Choose a 4-digit PIN — also used in the app'}
                </p>
              </FormField>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 font-medium flex items-start gap-2">
                  <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || pin.replace(/\s/g, '').length < 4}
                className="w-full h-12 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-[15px] shadow-lg shadow-red-600/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    {mode === 'signin' ? 'Signing in…' : 'Creating account…'}
                  </>
                ) : (
                  mode === 'signin' ? 'Sign In →' : 'Create Account →'
                )}
              </button>

              {mode === 'signin' && (
                <p className="text-center text-xs text-slate-400">
                  Forgot PIN?{' '}
                  <a href="#" className="text-red-500 hover:text-red-600 font-semibold"
                     onClick={e => { e.preventDefault(); window.location.href = '/forgot-pin' }}>
                    Reset via email
                  </a>
                </p>
              )}

            </form>
          </div>

          <p className="text-slate-600 text-[11px] text-center mt-5">
            Account created in the app? Sign in with the same email &amp; PIN.
          </p>
        </div>
      </div>
    </div>
  )
}

const inputCls = 'w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition bg-slate-50 focus:bg-white'

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</label>
      {children}
    </div>
  )
}
