import { useState } from 'react'
import { Search, Bell } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import Avatar from '../ui/Avatar'

export default function TopBar() {
  const { user } = useAuth()
  const [showNotifs, setShowNotifs] = useState(false)

  return (
    <header className="h-[60px] bg-white border-b border-gray-200 flex items-center px-6 gap-4 shrink-0 relative">
      {/* Search */}
      <div className="relative w-72">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          placeholder='Search 1CH-104, "migration"…'
          className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-gray-200 text-[13px] outline-none bg-paper focus:border-brand focus:ring-1 focus:ring-brand/20"
        />
      </div>

      {/* Right side */}
      <div className="ml-auto flex items-center gap-4">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifs((s) => !s)}
            className="relative text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Notifications"
          >
            <Bell size={18} />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-danger text-white text-[9px] font-bold flex items-center justify-center">
              2
            </span>
          </button>

          {showNotifs && (
            <div className="absolute top-8 right-0 w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 text-sm font-semibold text-ink">
                Notifications
              </div>
              <div className="max-h-64 overflow-y-auto">
                <div className="flex gap-2 px-4 py-3 border-b border-gray-50 bg-brand-soft">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand mt-1.5 shrink-0" />
                  <div>
                    <p className="text-[12.5px] text-ink leading-snug">New story assigned to you</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">10m ago</p>
                  </div>
                </div>
                <div className="flex gap-2 px-4 py-3 border-b border-gray-50 bg-brand-soft">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand mt-1.5 shrink-0" />
                  <div>
                    <p className="text-[12.5px] text-ink leading-snug">Epic status updated to Resolved</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">1h ago</p>
                  </div>
                </div>
                <div className="flex gap-2 px-4 py-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-transparent mt-1.5 shrink-0" />
                  <div>
                    <p className="text-[12.5px] text-ink leading-snug">Comment added on 1CH-104</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">3h ago</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User */}
        <span className="text-[13.5px] text-gray-500">
          Welcome, <strong className="text-ink font-semibold">{user?.full_name}</strong>
        </span>
        <Avatar name={user?.full_name || 'User'} size="md" />
      </div>
    </header>
  )
}
