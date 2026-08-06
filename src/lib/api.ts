import type { Project, User } from '../types'

// Same-origin in production (vercel.json rewrites /api/* to the Python
// function); override for local dev if the backend runs on a different port.
const API_BASE = import.meta.env.VITE_API_URL || '/api'
const TOKEN_KEY = '1ch_access_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

interface AuthResponse {
  access_token: string
  user: User
}

class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ApiError(res.status, body.detail || `Request failed (${res.status})`)
  }

  if (res.status === 204) return undefined as T
  return res.json()
}

export const api = {
  login(email: string, password: string) {
    return request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  },

  entraLoginUrl() {
    return `${API_BASE}/auth/entra/login`
  },

  me() {
    return request<User>('/auth/me')
  },

  logout() {
    return request<{ message: string }>('/auth/logout', { method: 'POST' })
  },

  invite(email: string, role: string) {
    return request<{ message: string }>('/auth/invite', {
      method: 'POST',
      body: JSON.stringify({ email, role }),
    })
  },

  acceptInvite(token: string, password: string, fullName: string) {
    return request<AuthResponse>('/auth/accept-invite', {
      method: 'POST',
      body: JSON.stringify({ token, password, full_name: fullName }),
    })
  },

  removePerson(userId: string) {
    return request<{ message: string }>(`/people/${userId}`, { method: 'DELETE' })
  },

  listProjects(page: number, pageSize = 12) {
    return request<{ data: Project[]; total: number }>(`/projects/?page=${page}&page_size=${pageSize}`)
  },

  getProject(id: string) {
    return request<Project>(`/projects/${id}`)
  },

  createProject(name: string, key: string, description: string) {
    return request<Project>('/projects/', {
      method: 'POST',
      body: JSON.stringify({ name, key, description: description || null }),
    })
  },
}

export { ApiError }
