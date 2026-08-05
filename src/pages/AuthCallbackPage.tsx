import { useEffect, useRef, useState } from 'react'
import { Cloud } from 'lucide-react'
import { setToken } from '../lib/api'

export default function AuthCallbackPage() {
  const handled = useRef(false)
  const [debug, setDebug] = useState('')

  useEffect(() => {
    if (handled.current) return
    handled.current = true

    const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : ''
    const token = new URLSearchParams(hash).get('token')

    if (!token) {
      setDebug(`No token found. Hash: "${window.location.hash}", Full URL: "${window.location.href}"`)
      setTimeout(() => {
        window.location.href = '/login?error=missing_token'
      }, 5000)
      return
    }

    setDebug(`Token received (${token.length} chars). Saving and redirecting...`)
    setToken(token)
    setTimeout(() => {
      window.location.href = '/'
    }, 1000)
  }, [])

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-paper font-body gap-4">
      <div className="flex items-center gap-2.5 text-gray-400">
        <Cloud size={18} className="animate-pulse" />
        <span className="text-body">Signing you in...</span>
      </div>
      {debug && (
        <pre className="text-caption text-gray-500 bg-white border border-gray-200 rounded-lg p-4 max-w-lg break-all">
          {debug}
        </pre>
      )}
    </div>
  )
}
