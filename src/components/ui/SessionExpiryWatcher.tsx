import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { api, getToken, getTokenExpiry, setToken } from '../../lib/api'
import Button from './Button'

const WARNING_WINDOW_MS = 5 * 60 * 1000 // show the dialog once inside 5 minutes of expiry
const POLL_INTERVAL_MS = 15 * 1000 // cheap background check while no warning is showing

export default function SessionExpiryWatcher() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [msRemaining, setMsRemaining] = useState<number | null>(null)

  async function handleLogOut() {
    await signOut()
    navigate('/login')
  }

  async function handleStayLoggedIn() {
    try {
      const { access_token } = await api.refreshToken()
      setToken(access_token)
      setMsRemaining(null)
    } catch {
      // Current token was already dead by the time this fired — nothing to refresh.
      await handleLogOut()
    }
  }

  // Background poll: cheap, infrequent, just watching for the warning threshold.
  useEffect(() => {
    if (!user) {
      setMsRemaining(null)
      return
    }
    const poll = setInterval(() => {
      const token = getToken()
      const expiry = token && getTokenExpiry(token)
      if (!expiry) return
      const remaining = expiry - Date.now()
      if (remaining <= WARNING_WINDOW_MS) setMsRemaining(Math.max(0, remaining))
    }, POLL_INTERVAL_MS)
    return () => clearInterval(poll)
  }, [user])

  // Once the warning is showing, tick every second for a live countdown,
  // and sign out automatically if it actually runs out.
  useEffect(() => {
    if (msRemaining === null) return
    const tick = setInterval(() => {
      setMsRemaining((prev) => {
        if (prev === null) return null
        const next = prev - 1000
        if (next <= 0) {
          handleLogOut()
          return null
        }
        return next
      })
    }, 1000)
    return () => clearInterval(tick)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [msRemaining !== null])

  if (msRemaining === null) return null

  const totalSeconds = Math.max(0, Math.ceil(msRemaining / 1000))
  const mm = String(Math.floor(totalSeconds / 60)).padStart(2, '0')
  const ss = String(totalSeconds % 60).padStart(2, '0')

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] p-4" role="alertdialog" aria-modal="true">
      <div className="bg-white rounded-lg max-w-sm w-full p-6 shadow-lg text-center animate-pop-in">
        <div className="w-14 h-14 rounded-full bg-warning-soft flex items-center justify-center mx-auto mb-4">
          <ShieldAlert size={26} className="text-warning" />
        </div>
        <h3 className="text-[16px] font-semibold text-gray-900 mb-2">Session expiring soon</h3>
        <p className="text-[13px] text-gray-500 leading-relaxed mb-5">
          Your session will expire due to inactivity. You'll be logged out automatically if no action is taken.
        </p>
        <div className="text-[10.5px] font-semibold tracking-wide uppercase text-gray-400 mb-1">Time remaining</div>
        <div className="text-[28px] font-bold text-warning font-mono tabular-nums mb-6">{mm}:{ss}</div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" className="flex-1" onClick={handleLogOut}>
            Log out now
          </Button>
          <Button size="sm" className="flex-1" onClick={handleStayLoggedIn}>
            Stay logged in
          </Button>
        </div>
      </div>
    </div>
  )
}
