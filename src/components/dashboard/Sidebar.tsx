import { useLocation, useNavigate } from 'react-router-dom'
import { LayoutGrid, Users, Settings, LogOut, Cloud, FolderKanban, Search, Archive, History } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'

const NAV_ITEMS = [
  { key: 'projects', label: 'Projects', icon: FolderKanban, path: '/projects', hoverClass: 'group-hover:-rotate-[8deg] group-hover:scale-110' },
  { key: 'epics', label: 'Epics', icon: LayoutGrid, path: '/epics', hoverClass: 'group-hover:scale-[1.15]' },
  { key: 'archived', label: 'Archived', icon: Archive, path: '/archived', hoverClass: 'group-hover:-translate-y-0.5' },
  { key: 'search', label: 'Search', icon: Search, path: '/search', hoverClass: 'group-hover:-rotate-[15deg] group-hover:scale-110' },
  { key: 'people', label: 'People', icon: Users, path: '/people', admin: true, hoverClass: 'group-hover:-translate-y-0.5' },
  { key: 'audit-log', label: 'Audit Log', icon: History, path: '/audit-log', admin: true, hoverClass: 'group-hover:rotate-[15deg]' },
  { key: 'settings', label: 'Settings', icon: Settings, path: '/settings', hoverClass: 'group-hover:rotate-90' },
]

const SIDEBAR_PARTICLES = [
  { top: '5%', left: '78%', size: 3, delay: 0.2 },
  { top: '12%', left: '18%', size: 2, delay: 1.4 },
  { top: '20%', left: '55%', size: 2, delay: 2.4 },
  { top: '30%', left: '88%', size: 3, delay: 0.8 },
  { top: '38%', left: '10%', size: 2, delay: 1.9 },
  { top: '45%', left: '40%', size: 3, delay: 0.5 },
  { top: '52%', left: '70%', size: 2, delay: 2.1 },
  { top: '60%', left: '15%', size: 3, delay: 1.1 },
  { top: '67%', left: '50%', size: 2, delay: 0.3 },
  { top: '74%', left: '85%', size: 3, delay: 1.7 },
  { top: '82%', left: '28%', size: 2, delay: 0.9 },
  { top: '89%', left: '65%', size: 3, delay: 2.6 },
  { top: '94%', left: '10%', size: 2, delay: 1.3 },
]

const PARTICLE_ANIMATION: Record<string, string> = {
  stars: 'animate-twinkle',
  embers: 'animate-ember-rise',
  dust: 'animate-dust-drift',
}

const CURTAIN_RIBBONS = [
  { left: '2%', c1: 0, c2: 1, duration: 7, delay: 0 },
  { left: '28%', c1: 1, c2: 2, duration: 9, delay: -2 },
  { left: '56%', c1: 0, c2: 2, duration: 8, delay: -4 },
  { left: '80%', c1: 2, c2: 0, duration: 6.5, delay: -1 },
]

export default function Sidebar({ collapsed = false }: { collapsed?: boolean }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { signOut, user } = useAuth()
  const { theme } = useTheme()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <aside
      className={`${collapsed ? 'w-16 p-3' : 'w-64 p-5'} flex flex-col shrink-0 transition-[width] duration-200 relative overflow-hidden`}
      style={{
        backgroundColor: theme.bg,
        color: theme.textActive,
        '--nav-active-bg': theme.activeBg,
        '--nav-hover-bg': theme.hoverBg,
        '--nav-text-inactive': theme.textInactive,
        '--nav-text-hover': theme.textHover,
      } as React.CSSProperties}
    >
      {/* Aurora mesh — soft drifting color blobs, or swaying curtain ribbons */}
      {theme.animationStyle === 'curtain' && theme.ribbonColors ? (
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          {CURTAIN_RIBBONS.map((r, i) => (
            <div
              key={i}
              className="absolute -top-[10%] h-[130%] w-10 blur-xl opacity-55 rounded-[40%] animate-ribbon-sway"
              style={{
                left: r.left,
                background: `linear-gradient(180deg, transparent, ${theme.ribbonColors![r.c1]}, ${theme.ribbonColors![r.c2]}, transparent)`,
                animationDuration: `${r.duration}s`,
                animationDelay: `${r.delay}s`,
              }}
            />
          ))}
        </div>
      ) : (
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div
            className="absolute w-56 h-56 -top-14 -left-16 rounded-full blur-3xl animate-aurora-a"
            style={{ backgroundColor: theme.blobs[0], mixBlendMode: theme.blend, opacity: theme.blend === 'screen' ? 0.3 : 0.55 }}
          />
          <div
            className="absolute w-48 h-48 bottom-24 -right-16 rounded-full blur-3xl animate-aurora-b"
            style={{ backgroundColor: theme.blobs[1], mixBlendMode: theme.blend, opacity: theme.blend === 'screen' ? 0.25 : 0.5 }}
          />
        </div>
      )}

      {/* Particles — stars / embers / dust depending on theme */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {SIDEBAR_PARTICLES.map((s, i) => {
          const color = theme.particle === 'embers' && i % 2 === 1 && theme.particleColor2 ? theme.particleColor2 : theme.particleColor
          return (
            <span
              key={i}
              className={`absolute rounded-full ${PARTICLE_ANIMATION[theme.particle]}`}
              style={{
                top: s.top,
                left: s.left,
                width: s.size,
                height: s.size,
                backgroundColor: `rgb(${color})`,
                boxShadow: `0 0 4px 1px rgba(${color},0.5)`,
                animationDelay: `${s.delay}s`,
              }}
            />
          )
        })}
      </div>

      {/* Logo, orbited by a small satellite dot */}
      <div className={`relative z-10 flex items-center gap-2.5 pb-5 ${collapsed ? 'justify-center px-0' : 'px-2'}`}>
        <div className="relative w-7 h-7 shrink-0">
          <div
            className="absolute -inset-2 rounded-full border border-dashed animate-orbit-spin-slow"
            style={{ borderColor: theme.borderColor }}
          />
          <div className="absolute -inset-2 animate-orbit-spin">
            <span
              className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: theme.accent, boxShadow: `0 0 6px 2px ${theme.accent}B3` }}
            />
          </div>
          <div className="relative w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: theme.accent }}>
            <Cloud size={14} className="text-white" />
          </div>
        </div>
        {!collapsed && (
          <div>
            <div className="font-semibold text-[15px] tracking-tight leading-none">1CloudHub</div>
            <div className="text-[10px] tracking-[0.12em] mt-0.5 uppercase" style={{ color: theme.subText }}>TRACKER</div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname.startsWith(item.path)

          return (
            <button
              key={item.key}
              onClick={() => navigate(item.path)}
              title={collapsed ? item.label : undefined}
              aria-label={item.label}
              className={`group flex items-center gap-2.5 py-2 rounded-lg text-left text-[13px] font-medium transition-colors ${
                collapsed ? 'justify-center px-0' : 'px-2.5'
              } ${
                isActive
                  ? 'bg-[var(--nav-active-bg)]'
                  : 'text-[var(--nav-text-inactive)] hover:text-[var(--nav-text-hover)] hover:bg-[var(--nav-hover-bg)]'
              }`}
              style={isActive ? { color: theme.textActive } : undefined}
            >
              <Icon size={15} className={`shrink-0 transition-transform duration-300 ${item.hoverClass}`} />
              {!collapsed && (
                <>
                  {item.label}
                  {item.admin && (
                    <span
                      className="ml-auto text-[10px] px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: theme.hoverBg, color: theme.textInactive }}
                    >
                      ADMIN
                    </span>
                  )}
                </>
              )}
            </button>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="relative z-10 mt-auto">
        <div className="my-3 border-t" style={{ borderColor: theme.borderColor }} />
        <button
          onClick={handleSignOut}
          title={collapsed ? 'Sign out' : undefined}
          aria-label="Sign out"
          className={`group w-full flex items-center gap-2.5 text-[var(--nav-text-inactive)] hover:text-danger hover:bg-danger/10 text-[13px] font-medium rounded-lg py-2 transition-colors ${
            collapsed ? 'justify-center px-0' : 'px-2.5'
          }`}
        >
          <LogOut size={15} className="shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" />
          {!collapsed && 'Sign out'}
        </button>
      </div>
    </aside>
  )
}
