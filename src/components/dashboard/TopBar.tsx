import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Bell, Shield, X, PanelLeft } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'
import type { Notification } from '../../types'
import Avatar from '../ui/Avatar'

function timeAgo(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export default function TopBar({
  collapsed,
  onToggleSidebar,
}: {
  collapsed: boolean
  onToggleSidebar: () => void
}) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [showNotifs, setShowNotifs] = useState(false)
  const [notifTab, setNotifTab] = useState<'all' | 'unread'>('all')
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')

  function handleSearchSubmit() {
    if (!searchQuery.trim()) return
    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
  }

  useEffect(() => {
    if (!user) return
    fetchNotifications()
    fetchUnreadCount()

    // Poll every 30s instead of realtime (Vercel serverless can't hold websockets)
    const interval = setInterval(() => {
      fetchNotifications()
      fetchUnreadCount()
    }, 30000)

    return () => clearInterval(interval)
  }, [user?.id])

  async function fetchNotifications() {
    try {
      const data = await api.listNotifications()
      setNotifications(data)
    } catch {}
  }

  async function fetchUnreadCount() {
    try {
      const { count } = await api.unreadNotificationCount()
      setUnreadCount(count)
    } catch {}
  }

  async function markRead(n: Notification) {
    if (n.read) return
    setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)))
    setUnreadCount((c) => Math.max(0, c - 1))
    try { await api.markNotificationRead(n.id) } catch {}
  }

  async function viewNotification(n: Notification) {
    await markRead(n)
    setShowNotifs(false)
    if (n.link) navigate(n.link)
  }

  async function markAllRead() {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id)
    if (unreadIds.length === 0) return
    setNotifications((prev) => prev.map((x) => ({ ...x, read: true })))
    setUnreadCount(0)
    try { await api.markAllNotificationsRead(unreadIds) } catch {}
  }

  const visibleNotifications = notifTab === 'unread' ? notifications.filter((n) => !n.read) : notifications

  return (
    <header className="h-[48px] bg-white border-b border-gray-200 flex items-center px-4 gap-3 shrink-0 relative">
      {/* Sidebar collapse toggle */}
      <button
        onClick={onToggleSidebar}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-pressed={collapsed}
        className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md p-1.5 -ml-1.5 transition-colors"
      >
        <PanelLeft size={16} />
      </button>

      {/* Search */}
      <div className="relative w-64">
        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          placeholder='Search 1CH-104, "migration"…'
          aria-label="Search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSearchSubmit() }}
          className="w-full pl-7 pr-3 h-7 rounded-md border border-gray-200 text-[12px] shadow-sm outline-none bg-paper focus:border-brand focus:ring-2 focus:ring-brand/10"
        />
      </div>

      {/* Right side */}
      <div className="ml-auto flex items-center gap-3">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifs((s) => !s)}
            className="relative text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Notifications"
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-danger text-white text-[10px] font-mono tabular-nums font-bold flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <>
              <div
                className="fixed inset-0 bg-black/15 z-40 animate-fade-in"
                onClick={() => setShowNotifs(false)}
              />
              <div className="fixed top-0 right-0 bottom-0 w-[320px] bg-white shadow-2xl z-50 flex flex-col animate-drawer-slide-in">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <h2 className="text-[13px] font-semibold text-gray-900">Notifications</h2>
                  <button
                    onClick={() => setShowNotifs(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Close notifications"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Tabs + bulk action */}
                <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setNotifTab('all')}
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-md transition-colors ${
                        notifTab === 'all' ? 'bg-brand text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setNotifTab('unread')}
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-md transition-colors ${
                        notifTab === 'unread' ? 'bg-brand text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      Unread (<span className="font-mono tabular-nums">{unreadCount}</span>)
                    </button>
                  </div>
                  <button
                    onClick={markAllRead}
                    disabled={unreadCount === 0}
                    className="text-[11px] font-semibold text-brand hover:text-brand-deep transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Mark all read
                  </button>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
                  {visibleNotifications.map((n) => (
                    <div key={n.id} className={`flex items-start justify-between gap-3 px-4 py-3 ${!n.read ? 'bg-brand-soft/30' : ''}`}>
                      {/* Left: message + actions */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-brand shrink-0" />}
                          <p className="text-[12px] text-gray-900 leading-snug truncate">{n.message}</p>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          {n.link && (
                            <button
                              onClick={() => viewNotification(n)}
                              className="text-[11px] font-medium text-brand hover:text-brand-deep transition-colors"
                            >
                              View →
                            </button>
                          )}
                          {!n.read && (
                            <button
                              onClick={() => markRead(n)}
                              className="text-[11px] text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              Mark read
                            </button>
                          )}
                        </div>
                      </div>
                      {/* Right: timestamp */}
                      <span className="text-[10px] font-mono text-gray-400 shrink-0 pt-0.5">{timeAgo(n.created_at)}</span>
                    </div>
                  ))}
                  {visibleNotifications.length === 0 && (
                    <p className="text-[12px] text-gray-400 text-center py-10">
                      {notifTab === 'unread' ? 'No unread notifications.' : 'No notifications yet.'}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* User */}
        <span className="text-[12px] text-gray-500">
          Welcome, <strong className="text-gray-900 font-semibold">{user?.full_name}</strong>
        </span>
        <span
          className={`flex items-center gap-1 text-[11px] font-semibold px-1.5 py-0.5 rounded-md ${
            user?.role === 'admin' ? 'bg-brand-soft text-brand' : 'bg-gray-100 text-gray-500'
          }`}
        >
          {user?.role === 'admin' && <Shield size={10} />}
          {user?.role === 'admin' ? 'Admin' : 'Member'}
        </span>
        <Avatar name={user?.full_name || 'User'} size="sm" />
      </div>
    </header>
  )
}
