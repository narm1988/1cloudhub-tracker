export const STATUS_OPTIONS = ['Created', 'Draft', 'Submitted', 'In Review', 'Resolved'] as const
export type Status = typeof STATUS_OPTIONS[number]

export const STATUS_META: Record<Status, { color: string; bg: string; tailwind: string }> = {
  Created: { color: '#6B7280', bg: '#F0F1F3', tailwind: 'bg-slate-100 text-slate-600' },
  Draft: { color: '#C6820F', bg: '#FBF0DD', tailwind: 'bg-amber-50 text-amber-700' },
  Submitted: { color: '#3B82F6', bg: '#EAF1FE', tailwind: 'bg-blue-50 text-blue-600' },
  'In Review': { color: '#8B5CF6', bg: '#F2EEFD', tailwind: 'bg-violet-50 text-violet-600' },
  Resolved: { color: '#1E9E6B', bg: '#E7F6EF', tailwind: 'bg-emerald-50 text-emerald-600' },
}

export const ISSUE_TYPES = ['Epic', 'Story', 'Task', 'Bug'] as const
export type IssueType = typeof ISSUE_TYPES[number]

export const PRIORITY_OPTIONS = ['Critical', 'High', 'Medium', 'Low'] as const
export type Priority = typeof PRIORITY_OPTIONS[number]
