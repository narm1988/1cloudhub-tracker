import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, Cloud } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, user } = useAuth()
  const navigate = useNavigate()

  // Redirect if already logged in
  if (user) {
    navigate('/', { replace: true })
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await signIn(email, password)
    if (error) {
      setError(error)
      setLoading(false)
    } else {
      navigate('/', { replace: true })
    }
  }

  return (
    <div className="flex min-h-screen w-full font-body bg-paper">
      {/* Left brand panel */}
      <div className="hidden lg:flex flex-col justify-between w-[44%] bg-ink text-white p-12 relative overflow-hidden">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center">
            <Cloud size={16} className="text-white" />
          </div>
          <div>
            <div className="font-display text-lg font-bold tracking-tight leading-none">
              1CloudHub
            </div>
            <div className="text-[10.5px] tracking-[0.14em] text-gray-500 mt-0.5">
              TRACKER
            </div>
          </div>
        </div>

        {/* Tagline */}
        <div className="max-w-sm relative z-10">
          <h2 className="font-display text-[32px] font-semibold leading-tight mb-3.5">
            Where 1CloudHub tracks the work.
          </h2>
          <p className="text-gray-400 text-[15px] leading-relaxed">
            Epics and user stories for our internal delivery — created, assigned
            and resolved in one place.
          </p>
        </div>

        {/* Floating ticket stubs */}
        <div className="relative h-40">
          {[
            { rot: '-rotate-3', top: 'top-8', accent: 'border-l-brand', id: '1CH-101' },
            { rot: 'rotate-1', top: 'top-4', accent: 'border-l-success', id: '1CH-102' },
            { rot: '-rotate-[0.5deg]', top: 'top-0', accent: 'border-l-warning', id: '1CH-103' },
          ].map((t, i) => (
            <div
              key={i}
              className={`absolute left-0 ${t.top} w-72 h-14 bg-ink-faint rounded-lg ${t.rot} flex items-center px-4 shadow-lg border-l-4 ${t.accent}`}
            >
              <span className="font-mono text-[11px] text-gray-500 tracking-wide">
                {t.id}
              </span>
              <div className="flex-1 h-px mx-2.5 bg-[repeating-linear-gradient(90deg,#3A3F55_0,#3A3F55_2px,transparent_2px,transparent_6px)]" />
              <span className="w-14 h-2 rounded bg-ink-faint" />
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <form onSubmit={handleSubmit} className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand flex items-center justify-center">
              <Cloud size={14} className="text-white" />
            </div>
            <span className="font-display text-base font-bold text-ink">1CloudHub Tracker</span>
          </div>

          <h1 className="font-display text-2xl font-semibold text-ink mb-1">
            Sign in
          </h1>
          <p className="text-gray-500 text-sm mb-7">
            Use the workspace email your admin invited you with.
          </p>

          {error && (
            <div className="bg-danger-soft text-danger text-sm px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <Input
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@1cloudhub.com"
              icon={<Mail size={16} />}
              required
            />

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-[13px] font-semibold text-ink">Password</label>
                <a href="#" className="text-[13px] text-brand hover:text-brand-deep transition-colors">
                  Forgot?
                </a>
              </div>
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
          </div>

          <Button
            type="submit"
            className="w-full mt-6"
            size="lg"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>

          {/* Perforation divider */}
          <div className="my-5 h-px bg-[repeating-linear-gradient(90deg,#E6E7EB_0,#E6E7EB_3px,transparent_3px,transparent_7px)]" />

          <p className="text-[13px] text-gray-500 text-center">
            No account? Ask your workspace admin to send you an invite.
          </p>
        </form>
      </div>
    </div>
  )
}
