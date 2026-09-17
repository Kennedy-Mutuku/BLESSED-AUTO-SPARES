import { useState, useEffect } from 'react'
import { Settings, Plus, Pencil, Trash2, Download, Upload, Moon, Sun } from 'lucide-react'
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
import { useQueryClient } from '@tanstack/react-query'

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
    </div>
  )
}
