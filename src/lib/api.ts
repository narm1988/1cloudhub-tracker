import type {
  ActivityLogEntry, Attachment, Comment, Epic, Issue, IssueLink, Label,
  Notification, Project, Sprint, Story, User,
} from '../types'

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

/** Reads the `exp` claim (ms since epoch) out of a JWT without verifying
 * it — verification is the backend's job, this is only used client-side
 * to schedule the session-expiry warning. */
export function getTokenExpiry(token: string): number | null {
  try {
    const payload = token.split('.')[1]
    const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
    return typeof json.exp === 'number' ? json.exp * 1000 : null
  } catch {
    return null
  }
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
  // FormData (file uploads) must NOT get a manual Content-Type — the browser
  // sets the multipart boundary itself only when it's left unset.
  const isFormData = options.body instanceof FormData
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
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

function qs(params: Record<string, string | number | undefined | null>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') search.set(key, String(value))
  }
  const s = search.toString()
  return s ? `?${s}` : ''
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

  refreshToken() {
    return request<{ access_token: string }>('/auth/refresh', { method: 'POST' })
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

  listProjects(page: number, pageSize = 12, archived = false) {
    return request<{ data: Project[]; total: number }>(`/projects/${qs({ page, page_size: pageSize, archived: archived ? 'true' : undefined })}`)
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

  archiveProject(id: string) {
    return request<{ message: string }>(`/projects/${id}/archive`, { method: 'POST' })
  },

  unarchiveProject(id: string) {
    return request<{ message: string }>(`/projects/${id}/unarchive`, { method: 'POST' })
  },

  // ---- People ----
  listPeople(page: number, pageSize = 20) {
    return request<{ data: User[]; total: number }>(`/people/${qs({ page, page_size: pageSize })}`)
  },

  updatePerson(id: string, updates: Partial<Pick<User, 'full_name' | 'role' | 'avatar_url'>>) {
    return request<User>(`/people/${id}`, { method: 'PATCH', body: JSON.stringify(updates) })
  },

  // ---- Epics ----
  listEpics(page: number, pageSize = 12, archived = false) {
    return request<{ data: Epic[]; total: number }>(`/epics/${qs({ page, page_size: pageSize, archived: archived ? 'true' : undefined })}`)
  },

  getEpic(id: string) {
    return request<Epic>(`/epics/${id}`)
  },

  createEpic(data: { title: string; description?: string | null; project_id?: string | null }) {
    return request<Epic>('/epics/', { method: 'POST', body: JSON.stringify(data) })
  },

  updateEpic(id: string, updates: Partial<Pick<Epic, 'title' | 'description' | 'status' | 'owner_id'>>) {
    return request<Epic>(`/epics/${id}`, { method: 'PATCH', body: JSON.stringify(updates) })
  },

  deleteEpic(id: string) {
    return request<{ message: string }>(`/epics/${id}`, { method: 'DELETE' })
  },

  archiveEpic(id: string) {
    return request<{ message: string }>(`/epics/${id}/archive`, { method: 'POST' })
  },

  unarchiveEpic(id: string) {
    return request<{ message: string }>(`/epics/${id}/unarchive`, { method: 'POST' })
  },

  moveEpicToBacklog(id: string) {
    return request<{ message: string; story_count: number }>(`/epics/${id}/move-to-backlog`, { method: 'POST' })
  },

  // ---- Stories ----
  listStories(epicId?: string, projectId?: string, hasSprintOnly?: boolean) {
    return request<Story[]>(`/stories/${qs({ epic_id: epicId, project_id: projectId, has_sprint: hasSprintOnly === false ? 'no' : hasSprintOnly === true ? 'yes' : undefined })}`)
  },

  listBacklogStories(projectId: string, page: number, pageSize = 10) {
    return request<{ data: Story[]; total: number }>(`/stories/backlog${qs({ project_id: projectId, page, page_size: pageSize })}`)
  },

  getStory(id: string) {
    return request<Story>(`/stories/${id}`)
  },

  getStoryFull(id: string) {
    return request<{
      story: Story
      issues: Issue[]
      comments: Comment[]
      attachments: Attachment[]
      labels: Label[]
      links: IssueLink[]
      members: User[]
      epic: { id: string; title: string } | null
      all_stories: { id: string; display_id: string; title: string }[]
    }>(`/stories/full/${id}`)
  },

  createStory(data: Record<string, unknown>) {
    return request<Story>('/stories/', { method: 'POST', body: JSON.stringify(data) })
  },

  updateStory(id: string, updates: Record<string, unknown>) {
    return request<Story>(`/stories/${id}`, { method: 'PATCH', body: JSON.stringify(updates) })
  },

  deleteStory(id: string) {
    return request<{ message: string }>(`/stories/${id}`, { method: 'DELETE' })
  },

  // ---- Issues ----
  listIssues(storyId?: string) {
    return request<Issue[]>(`/issues/${qs({ story_id: storyId })}`)
  },

  getIssue(id: string) {
    return request<Issue>(`/issues/${id}`)
  },

  getIssueFull(id: string) {
    return request<{
      issue: Issue
      comments: Comment[]
      attachments: Attachment[]
      labels: Label[]
      members: User[]
      parent_story: { id: string; display_id: string; title: string } | null
    }>(`/issues/full/${id}`)
  },

  createIssue(data: Record<string, unknown>) {
    return request<Issue>('/issues/', { method: 'POST', body: JSON.stringify(data) })
  },

  updateIssue(id: string, updates: Record<string, unknown>) {
    return request<Issue>(`/issues/${id}`, { method: 'PATCH', body: JSON.stringify(updates) })
  },

  deleteIssue(id: string) {
    return request<{ message: string }>(`/issues/${id}`, { method: 'DELETE' })
  },

  // ---- Comments (story or issue) ----
  listComments(parentId: string, parentType: 'story' | 'issue') {
    return request<Comment[]>(`/comments/${qs({ parent_id: parentId, parent_type: parentType })}`)
  },

  createComment(parentId: string, parentType: 'story' | 'issue', content: string) {
    return request<Comment>('/comments/', {
      method: 'POST',
      body: JSON.stringify({ parent_id: parentId, parent_type: parentType, content }),
    })
  },

  deleteComment(id: string) {
    return request<{ message: string }>(`/comments/${id}`, { method: 'DELETE' })
  },

  // ---- Attachments (story or issue) ----
  listAttachments(parentId: string, parentType: 'story' | 'issue') {
    return request<Attachment[]>(`/attachments/${qs({ parent_id: parentId, parent_type: parentType })}`)
  },

  uploadAttachment(parentId: string, parentType: 'story' | 'issue', file: File) {
    const form = new FormData()
    form.append('file', file)
    return request<Attachment>(`/attachments/upload${qs({ parent_id: parentId, parent_type: parentType })}`, {
      method: 'POST',
      body: form,
    })
  },

  deleteAttachment(id: string) {
    return request<{ message: string }>(`/attachments/${id}`, { method: 'DELETE' })
  },

  // ---- Sprints ----
  listSprints(projectId: string) {
    return request<Sprint[]>(`/sprints/${qs({ project_id: projectId })}`)
  },

  createSprint(data: { project_id: string; name: string; goal?: string | null; start_date?: string | null; end_date?: string | null }) {
    return request<Sprint>('/sprints/', { method: 'POST', body: JSON.stringify(data) })
  },

  startSprint(id: string) {
    return request<Sprint>(`/sprints/${id}/start`, { method: 'POST' })
  },

  completeSprint(id: string) {
    return request<Sprint>(`/sprints/${id}/complete`, { method: 'POST' })
  },

  // ---- Labels ----
  listLabels() {
    return request<Label[]>('/labels/')
  },

  listAttachedLabels(parentId: string, parentType: 'story' | 'issue') {
    return request<Label[]>(`/labels/attached${qs({ parent_id: parentId, parent_type: parentType })}`)
  },

  createLabel(name: string, color: string, projectId?: string | null) {
    return request<Label>('/labels/', { method: 'POST', body: JSON.stringify({ name, color, project_id: projectId }) })
  },

  attachLabel(parentId: string, parentType: 'story' | 'issue', labelId: string) {
    return request<{ message: string }>('/labels/attach', {
      method: 'POST',
      body: JSON.stringify({ parent_id: parentId, parent_type: parentType, label_id: labelId }),
    })
  },

  detachLabel(parentId: string, parentType: 'story' | 'issue', labelId: string) {
    return request<{ message: string }>(
      `/labels/attach${qs({ parent_id: parentId, parent_type: parentType, label_id: labelId })}`,
      { method: 'DELETE' },
    )
  },

  // ---- Issue links ----
  listIssueLinks(itemId: string) {
    return request<IssueLink[]>(`/issue-links/${qs({ item_id: itemId })}`)
  },

  createIssueLink(data: Omit<IssueLink, 'id' | 'created_at'>) {
    return request<IssueLink>('/issue-links/', { method: 'POST', body: JSON.stringify(data) })
  },

  deleteIssueLink(id: string) {
    return request<{ message: string }>(`/issue-links/${id}`, { method: 'DELETE' })
  },

  // ---- Notifications (polled, no realtime) ----
  listNotifications() {
    return request<Notification[]>('/notifications/')
  },

  unreadNotificationCount() {
    return request<{ count: number }>('/notifications/unread-count')
  },

  markNotificationRead(id: string) {
    return request<{ message: string }>(`/notifications/${id}/read`, { method: 'PATCH' })
  },

  markAllNotificationsRead(ids: string[]) {
    return request<{ message: string }>('/notifications/mark-all-read', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    })
  },

  // ---- Search ----
  search(params: { q?: string; status?: string; priority?: string; assignee_id?: string; page?: number; page_size?: number }) {
    return request<{ data: (Story | Issue)[]; total: number }>(`/search/${qs(params)}`)
  },

  // ---- Activity log (read-only) ----
  listActivity(parentId: string, parentType: 'story' | 'issue' | 'epic') {
    return request<ActivityLogEntry[]>(`/activity-log/${qs({ parent_id: parentId, parent_type: parentType })}`)
  },

  listGlobalActivity(page: number, pageSize = 25) {
    return request<{ data: ActivityLogEntry[]; total: number }>(`/activity-log/global${qs({ page, page_size: pageSize })}`)
  },

  // ---- Assignment notification email ----
  notifyAssignment(data: {
    assignee_id: string
    item_type: string
    display_id: string
    title: string
    item_path: string
    breadcrumb?: string
    priority?: string
    due_date?: string
  }) {
    return request<{ success: boolean }>('/notify/assignment', { method: 'POST', body: JSON.stringify(data) })
  },
}

export { ApiError }
