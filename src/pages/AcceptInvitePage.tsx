import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Eye, EyeOff, Cloud, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import Button from '../components/ui/Button'

type Status = 'checking' | 'ready' | 'invalid'

export default function AcceptInvitePage() {
  const [status, setStatus] = useState<Status>('checking')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  // The invite link's token is exchanged for a session automatically by the
  // Supabase client on load — we just need to wait for it to show up.
  useEffect(() => {
    let resolved = false

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && !resolved) {
        resolved = true
        setStatus('ready')
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session && !resolved) {
        resolved = true
        setStatus('ready')
      }
    })

    const timeout = setTimeout(() => {
      if (!resolved) setStatus('invalid')
    }, 4000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setSubmitting(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setSubmitting(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    navigate('/', { replace: true })
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-paper font-body p-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2.5 justify-center mb-8">
          <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center">
            <Cloud size={16} className="text-white" />
          </div>
          <div>
            <div className="font-display text-base font-bold text-ink leading-none">1CloudHub</div>
            <div className="text-[9.5px] tracking-[0.14em] text-gray-400 mt-0.5">TRACKER</div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-7">
          {status === 'checking' && (
            <div className="text-center py-6">
              <p className="text-sm text-gray-500">Verifying your invite...</p>
            </div>
          )}

          {status === 'invalid' && (
            <div className="text-center py-4">
              <AlertCircle size={28} className="mx-auto mb-3 text-danger" />
              <h1 className="font-display text-lg font-semibold text-ink mb-1.5">
                Invite link invalid or expired
              </h1>
              <p className="text-[13px] text-gray-500 mb-5">
                Ask an admin to send you a new invite, or sign in if you already have a password.
              </p>
              <Button onClick={() => navigate('/login')} className="w-full">
                Back to sign in
              </Button>
            </div>
          )}

          {status === 'ready' && (
            <form onSubmit={handleSubmit}>
              <h1 className="font-display text-xl font-semibold text-ink mb-1">Set your password</h1>
              <p className="text-gray-500 text-sm mb-6">
                You've been invited to 1CloudHub Tracker. Choose a password to finish setting up your account.
              </p>

              {error && (
                <div className="bg-danger-soft text-danger text-sm px-4 py-2.5 rounded-lg mb-4">{error}</div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="text-[13px] font-semibold text-ink mb-1.5 block">Password</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <Lock size={16} />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••"
                      className="w-full pl-9 pr-10 py-2.5 rounded-lg border border-gray-200 text-sm font-body text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 transition-colors"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[13px] font-semibold text-ink mb-1.5 block">Confirm password</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <Lock size={16} />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="••••••••••"
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-200 text-sm font-body text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 transition-colors"
                      required
                    />
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full mt-6" size="lg" disabled={submitting}>
                {submitting ? 'Setting password...' : 'Continue'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
