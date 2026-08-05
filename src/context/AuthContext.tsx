import { createContext, useContext, useEffect, useState } from 'react'
import type { User } from '../types'
import { api, ApiError, clearToken, getToken, setToken } from '../lib/api'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signInWithMicrosoft: () => void
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    restoreSession()
  }, [])

  async function restoreSession() {
    const token = getToken()
    if (!token) {
      setLoading(false)
      return
    }
    try {
      const profile = await api.me()
      setUser(profile)
    } catch {
      // Token missing/expired/invalid — drop it and fall back to signed-out.
      clearToken()
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  async function signIn(email: string, password: string) {
    try {
      const { access_token, user } = await api.login(email, password)
      setToken(access_token)
      setUser(user)
      return { error: null }
    } catch (err) {
      return { error: err instanceof ApiError ? err.message : 'Failed to sign in' }
    }
  }

  function signInWithMicrosoft() {
    // Full-page redirect into the backend's own Entra OAuth flow — it
    // eventually redirects back to /auth/callback with our JWT.
    window.location.href = api.entraLoginUrl()
  }

  async function signOut() {
    clearToken()
    setUser(null)
    api.logout().catch(() => {
      // Stateless token — nothing to reconcile if this fails, the client
      // side is already signed out.
    })
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signInWithMicrosoft, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
