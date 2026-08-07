import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, Cloud } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Button from '../components/ui/Button'
import { useDocumentTitle } from '../lib/useDocumentTitle'

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
  useDocumentTitle('Sign in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, signInWithMicrosoft, user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const err = searchParams.get('error')
    const detail = searchParams.get('detail')
    if (err) setError(detail ? `${err}: ${detail}` : err)
  }, [searchParams])

  if (user) {
    navigate('/', { replace: true })
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await signIn(email, password)
    if (error) { setError(error); setLoading(false) }
    else navigate('/', { replace: true })
  }

  function handleMicrosoftSignIn() {
    setError('')
    signInWithMicrosoft()
  }

  return (
    <div className="flex min-h-screen w-full bg-[#fafafa] animate-fade-in">
      {/* Left brand panel */}
      <div className="hidden lg:flex flex-col justify-between w-[44%] bg-ink text-white p-10 relative overflow-hidden">
        {/* Aurora mesh */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute w-80 h-80 -top-16 -left-10 rounded-full bg-brand blur-3xl opacity-40 mix-blend-screen animate-aurora-a" />
          <div className="absolute w-72 h-72 bottom-0 -right-16 rounded-full bg-success blur-3xl opacity-30 mix-blend-screen animate-aurora-b" />
          <div className="absolute w-64 h-64 top-1/3 left-1/3 rounded-full bg-warning blur-3xl opacity-25 mix-blend-screen animate-aurora-c" />
        </div>

        {/* Light sweep */}
        <div
          className="absolute -top-1/4 w-[40%] h-[150%] -skew-x-[18deg] pointer-events-none animate-light-sweep"
          style={{ background: 'linear-gradient(100deg, transparent, rgba(255,255,255,0.08) 45%, rgba(91,95,239,0.12) 55%, transparent)' }}
        />

        {/* Starfield */}
        <div className="absolute inset-0 pointer-events-none">
          {STARS.map((s, i) => (
            <span
              key={i}
              className="absolute rounded-full bg-white animate-twinkle"
              style={{ top: s.top, left: s.left, width: s.size, height: s.size, animationDelay: `${s.delay}s` }}
            />
          ))}
        </div>

        {/* Logo */}
        <div className="flex items-center gap-2.5 relative z-10">
          <div className="relative w-7 h-7 shrink-0">
            <div className="absolute -inset-2 rounded-full border border-dashed border-white/15 animate-orbit-spin-slow" />
            <div className="absolute -inset-2 animate-orbit-spin">
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-brand shadow-[0_0_6px_2px_rgba(91,95,239,0.7)]" />
            </div>
            <div className="relative w-7 h-7 rounded-md bg-brand flex items-center justify-center">
              <Cloud size={14} className="text-white" />
            </div>
          </div>
          <div>
            <div className="font-semibold text-[15px] tracking-tight leading-none">1CloudHub</div>
            <div className="text-[10px] tracking-[0.12em] text-gray-500 mt-0.5 uppercase">Orbit</div>
          </div>
        </div>

        {/* Tagline */}
        <div className="max-w-xs relative z-10 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
          <h2 className="text-[28px] font-medium leading-[1.2] tracking-[-0.02em] mb-3">
            Where 1CloudHub tracks the work.
          </h2>
          <p className="text-[13px] text-gray-400 leading-relaxed">
            Epics and user stories for our internal delivery — created, assigned and resolved in one place.
          </p>
        </div>

        {/* Floating ticket stubs */}
        <div className="relative h-36 z-10">
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
              <div className={`relative overflow-hidden w-64 h-12 bg-ink-faint rounded-md ${t.rot} flex items-center px-3.5 shadow-lg border-l-[3px] ${t.accent}`}>
                <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
                <span className="font-mono text-[11px] text-gray-500 tracking-wide">{t.id}</span>
                <div className="flex-1 h-px mx-2 bg-[repeating-linear-gradient(90deg,#3A3F55_0,#3A3F55_2px,transparent_2px,transparent_6px)]" />
                <span className="w-12 h-1.5 rounded bg-ink-faint" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <form onSubmit={handleSubmit} className="w-full max-w-[340px]">
          {/* Mobile logo */}
          <div className="lg:hidden mb-6 flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-brand flex items-center justify-center">
              <Cloud size={12} className="text-white" />
            </div>
            <span className="text-[13px] font-semibold text-gray-800">1CloudHub Orbit</span>
          </div>

          <div className="animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
            <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-gray-900 mb-0.5">
              Sign in
            </h1>
            <p className="text-[13px] text-gray-500 mb-6">
              Use the workspace email your admin invited you with.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-[13px] px-3 py-2.5 rounded-md mb-4 border border-red-100 animate-fade-in-up">
              {error}
            </div>
          )}

          <div className="space-y-3.5">
            <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <label className="block text-[13px] font-medium text-gray-700 mb-1">Email address</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Mail size={15} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@1cloudhub.com"
                  className="w-full h-9 pl-9 pr-3 rounded-md border border-gray-200 bg-white text-[13px] text-gray-900 placeholder:text-gray-400 outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition-all"
                  required
                />
              </div>
            </div>

            <div className="animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[13px] font-medium text-gray-700">Password</label>
                <a href="#" className="text-[12px] text-brand hover:text-brand-deep transition-colors">
                  Forgot?
                </a>
              </div>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Lock size={15} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full h-9 pl-9 pr-9 rounded-md border border-gray-200 bg-white text-[13px] text-gray-900 placeholder:text-gray-400 outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-5 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </div>

          <div className="flex items-center gap-3 my-4 animate-fade-in-up" style={{ animationDelay: '0.22s' }}>
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-[11px] text-gray-400 uppercase tracking-wide">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={handleMicrosoftSignIn}
            className="w-full animate-fade-in-up"
            style={{ animationDelay: '0.24s' }}
          >
            <svg width="14" height="14" viewBox="0 0 21 21">
              <rect x="1" y="1" width="9" height="9" fill="#F25022" />
              <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
              <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
              <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
            </svg>
            Sign in with Microsoft
          </Button>

          <p className="text-[12px] text-gray-400 text-center mt-5 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            No account? Ask your workspace admin to send you an invite.
          </p>
        </form>
      </div>
    </div>
  )
}
