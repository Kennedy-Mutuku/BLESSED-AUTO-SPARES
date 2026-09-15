import { create } from 'zustand'

interface UiStore {
  menuOpen: boolean
  darkMode: boolean
  setMenuOpen: (open: boolean) => void
  toggleDarkMode: () => void
  setDarkMode: (dark: boolean) => void
}

export const useUiStore = create<UiStore>((set) => ({
  menuOpen: false,
  darkMode: false,
  setMenuOpen: (open) => set({ menuOpen: open }),
  toggleDarkMode: () =>
    set((state) => {
      const next = !state.darkMode
      document.documentElement.classList.toggle('dark', next)
      return { darkMode: next }
    }),
  setDarkMode: (dark) => {
    document.documentElement.classList.toggle('dark', dark)
    set({ darkMode: dark })
  },
}))
