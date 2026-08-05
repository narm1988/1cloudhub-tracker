import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, Cloud } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'

const STARS = [
  { top: '12%', left: '8%', size: 3, delay: 0 },
  { top: '22%', left: '32%', size: 2, delay: 0.6 },
  { top: '8%', left: '55%', size: 2, delay: 1.4 },
  { top: '30%', left: '78%', size: 3, delay: 0.3 },
  { top: '46%', left: '18%', size: 2, delay: 1.9 },
  { top: '55%', left: '62%', size: 2, delay: 0.9 },
  { top: '68%', left: '40%', size: 3, delay: 1.2 },
  { top: '78%', left: '85%', size: 2, delay: 0.4 },
  { top: '38%', left: '90%', size: 2, delay: 1.7 },
  { top: '62%', left: '10%', size: 2, delay: 2.1 },
]

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

  async function handleMicrosoftSignIn() {
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: { redirectTo: window.location.origin },
    })
    if (error) setError(error.message)
  }

  return (
    <div className="flex min-h-screen w-full font-body bg-paper animate-fade-in">
      {/* Left brand panel */}
      <div className="hidden lg:flex flex-col justify-between w-[44%] bg-ink text-white p-12 relative overflow-hidden">
        {/* Aurora mesh — soft drifting color blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute w-80 h-80 -top-16 -left-10 rounded-full bg-brand blur-3xl opacity-40 mix-blend-screen animate-aurora-a" />
          <div className="absolute w-72 h-72 bottom-0 -right-16 rounded-full bg-success blur-3xl opacity-30 mix-blend-screen animate-aurora-b" />
          <div className="absolute w-64 h-64 top-1/3 left-1/3 rounded-full bg-warning blur-3xl opacity-25 mix-blend-screen animate-aurora-c" />
        </div>

        {/* Glass light sweep */}
        <div
          className="absolute -top-1/4 w-[40%] h-[150%] -skew-x-[18deg] pointer-events-none animate-light-sweep"
          style={{
            background: 'linear-gradient(100deg, transparent, rgba(255,255,255,0.10) 45%, rgba(91,95,239,0.16) 55%, transparent)',
          }}
        />

        {/* Starfield */}
        <div className="absolute inset-0 pointer-events-none">
          {STARS.map((s, i) => (
            <span
              key={i}
              className="absolute rounded-full bg-white animate-twinkle"
              style={{
                top: s.top,
                left: s.left,
                width: s.size,
                height: s.size,
                animationDelay: `${s.delay}s`,
              }}
            />
          ))}
        </div>

        {/* Logo, orbited by a small satellite dot */}
        <div className="flex items-center gap-2.5 relative z-10">
          <div className="relative w-8 h-8 shrink-0">
            <div className="absolute -inset-2 rounded-full border border-dashed border-white/15 animate-orbit-spin-slow" />
            <div className="absolute -inset-2 animate-orbit-spin">
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-brand shadow-[0_0_6px_2px_rgba(91,95,239,0.7)]" />
            </div>
            <div className="relative w-8 h-8 rounded-lg bg-brand flex items-center justify-center">
              <Cloud size={16} className="text-white" />
            </div>
          </div>
          <div>
            <div className="font-display text-lg font-bold tracking-tight leading-none">
              1CloudHub
            </div>
            <div className="text-caption tracking-[0.14em] text-gray-500 mt-0.5">
              TRACKER
            </div>
          </div>
        </div>

        {/* Tagline */}
        <div className="max-w-sm relative z-10 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
          <h2 className="font-display text-display font-semibold leading-tight mb-3.5">
            Where 1CloudHub tracks the work.
          </h2>
          <p className="text-gray-400 text-subhead leading-relaxed">
            Epics and user stories for our internal delivery — created, assigned
            and resolved in one place.
          </p>
        </div>

        {/* Floating ticket stubs — gently drift like satellites */}
        <div className="relative h-40 z-10">
          {[
            { rot: '-rotate-3', top: 'top-8', accent: 'border-l-brand', id: '1CH-101', duration: '6s' },
            { rot: 'rotate-1', top: 'top-4', accent: 'border-l-success', id: '1CH-102', duration: '7s' },
            { rot: '-rotate-[0.5deg]', top: 'top-0', accent: 'border-l-warning', id: '1CH-103', duration: '5.5s' },
          ].map((t, i) => (
            <div
              key={i}
              className={`absolute left-0 ${t.top} animate-float`}
              style={{ animationDelay: `${i * 0.5}s`, animationDuration: t.duration }}
            >
              <div
                className={`relative overflow-hidden w-72 h-14 bg-ink-faint rounded-lg ${t.rot} flex items-center px-4 shadow-lg border-l-4 ${t.accent}`}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
                <span className="font-mono text-caption text-gray-500 tracking-wide">
                  {t.id}
                </span>
                <div className="flex-1 h-px mx-2.5 bg-[repeating-linear-gradient(90deg,#3A3F55_0,#3A3F55_2px,transparent_2px,transparent_6px)]" />
                <span className="w-14 h-2 rounded bg-ink-faint" />
              </div>
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

          <div className="animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
            <h1 className="font-display text-2xl font-semibold text-ink mb-1">
              Sign in
            </h1>
            <p className="text-gray-500 text-sm mb-7">
              Use the workspace email your admin invited you with.
            </p>
          </div>

          {error && (
            <div className="bg-danger-soft text-danger text-sm px-4 py-3 rounded-lg mb-4 animate-fade-in-up">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <Input
                label="Email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@1cloudhub.com"
                icon={<Mail size={16} />}
                className="transition-shadow focus:shadow-[0_0_0_4px_rgba(91,95,239,0.12)]"
                required
              />
            </div>

            <div className="animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-body font-semibold text-ink">Password</label>
                <a href="#" className="text-body text-brand hover:text-brand-deep transition-colors">
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
                  className="w-full pl-9 pr-10 py-2.5 rounded-lg border border-gray-200 text-sm font-body text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 focus:shadow-[0_0_0_4px_rgba(91,95,239,0.12)] transition-shadow"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-transform hover:scale-110"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          <div
            className="group relative overflow-hidden rounded-lg mt-6 animate-fade-in-up"
            style={{ animationDelay: '0.2s' }}
          >
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
            <span className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out bg-gradient-to-r from-transparent via-white/25 to-transparent" />
          </div>

          <div className="flex items-center gap-3 my-4 animate-fade-in-up" style={{ animationDelay: '0.22s' }}>
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-caption text-gray-400 font-medium">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <button
            type="button"
            onClick={handleMicrosoftSignIn}
            className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-lg border border-gray-200 text-sm font-semibold text-ink hover:bg-gray-50 transition-colors animate-fade-in-up"
            style={{ animationDelay: '0.24s' }}
          >
            <svg width="16" height="16" viewBox="0 0 21 21">
              <rect x="1" y="1" width="9" height="9" fill="#F25022" />
              <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
              <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
              <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
            </svg>
            Sign in with Microsoft
          </button>

          {/* Perforation divider */}
          <div className="my-5 h-px bg-[repeating-linear-gradient(90deg,#E6E7EB_0,#E6E7EB_3px,transparent_3px,transparent_7px)] animate-fade-in-up" style={{ animationDelay: '0.25s' }} />

          <p className="text-body text-gray-500 text-center animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            No account? Ask your workspace admin to send you an invite.
          </p>
        </form>
      </div>
    </div>
  )
}
