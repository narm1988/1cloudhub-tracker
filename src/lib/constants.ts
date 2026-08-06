// lucide-react icon sizes currently range from 10-20px used interchangeably
// with no rule for context. Not retrofitted across existing icons (~180
// call sites, too high-risk to mass-edit blind) — reach for these on new
// icons instead of picking another one-off number.
export const ICON_SIZE = {
  inline: 13,  // inline with 12-13px text: buttons, list-row actions
  action: 15,  // section-header icons, standalone icon buttons
  nav: 16,     // nav bar / toolbar icons
} as const

// 'Draft' was folded into 'Created' (same meaning, kept one canonical label).
// Closed/Archived are terminal states reachable only from Done; Reopen sends
// an item back to an active state (see the Reopen control on the detail pages).
export const STATUS_OPTIONS = ['Created', 'In Progress', 'In Review', 'Done', 'Closed', 'Archived'] as const
export type Status = typeof STATUS_OPTIONS[number]

// color/bg are kept in sync with the hex the `tailwind` class actually
// resolves to (its text-*/bg-* stop), so the left-border accent on story
// cards (which reads .color directly, not through Tailwind) always matches
// the status badge pill sitting right next to it.
export const STATUS_META: Record<Status, { color: string; bg: string; tailwind: string }> = {
  Created: { color: '#475569', bg: '#F1F5F9', tailwind: 'bg-slate-100 text-slate-600' },
  'In Progress': { color: '#2563EB', bg: '#EFF6FF', tailwind: 'bg-blue-50 text-blue-600' },
  'In Review': { color: '#7C3AED', bg: '#F5F3FF', tailwind: 'bg-violet-50 text-violet-600' },
  Done: { color: '#059669', bg: '#ECFDF5', tailwind: 'bg-emerald-50 text-emerald-600' },
  Closed: { color: '#374151', bg: '#E5E7EB', tailwind: 'bg-gray-200 text-gray-700' },
  Archived: { color: '#57534E', bg: '#F5F5F4', tailwind: 'bg-stone-100 text-stone-600' },
}

// Statuses that Done/Closed/Archived items can be sent back to via "Reopen".
export const REOPEN_TARGETS: Status[] = ['Created', 'In Progress', 'In Review']
export const TERMINAL_STATUSES: Status[] = ['Done', 'Closed', 'Archived']

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

export const PRIORITY_META: Record<Priority, { icon: string; color: string; tailwind: string }> = {
  Critical: { icon: '●', color: '#DC2626', tailwind: 'text-red-600' },
  High: { icon: '●', color: '#EA580C', tailwind: 'text-orange-500' },
  Medium: { icon: '●', color: '#CA8A04', tailwind: 'text-yellow-600' },
  Low: { icon: '●', color: '#16A34A', tailwind: 'text-green-500' },
}

export const LINK_TYPES = ['blocks', 'is blocked by', 'relates to', 'duplicates', 'is duplicated by'] as const
export type LinkType = typeof LINK_TYPES[number]
