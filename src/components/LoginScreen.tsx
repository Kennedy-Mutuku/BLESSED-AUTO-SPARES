/**
 * Account setup — links this device to the cloud via email + app PIN.
 * Falls back to local-only save if the server is not yet configured/reachable.
 */
import { useState, useEffect } from 'react'
import { db } from '@/db/database'
import { api } from '@/lib/api'
import { SYNC_CONFIGURED } from '@/hooks/useSyncStatus'

async function getLocalData() {
  const [shopRow, pinRow] = await Promise.all([
    db.settings.get('shopName'),
    db.settings.get('appPin'),
  ])
  return {
    shopName: shopRow?.value ?? 'Blessed Auto Spares',
    pin:      pinRow?.value  ?? '1234',
  }
}

type Step = 'form' | 'done'

export function LoginScreen({ onAuth }: { onAuth: () => void }) {
  const [step, setStep]           = useState<Step>('form')
  const [shopName, setShopName]   = useState('')
  const [email, setEmail]         = useState('')
  const [appPin, setAppPin]       = useState('1234')
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')

  useEffect(() => {
    getLocalData().then(({ shopName, pin }) => {
      setShopName(shopName)
      setAppPin(pin)
    })
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) { setError('Please enter your email address.'); return }
    setSaving(true)
    setError('')

    try {
      // Always save email + shopName locally first
      await db.settings.bulkPut([
        { key: 'authEmail', value: email.trim().toLowerCase() },
        { key: 'shopName',  value: shopName.trim() },
      ])

      // If a real server is configured, try to register/login to get a JWT token
      if (SYNC_CONFIGURED) {
        try {
          let token: string | null = null

          try {
            // New user: register
            const res = await api.post<{ token: string }>(
              '/api/auth/register',
              { shopName: shopName.trim(), email: email.trim().toLowerCase(), pin: appPin },
              false,
            )
            token = res.token
          } catch (regErr: any) {
            if (regErr.message?.includes('already exists')) {
              // Email already registered — log in instead
              const res = await api.post<{ token: string }>(
                '/api/auth/login',
                { email: email.trim().toLowerCase(), pin: appPin },
                false,
              )
              token = res.token
            } else {
              throw regErr
            }
          }

          if (token) {
            await db.settings.put({ key: 'authToken', value: token })
          }
        } catch (serverErr: any) {
          // Server unreachable or PIN mismatch — email saved locally, sync won't work yet.
          // Don't block the user; they can still use the app offline.
          console.warn('Cloud link failed:', serverErr.message)
        }
      }

      setStep('done')
      setTimeout(onAuth, 1800)
    } catch {
      setError('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function snooze() {
    await db.settings.put({
      key:   'cloudLinkSnoozedUntil',
      value: String(Date.now() + 24 * 60 * 60 * 1000),
    })
    onAuth()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-sm overflow-hidden">

        {/* ── Header ── */}
        <div className={`px-6 py-6 flex flex-col items-center gap-2 transition-colors duration-500 ${
          step === 'done'
            ? 'bg-gradient-to-br from-emerald-600 to-green-700'
            : 'bg-gradient-to-br from-red-600 to-red-700'
        }`}>
          <div className="w-12 h-12 rounded-full bg-white/15 flex items-center justify-center mb-1">
            {step === 'done' ? (
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            )}
          </div>
          <h2 className="text-white font-black text-lg text-center">
            {step === 'form' ? 'Link Your Cloud Account' : 'Account Linked!'}
          </h2>
          <p className="text-white/70 text-xs text-center leading-relaxed">
            {step === 'form'
              ? 'Sync your data across devices and keep a cloud backup'
              : 'Your account is saved and sync is enabled'}
          </p>
        </div>

        {/* ── Step 1: Form ── */}
        {step === 'form' && (
          <form onSubmit={handleSave} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Shop Name</label>
              <input
                type="text"
                value={shopName}
                onChange={e => setShopName(e.target.value)}
                required
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Your Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError('') }}
                placeholder="you@example.com"
                autoCapitalize="none"
                autoCorrect="off"
                required
                className={inputCls}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 font-medium flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full h-12 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-[15px] shadow-md transition-all disabled:opacity-60 touch-manipulation flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Connecting…
                </>
              ) : 'Save & Enable Sync'}
            </button>

            <button
              type="button"
              onClick={snooze}
              className="w-full text-center text-sm text-slate-400 hover:text-slate-600 transition-colors py-1"
            >
              Remind me later
            </button>
          </form>
        )}

        {/* ── Step 2: Done ── */}
        {step === 'done' && (
          <div className="p-6 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-9 h-9 text-green-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-center space-y-1">
              <p className="text-slate-800 font-black text-base">{email}</p>
              <p className="text-slate-400 text-sm">Account saved</p>
            </div>
            <button
              onClick={onAuth}
              className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[15px] shadow-md transition-all touch-manipulation"
            >
              Continue to App
            </button>
          </div>
        )}

      </div>
    </div>
  )
}

const inputCls = 'w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition bg-slate-50 focus:bg-white'
