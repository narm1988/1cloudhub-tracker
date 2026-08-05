export interface SidebarTheme {
  id: string
  name: string
  bg: string
  textActive: string
  textInactive: string
  textHover: string
  activeBg: string
  hoverBg: string
  subText: string
  borderColor: string
  accent: string
  blobs: [string, string]
  blend: 'screen' | 'multiply'
  particle: 'stars' | 'embers' | 'dust'
  particleColor: string
  particleColor2?: string
}

export const SIDEBAR_THEMES: SidebarTheme[] = [
  {
    id: 'midnight',
    name: 'Midnight',
    bg: '#14171F',
    textActive: '#FFFFFF',
    textInactive: '#9CA3AF',
    textHover: '#FFFFFF',
    activeBg: 'rgba(255,255,255,0.1)',
    hoverBg: 'rgba(255,255,255,0.05)',
    subText: '#6B7280',
    borderColor: 'rgba(255,255,255,0.1)',
    accent: '#5B5FEF',
    blobs: ['#5B5FEF', '#8B5CF6'],
    blend: 'screen',
    particle: 'stars',
    particleColor: '255,255,255',
  },
  {
    id: 'ember',
    name: 'Ember',
    bg: '#1A1210',
    textActive: '#FDF4E9',
    textInactive: '#B79E8A',
    textHover: '#FDF4E9',
    activeBg: 'rgba(245,158,11,0.16)',
    hoverBg: 'rgba(245,158,11,0.08)',
    subText: '#9C7A5C',
    borderColor: 'rgba(245,158,11,0.15)',
    accent: '#F59E0B',
    blobs: ['#F59E0B', '#FB7185'],
    blend: 'screen',
    particle: 'embers',
    particleColor: '245,158,11',
    particleColor2: '251,113,133',
  },
  {
    id: 'daylight',
    name: 'Daylight',
    bg: '#F8F4EC',
    textActive: '#14171F',
    textInactive: '#9C9483',
    textHover: '#14171F',
    activeBg: 'rgba(91,95,239,0.12)',
    hoverBg: 'rgba(20,23,31,0.05)',
    subText: '#A39B87',
    borderColor: 'rgba(20,23,31,0.08)',
    accent: '#5B5FEF',
    blobs: ['#C7C4F7', '#FBD5A5'],
    blend: 'multiply',
    particle: 'dust',
    particleColor: '184,174,151',
  },
  {
    id: 'frost',
    name: 'Frost',
    bg: '#EAF1F6',
    textActive: '#0F2A3D',
    textInactive: '#7C93A3',
    textHover: '#0F2A3D',
    activeBg: 'rgba(14,165,233,0.14)',
    hoverBg: 'rgba(15,42,61,0.06)',
    subText: '#7C93A3',
    borderColor: 'rgba(15,42,61,0.1)',
    accent: '#0EA5E9',
    blobs: ['#A9D8F5', '#C7CFF7'],
    blend: 'multiply',
    particle: 'stars',
    particleColor: '56,189,248',
  },
]

export const DEFAULT_THEME_ID = 'midnight'
