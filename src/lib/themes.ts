export interface SidebarTheme {
  id: string
  name: string
  bg: string
}

export const SIDEBAR_THEMES: SidebarTheme[] = [
  { id: 'midnight', name: 'Midnight', bg: '#14171F' },
  { id: 'ocean', name: 'Ocean', bg: '#0B2A43' },
  { id: 'forest', name: 'Forest', bg: '#0F3D2E' },
  { id: 'plum', name: 'Plum', bg: '#2E1065' },
  { id: 'slate', name: 'Slate', bg: '#1F2937' },
  { id: 'crimson', name: 'Crimson', bg: '#3B0D14' },
]

export const DEFAULT_THEME_ID = 'midnight'
