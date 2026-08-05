import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Lock, User, Eye, EyeOff, Cloud, AlertCircle } from 'lucide-react'
import { api, ApiError, setToken } from '../lib/api'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'

export default function AcceptInvitePage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!fullName.trim()) {
      setError('Please enter your name.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setSubmitting(true)
    try {
      const { access_token } = await api.acceptInvite(token!, password, fullName.trim())
      setToken(access_token)
      // Full reload so AuthProvider picks up the freshly stored token —
      // same reasoning as AuthCallbackPage.
      window.location.href = '/'
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to set up your account.')
      setSubmitting(false)
    }
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
            <div className="text-caption tracking-[0.14em] text-gray-400 mt-0.5">TRACKER</div>
          </div>
        </div>

        <Card padding="lg">
          {!token ? (
            <div className="text-center py-4">
              <AlertCircle size={28} className="mx-auto mb-3 text-danger" />
              <h1 className="font-display text-heading font-semibold text-ink mb-1.5">
                Invite link invalid or expired
              </h1>
              <p className="text-body text-gray-500 mb-5">
                Ask an admin to send you a new invite, or sign in if you already have a password.
              </p>
              <Button onClick={() => navigate('/login')} className="w-full">
                Back to sign in
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <h1 className="font-display text-heading font-semibold text-ink mb-1">Set up your account</h1>
              <p className="text-gray-500 text-body mb-6">
                You've been invited to 1CloudHub Tracker. Add your name and choose a password to finish setting up.
              </p>

              {error && (
                <div className="bg-danger-soft text-danger text-body px-4 py-2.5 rounded-lg mb-4">{error}</div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="text-body font-semibold text-ink mb-1.5 block">Full name</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <User size={16} />
                    </div>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-200 text-body font-body text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 transition-colors"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-body font-semibold text-ink mb-1.5 block">Password</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <Lock size={16} />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••"
                      className="w-full pl-9 pr-10 py-2.5 rounded-lg border border-gray-200 text-body font-body text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 transition-colors"
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
                  <label className="text-body font-semibold text-ink mb-1.5 block">Confirm password</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <Lock size={16} />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="••••••••••"
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-200 text-body font-body text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 transition-colors"
                      required
                    />
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full mt-6" size="lg" disabled={submitting}>
                {submitting ? 'Setting up...' : 'Continue'}
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  )
}
