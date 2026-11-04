import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/lib/api'

export function ForgotPinPage() {
  const [email, setEmail]   = useState('')
  const [sent, setSent]     = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/api/auth/forgot-pin', { email }, false)
      setSent(true)
    } catch (err: any) {
      setError(err.message || 'Failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-950 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">

        <div className="bg-red-600 px-6 py-7 flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-1">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-white font-black text-xl">Reset Your PIN</h1>
          <p className="text-red-100 text-xs text-center">Enter your email and we'll send a reset link</p>
        </div>

        {sent ? (
          <div className="p-8 flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-slate-700 font-semibold text-center">Email sent!</p>
            <p className="text-slate-400 text-sm text-center leading-relaxed">
              Check your inbox for a PIN reset link. It expires in 15 minutes.
            </p>
            <Link
              to="/login"
              className="mt-2 w-full h-11 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700 transition-colors flex items-center justify-center"
            >
              Back to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="p-8 space-y-5">
            <p className="text-slate-500 text-sm leading-relaxed">
              Enter the email linked to your account and we'll send a secure PIN reset link.
            </p>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-red-400 bg-slate-50 focus:bg-white transition"
              />
            </div>
            {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading && (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {loading ? 'Sending…' : 'Send Reset Link'}
            </button>
            <Link to="/login" className="block text-center text-sm text-slate-400 hover:text-slate-600 transition-colors">
              ← Back to Sign In
            </Link>
          </form>
        )}
      </div>
    </div>
  )
}
