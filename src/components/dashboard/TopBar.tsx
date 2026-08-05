import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Bell, Shield, X, PanelLeft } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
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

// Notifications only carry a plain message string (no type column), so the
// icon is inferred from the display_id prefix embedded in that message by
// the DB trigger — e.g. "You were assigned to BUG-101: ...".
function notificationIcon(message: string) {
  if (message.startsWith('New comment')) return { emoji: '💬', bg: '#F0F1F3' }
  if (/\bBUG-/.test(message)) return { emoji: '🐛', bg: '#FDECEC' }
  if (/\bTSK-/.test(message)) return { emoji: '✅', bg: '#EAF1FE' }
  if (/\bSUB-/.test(message)) return { emoji: '📎', bg: '#F0F1F3' }
  if (/\b1CH-/.test(message)) return { emoji: '📗', bg: '#EEF0FE' }
  return { emoji: '🔔', bg: '#F0F1F3' }
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

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev].slice(0, 30))
          setUnreadCount((c) => c + 1)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id])

  async function fetchNotifications() {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(30)
    if (data) setNotifications(data)
  }

  async function fetchUnreadCount() {
    const { count } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user!.id)
      .eq('read', false)
    setUnreadCount(count || 0)
  }

  async function markRead(n: Notification) {
    if (n.read) return
    setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)))
    setUnreadCount((c) => Math.max(0, c - 1))
    await supabase.from('notifications').update({ read: true }).eq('id', n.id)
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
    await supabase.from('notifications').update({ read: true }).in('id', unreadIds)
  }

  const visibleNotifications = notifTab === 'unread' ? notifications.filter((n) => !n.read) : notifications

  return (
    <header className="h-[60px] bg-white border-b border-gray-200 flex items-center px-6 gap-4 shrink-0 relative">
      {/* Sidebar collapse toggle */}
      <button
        onClick={onToggleSidebar}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-pressed={collapsed}
        className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg p-1.5 -ml-1.5 transition-colors"
      >
        <PanelLeft size={18} />
      </button>

      {/* Search */}
      <div className="relative w-72">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          placeholder='Search 1CH-104, "migration"…'
          aria-label="Search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSearchSubmit() }}
          className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-gray-200 text-sm outline-none bg-paper focus:border-brand focus:ring-1 focus:ring-brand/20"
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
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-danger text-white text-xs font-mono tabular-nums font-bold flex items-center justify-center">
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
              <div className="fixed top-0 right-0 bottom-0 w-[360px] bg-white shadow-2xl z-50 flex flex-col animate-drawer-slide-in">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
                  <button
                    onClick={() => setShowNotifs(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Close notifications"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Tabs + bulk action */}
                <div className="flex items-center justify-between px-5 py-2.5 border-b border-gray-100">
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setNotifTab('all')}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full transition-colors ${
                        notifTab === 'all' ? 'bg-brand text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setNotifTab('unread')}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full transition-colors ${
                        notifTab === 'unread' ? 'bg-brand text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      Unread (<span className="font-mono tabular-nums">{unreadCount}</span>)
                    </button>
                  </div>
                  <button
                    onClick={markAllRead}
                    disabled={unreadCount === 0}
                    className="text-xs font-semibold text-brand hover:text-brand-deep transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Mark all read
                  </button>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto">
                  {visibleNotifications.map((n) => {
                    const icon = notificationIcon(n.message)
                    return (
                      <div key={n.id} className={`px-5 py-3.5 border-b border-gray-50 ${!n.read ? 'bg-brand-soft/40' : ''}`}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0"
                              style={{ backgroundColor: icon.bg }}
                            >
                              {icon.emoji}
                            </span>
                            {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-brand" />}
                          </div>
                          <span className="text-xs font-mono text-gray-400">{timeAgo(n.created_at)}</span>
                        </div>
                        <p className="text-sm text-gray-900 leading-snug mb-2 pl-9">{n.message}</p>
                        <div className="flex items-center gap-3 pl-9">
                          {n.link && (
                            <button
                              onClick={() => viewNotification(n)}
                              className="text-xs font-semibold text-brand hover:text-brand-deep transition-colors"
                            >
                              View →
                            </button>
                          )}
                          {!n.read && (
                            <button
                              onClick={() => markRead(n)}
                              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              Mark read
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                  {visibleNotifications.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-10">
                      {notifTab === 'unread' ? 'No unread notifications.' : 'No notifications yet.'}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* User */}
        <span className="text-sm text-gray-500">
          Welcome, <strong className="text-gray-900 font-semibold">{user?.full_name}</strong>
        </span>
        <span
          className={`flex items-center gap-1 text-caption font-semibold px-2 py-0.5 rounded-md ${
            user?.role === 'admin' ? 'bg-brand-soft text-brand' : 'bg-gray-100 text-gray-500'
          }`}
        >
          {user?.role === 'admin' && <Shield size={10} />}
          {user?.role === 'admin' ? 'Admin' : 'Member'}
        </span>
        <Avatar name={user?.full_name || 'User'} size="md" />
      </div>
    </header>
  )
}
