import { useLocation, useNavigate } from 'react-router-dom'
import { LayoutGrid, Users, Settings, ArrowLeft, Cloud, FolderKanban, Search } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const NAV_ITEMS = [
  { key: 'projects', label: 'Projects', icon: FolderKanban, path: '/projects' },
  { key: 'epics', label: 'Epics', icon: LayoutGrid, path: '/epics' },
  { key: 'search', label: 'Search', icon: Search, path: '/search' },
  { key: 'people', label: 'People', icon: Users, path: '/people', admin: true },
  { key: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
]

export default function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { signOut, user } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <aside className="w-56 bg-ink text-white flex flex-col p-5 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-2 pb-5">
        <div className="w-7 h-7 rounded-lg bg-brand flex items-center justify-center">
          <Cloud size={14} className="text-white" />
        </div>
        <div>
          <div className="font-display font-bold text-[15px] leading-none">1CloudHub</div>
          <div className="text-[9px] tracking-[0.12em] text-gray-500 mt-0.5">TRACKER</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname.startsWith(item.path)

          return (
            <button
              key={item.key}
              onClick={() => navigate(item.path)}
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-[13.5px] font-medium transition-colors ${
                isActive
                  ? 'bg-ink-faint text-white'
                  : 'text-gray-400 hover:text-white hover:bg-ink-faint/50'
              }`}
            >
              <Icon size={15} />
              {item.label}
              {item.admin && (
                <span className="ml-auto text-[9.5px] bg-ink-faint px-1.5 py-0.5 rounded text-gray-400">
                  ADMIN
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="mt-auto">
        <div className="my-3 h-px bg-[repeating-linear-gradient(90deg,#2A2F42_0,#2A2F42_3px,transparent_3px,transparent_7px)]" />
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-300 text-[13px] px-2 py-1.5 transition-colors"
        >
          <ArrowLeft size={14} /> Sign out
        </button>
      </div>
    </aside>
  )
}
