export const STATUS_OPTIONS = ['Created', 'Draft', 'In Progress', 'In Review', 'Done'] as const
export type Status = typeof STATUS_OPTIONS[number]

export const STATUS_META: Record<Status, { color: string; bg: string; tailwind: string }> = {
  Created: { color: '#6B7280', bg: '#F0F1F3', tailwind: 'bg-slate-100 text-slate-600' },
  Draft: { color: '#C6820F', bg: '#FBF0DD', tailwind: 'bg-amber-50 text-amber-700' },
  'In Progress': { color: '#3B82F6', bg: '#EAF1FE', tailwind: 'bg-blue-50 text-blue-600' },
  'In Review': { color: '#8B5CF6', bg: '#F2EEFD', tailwind: 'bg-violet-50 text-violet-600' },
  Done: { color: '#1E9E6B', bg: '#E7F6EF', tailwind: 'bg-emerald-50 text-emerald-600' },
}

// Jira-style hierarchy: Epic > Story > Task/Bug/Sub-task
export const ISSUE_TYPES = ['Story', 'Task', 'Bug', 'Sub-task'] as const
export type IssueType = typeof ISSUE_TYPES[number]

export const ISSUE_TYPE_META: Record<IssueType, { icon: string; color: string; tailwind: string }> = {
  Story: { icon: '📗', color: '#1E9E6B', tailwind: 'bg-emerald-50 text-emerald-700' },
  Task: { icon: '✅', color: '#3B82F6', tailwind: 'bg-blue-50 text-blue-700' },
  Bug: { icon: '🐛', color: '#E5484D', tailwind: 'bg-red-50 text-red-700' },
  'Sub-task': { icon: '📎', color: '#6B7280', tailwind: 'bg-gray-100 text-gray-600' },
}

export const PRIORITY_OPTIONS = ['Critical', 'High', 'Medium', 'Low'] as const
export type Priority = typeof PRIORITY_OPTIONS[number]

export const PRIORITY_META: Record<Priority, { icon: string; tailwind: string }> = {
  Critical: { icon: '🔴', tailwind: 'text-red-600' },
  High: { icon: '🟠', tailwind: 'text-orange-500' },
  Medium: { icon: '🟡', tailwind: 'text-yellow-500' },
  Low: { icon: '🟢', tailwind: 'text-green-500' },
}

export const LINK_TYPES = ['blocks', 'is blocked by', 'relates to', 'duplicates', 'is duplicated by'] as const
export type LinkType = typeof LINK_TYPES[number]
