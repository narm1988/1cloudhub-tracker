import { useEffect, useRef } from 'react'
import { Cloud } from 'lucide-react'
import { setToken } from '../lib/api'

export default function AuthCallbackPage() {
  const handled = useRef(false)

  useEffect(() => {
    if (handled.current) return
    handled.current = true

    const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : ''
    const token = new URLSearchParams(hash).get('token')

    if (!token) {
      window.location.href = '/login?error=missing_token'
      return
    }

    setToken(token)
    // Full reload (not a router navigate) so AuthProvider remounts and
    // restoreSession() picks up the token that was just stored — it only
    // runs once on mount, so a soft navigation here would leave `user` null.
    window.location.href = '/'
  }, [])

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-paper font-body">
      <div className="flex items-center gap-2.5 text-gray-400">
        <Cloud size={18} className="animate-pulse" />
        <span className="text-body">Signing you in...</span>
      </div>
    </div>
  )
}
