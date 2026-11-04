import { useState, useEffect } from 'react'
import { Settings, Plus, Pencil, Trash2, Download, Upload, Moon, Sun, Lock, ChevronRight, CheckCircle2, Mail, LogOut } from 'lucide-react'
import { useSettings, useUpdateSettings } from '@/hooks/useLocalSettings'
import { useCategories, useAddCategory, useUpdateCategory, useDeleteCategory } from '@/hooks/useCategories'
import { useUiStore } from '@/store/uiStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PageHeader } from '@/components/shared/PageHeader'
import { db } from '@/db/database'
import { downloadJSON } from '@/lib/exportHelpers'
import { seedDemoData } from '@/lib/seedData'
import type { Category } from '@/db/schema'
import toast from 'react-hot-toast'
import { useQuery, useQueryClient } from '@tanstack/react-query'

const DEFAULT_PIN = '1234'

// ── PIN-change modal ──────────────────────────────────────────────────────────

type PinStep = 'current' | 'new' | 'confirm' | 'success'

const STEP_INFO: Record<PinStep, { title: string; subtitle: string }> = {
  current: { title: 'Enter Current PIN',  subtitle: 'Verify your identity first' },
  new:     { title: 'Enter New PIN',      subtitle: 'Choose a 4-digit PIN'        },
  confirm: { title: 'Confirm New PIN',    subtitle: 'Re-enter your new PIN'       },
  success: { title: 'PIN Updated!',       subtitle: 'Your new PIN is now active'  },
}

function PinChangeModal({ correctPin, onClose }: { correctPin: string; onClose: () => void }) {
  const qc = useQueryClient()
  const [step, setStep] = useState<PinStep>('current')
  const [input, setInput] = useState('')
  const [newPin, setNewPin] = useState('')
  const [shake, setShake] = useState(false)
  const [pinError, setPinError] = useState('')

  function triggerShake(msg: string) {
    setShake(true)
    setPinError(msg)
    setTimeout(() => {
      setInput('')
      setShake(false)
      setPinError('')
    }, 650)
  }

  function press(digit: string) {
    if (shake || step === 'success') return
    const next = input + digit
    if (next.length > 4) return
    setInput(next)
    setPinError('')

    if (next.length < 4) return

    setTimeout(() => {
      if (step === 'current') {
        if (next === correctPin) {
          setInput('')
          setStep('new')
        } else {
          triggerShake('Incorrect PIN. Try again.')
        }
      } else if (step === 'new') {
        setNewPin(next)
        setInput('')
        setStep('confirm')
      } else if (step === 'confirm') {
        if (next === newPin) {
          db.settings.put({ key: 'appPin', value: newPin }).then(() => {
            qc.invalidateQueries({ queryKey: ['settings'] })
            setInput('')
            setStep('success')
            setTimeout(onClose, 1800)
          })
        } else {
          triggerShake("PINs don't match. Try again.")
          setTimeout(() => {
            setNewPin('')
            setInput('')
            setStep('new')
          }, 750)
        }
      }
    }, 180)
  }

  function delDigit() {
    if (shake || step === 'success') return
    setInput(p => p.slice(0, -1))
    setPinError('')
  }

  const stepIndex = { current: 0, new: 1, confirm: 2, success: 3 }[step]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">

        {/* Modal header */}
        <div className="bg-red-600 px-6 py-5 flex flex-col items-center gap-1">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-1">
            {step === 'success'
              ? <CheckCircle2 className="w-7 h-7 text-white" />
              : <Lock className="w-6 h-6 text-white" />
            }
          </div>
          <h2 className="text-white font-bold text-lg">{STEP_INFO[step].title}</h2>
          <p className="text-red-100 text-xs">{STEP_INFO[step].subtitle}</p>
        </div>

        {/* Step progress */}
        {step !== 'success' && (
          <div className="flex justify-center gap-2 pt-5 px-6">
            {(['current', 'new', 'confirm'] as const).map((s, i) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i < stepIndex ? 'flex-1 bg-red-400' :
                  i === stepIndex ? 'flex-[1.5] bg-red-600' :
                  'flex-1 bg-gray-200'
                }`}
              />
            ))}
          </div>
        )}

        {/* Success screen */}
        {step === 'success' ? (
          <div className="flex flex-col items-center gap-3 py-10 px-6">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-9 h-9 text-green-500" />
            </div>
            <p className="text-slate-700 font-semibold text-center">PIN changed successfully!</p>
            <p className="text-slate-400 text-sm text-center">Use your new PIN next time you log in.</p>
          </div>
        ) : (
          <div className="px-6 pb-6 pt-5 flex flex-col gap-5">
            {/* PIN dots */}
            <div className="flex justify-center">
              <div className={`flex gap-4 ${shake ? 'animate-pin-shake' : ''}`}>
                {[0, 1, 2, 3].map(i => (
                  <div
                    key={i}
                    className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                      input.length > i
                        ? pinError ? 'bg-red-500 border-red-500' : 'bg-red-600 border-red-600'
                        : 'bg-transparent border-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="min-h-[16px] -mt-2 text-center">
              {pinError && <p className="text-xs text-red-500 font-medium">{pinError}</p>}
            </div>

            {/* Numpad */}
            <div className="grid grid-cols-3 gap-2.5">
              {['1','2','3','4','5','6','7','8','9'].map(d => (
                <button
                  key={d}
                  onClick={() => press(d)}
                  className="h-14 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 text-xl font-semibold hover:bg-red-50 hover:border-red-200 active:bg-red-100 transition-colors touch-manipulation"
                >
                  {d}
                </button>
              ))}
              <div />
              <button
                onClick={() => press('0')}
                className="h-14 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 text-xl font-semibold hover:bg-red-50 hover:border-red-200 active:bg-red-100 transition-colors touch-manipulation"
              >
                0
              </button>
              <button
                onClick={delDigit}
                className="h-14 rounded-xl bg-gray-50 border border-gray-200 text-gray-500 flex items-center justify-center hover:bg-red-50 hover:border-red-200 active:bg-red-100 transition-colors touch-manipulation"
                aria-label="Delete digit"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l-7-7 7-7M19 19l-7-7 7-7" />
                </svg>
              </button>
            </div>

            <button
              onClick={onClose}
              className="text-center text-sm text-slate-400 hover:text-slate-600 transition-colors py-1"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pin-shake {
          0%, 100% { transform: translateX(0); }
          15%       { transform: translateX(-8px); }
          30%       { transform: translateX(8px); }
          45%       { transform: translateX(-6px); }
          60%       { transform: translateX(6px); }
          75%       { transform: translateX(-4px); }
          90%       { transform: translateX(4px); }
        }
        .animate-pin-shake { animation: pin-shake 0.55s ease-in-out; }
      `}</style>
    </div>
  )
}

const COLOR_PRESETS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#6b7280']

export function SettingsPage() {
  const { data: settings, isLoading } = useSettings()
  const updateSettings = useUpdateSettings()
  const { data: categories = [] } = useCategories()
  const addCategoryMutation = useAddCategory()
  const updateCategoryMutation = useUpdateCategory()
  const deleteCategoryMutation = useDeleteCategory()
  const { darkMode, toggleDarkMode } = useUiStore()
  const qc = useQueryClient()

  const [form, setForm] = useState<Record<string, string>>({})
  const [newCatName, setNewCatName] = useState('')
  const [newCatColor, setNewCatColor] = useState('#3b82f6')
  const [editCat, setEditCat] = useState<Category | null>(null)
  const [showPinModal, setShowPinModal] = useState(false)
  const [editingEmail, setEditingEmail] = useState(false)
  const [emailInput, setEmailInput] = useState('')

  const { data: savedEmail } = useQuery({
    queryKey: ['settings', 'authEmail'],
    queryFn: async () => {
      const row = await db.settings.get('authEmail')
      return row?.value ?? ''
    },
  })

  async function handleSaveEmail() {
    const trimmed = emailInput.trim().toLowerCase()
    if (!trimmed) return toast.error('Please enter a valid email')
    await db.settings.put({ key: 'authEmail', value: trimmed })
    qc.invalidateQueries({ queryKey: ['settings', 'authEmail'] })
    setEditingEmail(false)
    setEmailInput('')
    toast.success('Email updated')
  }

  async function handleSignOut() {
    if (!confirm('Sign out? You will need to enter your PIN to get back in.')) return
    await db.settings.bulkDelete(['authEmail', 'authToken'])
    qc.invalidateQueries({ queryKey: ['settings', 'authEmail'] })
    window.dispatchEvent(new CustomEvent('app:lock'))
    toast.success('Signed out')
  }

  const { data: storedPin } = useQuery({
    queryKey: ['settings', 'appPin'],
    queryFn: async () => {
      const row = await db.settings.get('appPin')
      return row?.value ?? DEFAULT_PIN
    },
  })
  const correctPin = storedPin ?? DEFAULT_PIN

  useEffect(() => {
    if (settings) setForm(settings)
  }, [settings])

  async function handleSaveShop(e: React.FormEvent) {
    e.preventDefault()
    await updateSettings.mutateAsync(form)
    toast.success('Settings saved')
  }

  async function handleAddCategory() {
    if (!newCatName.trim()) return toast.error('Category name required')
    await addCategoryMutation.mutateAsync({ name: newCatName.trim(), colorHex: newCatColor, icon: '' })
    setNewCatName('')
    toast.success('Category added')
  }

  async function handleDeleteCategory(cat: Category) {
    if (!confirm(`Delete category "${cat.name}"?`)) return
    await deleteCategoryMutation.mutateAsync(cat.id)
    toast.success('Category deleted')
  }

  async function handleExportBackup() {
    const [products, categories, sales, stockHistory, settingsRows] = await Promise.all([
      db.products.toArray(),
      db.categories.toArray(),
      db.sales.toArray(),
      db.stockHistory.toArray(),
      db.settings.toArray(),
    ])
    downloadJSON({ products, categories, sales, stockHistory, settings: settingsRows, exportedAt: Date.now() }, `blessed-backup-${Date.now()}.json`)
    toast.success('Backup downloaded')
  }

  async function handleImportBackup(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      if (!confirm('This will overwrite all current data. Are you sure?')) return
      await db.transaction('rw', db.products, db.categories, db.sales, db.stockHistory, db.settings, async () => {
        if (data.products) await db.products.bulkPut(data.products)
        if (data.categories) await db.categories.bulkPut(data.categories)
        if (data.sales) await db.sales.bulkPut(data.sales)
        if (data.stockHistory) await db.stockHistory.bulkPut(data.stockHistory)
        if (data.settings) await db.settings.bulkPut(data.settings)
      })
      toast.success('Backup restored! Reload the page.')
    } catch {
      toast.error('Invalid backup file')
    }
    e.target.value = ''
  }

  if (isLoading) return <div className="p-4 text-slate-400">Loading...</div>

  return (
    <div className="flex flex-col min-h-screen p-4 pb-8">
      <PageHeader title="Settings" backTo="/" />

      <div className="space-y-6">

        {/* ── Account ── */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
          <div className="px-4 pt-3 pb-1">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Account</p>
          </div>

          {/* Email row */}
          <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">Email Address</p>
                <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                  {savedEmail || 'Not set'}
                </p>
              </div>
              <button
                onClick={() => { setEditingEmail(true); setEmailInput(savedEmail ?? '') }}
                className="text-[12px] font-semibold text-red-600 hover:text-red-700 transition-colors px-2 py-1"
              >
                {savedEmail ? 'Change' : 'Add'}
              </button>
            </div>

            {editingEmail && (
              <div className="mt-3 space-y-2">
                <input
                  type="email"
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  placeholder="new@email.com"
                  autoCapitalize="none"
                  autoCorrect="off"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent bg-slate-50 focus:bg-white transition"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => { setEditingEmail(false); setEmailInput('') }}
                    className="flex-1 h-9 rounded-lg border border-slate-200 text-[12px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEmail}
                    className="flex-1 h-9 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[12px] font-bold transition-colors"
                  >
                    Save Email
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sign out */}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 border-t border-slate-100 dark:border-slate-700 hover:bg-red-50 dark:hover:bg-red-900/20 active:bg-red-100 transition-colors text-left"
          >
            <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center shrink-0">
              <LogOut className="w-4 h-4 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-semibold text-red-600 dark:text-red-400">Sign Out</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Clears account &amp; locks the app</p>
            </div>
          </button>
        </div>

        {/* Security — Change PIN */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
          <div className="px-4 pt-3 pb-1">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Security</p>
          </div>
          <button
            onClick={() => setShowPinModal(true)}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 active:bg-slate-100 transition-colors text-left"
          >
            <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-semibold text-slate-800 dark:text-slate-200">Change App PIN</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Update your 4-digit access PIN</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
          </button>
        </div>

        {/* Dark Mode Toggle */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {darkMode ? <Moon className="h-4 w-4 text-blue-400" /> : <Sun className="h-4 w-4 text-amber-500" />}
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Dark Mode</span>
            </div>
            <button
              onClick={toggleDarkMode}
              className={`relative w-11 h-6 rounded-full transition-colors ${darkMode ? 'bg-blue-600' : 'bg-slate-200'}`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${darkMode ? 'translate-x-5' : ''}`}
              />
            </button>
          </div>
        </div>

        {/* Shop Profile */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
            <Settings className="h-4 w-4" /> Shop Profile
          </h3>
          <form onSubmit={handleSaveShop} className="space-y-3">
            {[
              { key: 'shopName', label: 'Shop Name' },
              { key: 'shopPhone', label: 'Phone Number' },
              { key: 'shopAddress', label: 'Address' },
              { key: 'operatorName', label: 'Operator / Cashier Name' },
              { key: 'currencySymbol', label: 'Currency Symbol' },
              { key: 'defaultReorderLevel', label: 'Default Reorder Level', type: 'number' },
              { key: 'receiptFooter', label: 'Receipt Footer Message' },
            ].map(({ key, label, type }) => (
              <div key={key} className="space-y-1">
                <Label>{label}</Label>
                <Input
                  type={type ?? 'text'}
                  value={form[key] ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                />
              </div>
            ))}
            <Button type="submit" className="w-full" disabled={updateSettings.isPending}>
              Save Settings
            </Button>
          </form>
        </div>

        {/* Category Manager */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Categories</h3>

          <div className="flex gap-2 mb-3">
            <Input
              placeholder="New category name"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="flex-1"
            />
            <div className="flex gap-1">
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c}
                  className={`w-6 h-6 rounded-full border-2 transition-all ${newCatColor === c ? 'border-slate-900 dark:border-white scale-110' : 'border-transparent'}`}
                  style={{ background: c }}
                  onClick={() => setNewCatColor(c)}
                />
              ))}
            </div>
            <Button size="icon" onClick={handleAddCategory}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            {categories.map((cat) => (
              <div key={cat.id} className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 dark:bg-slate-700">
                <div className="w-4 h-4 rounded-full shrink-0" style={{ background: cat.colorHex }} />
                {editCat?.id === cat.id ? (
                  <Input
                    className="flex-1 h-7 text-sm"
                    value={editCat.name}
                    onChange={(e) => setEditCat({ ...editCat, name: e.target.value })}
                    onBlur={async () => {
                      await updateCategoryMutation.mutateAsync({ id: cat.id, name: editCat.name })
                      setEditCat(null)
                    }}
                    autoFocus
                  />
                ) : (
                  <span className="flex-1 text-sm text-slate-700 dark:text-slate-300">{cat.name}</span>
                )}
                <Button variant="ghost" size="icon-sm" onClick={() => setEditCat(cat)}>
                  <Pencil className="h-3.5 w-3.5 text-blue-500" />
                </Button>
                <Button variant="ghost" size="icon-sm" onClick={() => handleDeleteCategory(cat)}>
                  <Trash2 className="h-3.5 w-3.5 text-red-500" />
                </Button>
              </div>
            ))}
            {categories.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-3">No categories yet</p>
            )}
          </div>
        </div>

        {/* Data Management */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Data Management</h3>
          <div className="space-y-2">
            <Button
              variant="secondary"
              className="w-full justify-start"
              onClick={async () => {
                if (!confirm('Load 12 demo products and 5 categories? Existing data is preserved.')) return
                const result = await seedDemoData()
                qc.invalidateQueries()
                toast.success(`Loaded ${result.products} products & ${result.categories} categories`)
              }}
            >
              Load Demo Data
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={handleExportBackup}>
              <Download className="h-4 w-4" /> Export Full Backup (JSON)
            </Button>
            <label className="block">
              <input type="file" accept=".json" className="hidden" onChange={handleImportBackup} />
              <Button variant="outline" className="w-full justify-start" asChild>
                <span>
                  <Upload className="h-4 w-4" /> Import Backup
                </span>
              </Button>
            </label>
          </div>
        </div>
      </div>

      {showPinModal && (
        <PinChangeModal
          correctPin={correctPin}
          onClose={() => setShowPinModal(false)}
        />
      )}
    </div>
  )
}
