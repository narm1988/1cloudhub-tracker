import { createContext, useContext, useState } from 'react'
import { SIDEBAR_THEMES, DEFAULT_THEME_ID } from '../lib/themes'
import type { SidebarTheme } from '../lib/themes'

const STORAGE_KEY = 'tracker-sidebar-theme'

interface ThemeContextType {
  theme: SidebarTheme
  setThemeId: (id: string) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeIdState] = useState(
    () => localStorage.getItem(STORAGE_KEY) || DEFAULT_THEME_ID
  )

  function setThemeId(id: string) {
    setThemeIdState(id)
    localStorage.setItem(STORAGE_KEY, id)
  }

  const theme = SIDEBAR_THEMES.find((t) => t.id === themeId) || SIDEBAR_THEMES[0]

  return (
    <ThemeContext.Provider value={{ theme, setThemeId }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used within ThemeProvider')
  return context
}
