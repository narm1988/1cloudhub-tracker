import { useLocation, useNavigate } from 'react-router-dom'
import { LayoutGrid, Users, Settings, LogOut, Cloud, FolderKanban, Search } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'

const NAV_ITEMS = [
  { key: 'projects', label: 'Projects', icon: FolderKanban, path: '/projects', hoverClass: 'group-hover:-rotate-[8deg] group-hover:scale-110' },
  { key: 'epics', label: 'Epics', icon: LayoutGrid, path: '/epics', hoverClass: 'group-hover:scale-[1.15]' },
  { key: 'search', label: 'Search', icon: Search, path: '/search', hoverClass: 'group-hover:-rotate-[15deg] group-hover:scale-110' },
  { key: 'people', label: 'People', icon: Users, path: '/people', admin: true, hoverClass: 'group-hover:-translate-y-0.5' },
  { key: 'settings', label: 'Settings', icon: Settings, path: '/settings', hoverClass: 'group-hover:rotate-90' },
]

const SIDEBAR_STARS = [
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

export default function Sidebar() {
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
      className="w-64 text-white flex flex-col p-5 shrink-0 transition-colors relative overflow-hidden"
      style={{ backgroundColor: theme.bg }}
    >
      {/* Aurora mesh — soft drifting color blobs */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute w-56 h-56 -top-14 -left-16 rounded-full bg-brand blur-3xl opacity-30 mix-blend-screen animate-aurora-a" />
        <div className="absolute w-48 h-48 bottom-24 -right-16 rounded-full bg-violet-500 blur-3xl opacity-25 mix-blend-screen animate-aurora-b" />
      </div>

      {/* Starfield */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {SIDEBAR_STARS.map((s, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-white animate-twinkle"
            style={{
              top: s.top,
              left: s.left,
              width: s.size,
              height: s.size,
              boxShadow: '0 0 4px 1px rgba(255,255,255,0.5)',
              animationDelay: `${s.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Logo, orbited by a small satellite dot */}
      <div className="relative z-10 flex items-center gap-2.5 px-2 pb-5">
        <div className="relative w-7 h-7 shrink-0">
          <div className="absolute -inset-2 rounded-full border border-dashed border-white/15 animate-orbit-spin-slow" />
          <div className="absolute -inset-2 animate-orbit-spin">
            <span className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-brand shadow-[0_0_6px_2px_rgba(91,95,239,0.7)]" />
          </div>
          <div className="relative w-7 h-7 rounded-lg bg-brand flex items-center justify-center">
            <Cloud size={14} className="text-white" />
          </div>
        </div>
        <div>
          <div className="font-display font-bold text-[15px] leading-none">1CloudHub</div>
          <div className="text-[9px] tracking-[0.12em] text-gray-500 mt-0.5">TRACKER</div>
        </div>
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
              className={`group flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-[13.5px] font-medium transition-colors ${
                isActive
                  ? 'bg-white/10 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon size={15} className={`transition-transform duration-300 ${item.hoverClass}`} />
              {item.label}
              {item.admin && (
                <span className="ml-auto text-[9.5px] bg-white/10 px-1.5 py-0.5 rounded text-gray-400">
                  ADMIN
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="relative z-10 mt-auto">
        <div className="my-3 border-t border-white/10" />
        <button
          onClick={handleSignOut}
          className="group w-full flex items-center gap-2.5 text-gray-400 hover:text-danger hover:bg-danger/10 text-[13.5px] font-medium rounded-lg px-2.5 py-2 transition-colors"
        >
          <LogOut size={15} className="transition-transform duration-200 group-hover:translate-x-0.5" /> Sign out
        </button>
      </div>
    </aside>
  )
}
