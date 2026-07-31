import type { Status, IssueType, Priority } from '../lib/constants'

export interface User {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  role: 'admin' | 'member'
}

export interface Project {
  id: string
  name: string
  key: string
  description?: string
  created_by: string
  created_at: string
}

export interface Epic {
  id: string
  project_id: string
  title: string
  description?: string
  owner_id: string
  owner?: User
  status: Status
  created_at: string
}

export interface Story {
  id: string
  epic_id: string
  project_id: string
  title: string
  description?: string
  type: IssueType
  status: Status
  priority: Priority
  assignee_id?: string
  assignee?: User
  reporter_id: string
  reporter?: User
  display_id: string
  created_at: string
  updated_at: string
}

export interface Comment {
  id: string
  story_id: string
  author_id: string
  author?: User
  content: string
  created_at: string
}

export interface Attachment {
  id: string
  story_id: string
  file_name: string
  file_url: string
  file_size: number
  uploaded_by: string
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  message: string
  read: boolean
  link?: string
  created_at: string
}
