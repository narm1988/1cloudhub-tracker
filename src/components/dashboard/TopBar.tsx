import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Bell, Shield } from 'lucide-react'
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

export default function TopBar() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [showNotifs, setShowNotifs] = useState(false)
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
          setNotifications((prev) => [payload.new as Notification, ...prev].slice(0, 5))
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
      .limit(5)
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

  async function openNotification(n: Notification) {
    if (!n.read) {
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)))
      setUnreadCount((c) => Math.max(0, c - 1))
      await supabase.from('notifications').update({ read: true }).eq('id', n.id)
    }
    setShowNotifs(false)
    if (n.link) navigate(n.link)
  }

  return (
    <header className="h-[60px] bg-white border-b border-gray-200 flex items-center px-6 gap-4 shrink-0 relative">
      {/* Search */}
      <div className="relative w-72">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          placeholder='Search 1CH-104, "migration"…'
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSearchSubmit() }}
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
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-danger text-white text-[9px] font-mono tabular-nums font-bold flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowNotifs(false)} />
              <div className="absolute top-8 right-0 w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 text-sm font-semibold text-ink">
                  Notifications
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifications.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => openNotification(n)}
                      className={`w-full flex gap-2 px-4 py-3 border-b border-gray-50 text-left hover:bg-gray-50 transition-colors ${!n.read ? 'bg-brand-soft' : ''}`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${!n.read ? 'bg-brand' : 'bg-transparent'}`} />
                      <div>
                        <p className="text-[12.5px] text-ink leading-snug">{n.message}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">{timeAgo(n.created_at)}</p>
                      </div>
                    </button>
                  ))}
                  {notifications.length === 0 && (
                    <p className="text-[12.5px] text-gray-400 text-center py-6">No notifications yet.</p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* User */}
        <span className="text-[13.5px] text-gray-500">
          Welcome, <strong className="text-ink font-semibold">{user?.full_name}</strong>
        </span>
        <span
          className={`flex items-center gap-1 text-[10.5px] font-semibold px-2 py-0.5 rounded-md ${
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
