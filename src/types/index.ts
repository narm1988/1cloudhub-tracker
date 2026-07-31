import type { Status, IssueType, Priority, LinkType } from '../lib/constants'

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

// Story lives under an Epic (feature-level work)
export interface Story {
  id: string
  epic_id: string
  project_id?: string
  sprint_id?: string
  title: string
  description?: string
  status: Status
  priority: Priority
  assignee_id?: string
  assignee?: User
  reporter_id: string
  reporter?: User
  display_id: string
  start_date?: string
  due_date?: string
  story_points?: number
  created_at: string
  updated_at: string
}

// Issues (Task, Bug, Sub-task) live under a Story
export interface Issue {
  id: string
  story_id: string
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
  start_date?: string
  due_date?: string
  story_points?: number
  created_at: string
  updated_at: string
}

// Linked/dependent issues
export interface IssueLink {
  id: string
  source_id: string
  source_type: 'story' | 'issue'
  target_id: string
  target_type: 'story' | 'issue'
  link_type: LinkType
  created_at: string
}

export interface Comment {
  id: string
  parent_id: string // can be story_id or issue_id
  parent_type: 'story' | 'issue'
  author_id: string
  author?: User
  content: string
  created_at: string
}

export interface Attachment {
  id: string
  parent_id: string
  parent_type: 'story' | 'issue'
  file_name: string
  file_url: string
  file_size: number
  uploaded_by: string
  uploader?: User
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
