import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { api, getToken, getTokenExpiry, setToken } from '../../lib/api'
import Button from './Button'

// How long with zero activity before we log the user out. Mirrors the
// backend's JWT_ACCESS_TOKEN_EXPIRE_MINUTES default (api/config.py) — but
// unlike a plain token-expiry timer, an actively-working user never actually
// reaches this, because SILENT_REFRESH_MARGIN_MS below keeps minting a fresh
// token in the background for as long as there's real activity. This is what
// makes it "due to inactivity" rather than "exactly N minutes after login."
// TEMP: shortened to 5 min / 1 min warning for testing — revert to
// 60 * 60 * 1000 / 5 * 60 * 1000 before shipping.
const IDLE_LIMIT_MS = 5 * 60 * 1000
const WARNING_WINDOW_MS = 1 * 60 * 1000
const SILENT_REFRESH_MARGIN_MS = 3 * 60 * 1000
const CHECK_INTERVAL_MS = 15 * 1000
const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'wheel'] as const

export default function SessionExpiryWatcher() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const lastActivity = useRef(Date.now())
  const [idleMsRemaining, setIdleMsRemaining] = useState<number | null>(null)

  const markActive = useCallback(() => {
    lastActivity.current = Date.now()
  }, [])

  const handleLogOut = useCallback(async () => {
    setIdleMsRemaining(null)
    await signOut()
    navigate('/login')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleStayLoggedIn() {
    markActive()
    try {
      const { access_token } = await api.refreshToken()
      setToken(access_token)
    } catch {
      // Token was already dead server-side by the time this fired.
      await handleLogOut()
      return
    }
    setIdleMsRemaining(null)
  }

  const evaluate = useCallback(async () => {
    if (document.visibilityState === 'hidden') return

    const idleFor = Date.now() - lastActivity.current
    const idleRemaining = IDLE_LIMIT_MS - idleFor

    if (idleRemaining <= 0) {
      await handleLogOut()
      return
    }

    if (idleRemaining <= WARNING_WINDOW_MS) {
      setIdleMsRemaining(idleRemaining)
      return
    }

    // Not idle — safe to keep the token alive in the background so an
    // actively-working user never sees the warning at all.
    setIdleMsRemaining(null)
    const token = getToken()
    const expiry = token && getTokenExpiry(token)
    if (expiry && expiry - Date.now() <= SILENT_REFRESH_MARGIN_MS) {
      try {
        const { access_token } = await api.refreshToken()
        setToken(access_token)
      } catch {
        // Token already dead server-side — the next check (or a real API
        // call elsewhere) will surface it properly.
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleLogOut])

  // Real activity resets the idle clock.
  useEffect(() => {
    if (!user) return
    ACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, markActive, { passive: true }))
    return () => ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, markActive))
  }, [user, markActive])

  // Background tabs get setInterval throttled or fully paused by the
  // browser, so a long-backgrounded tab wouldn't notice anything until its
  // next lucky tick — re-check immediately on regaining focus instead.
  useEffect(() => {
    if (!user) return
    document.addEventListener('visibilitychange', evaluate)
    window.addEventListener('focus', evaluate)
    return () => {
      document.removeEventListener('visibilitychange', evaluate)
      window.removeEventListener('focus', evaluate)
    }
  }, [user, evaluate])

  useEffect(() => {
    if (!user) {
      setIdleMsRemaining(null)
      return
    }
    lastActivity.current = Date.now()
    const poll = setInterval(evaluate, CHECK_INTERVAL_MS)
    return () => clearInterval(poll)
  }, [user, evaluate])

  // While the warning is up, tick every second — re-derived from real
  // elapsed time each tick (not just decremented by 1s) so a throttled
  // background tick can't drift it. Also dismisses itself automatically if
  // real activity comes in (mouse move, keypress) while it's showing.
  useEffect(() => {
    if (idleMsRemaining === null) return
    const tick = setInterval(() => {
      const idleFor = Date.now() - lastActivity.current
      const remaining = IDLE_LIMIT_MS - idleFor
      if (remaining <= 0) {
        handleLogOut()
        return
      }
      if (remaining > WARNING_WINDOW_MS) {
        setIdleMsRemaining(null)
        return
      }
      setIdleMsRemaining(remaining)
    }, 1000)
    return () => clearInterval(tick)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idleMsRemaining !== null])

  if (idleMsRemaining === null) return null

  const totalSeconds = Math.max(0, Math.ceil(idleMsRemaining / 1000))
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
