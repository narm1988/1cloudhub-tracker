import { supabase } from './supabase'

type AssignmentNotice = {
  assigneeId: string
  itemType: 'Story' | 'Task' | 'Bug' | 'Sub-task' | 'Epic'
  displayId: string
  title: string
  breadcrumb?: string
  priority?: string
  dueDate?: string | null
  itemPath: string
}

// Fire-and-forget: an email failing to send should never block or roll back
// a save the user already completed in the UI.
export function notifyAssignment(notice: AssignmentNotice) {
  supabase.functions.invoke('send-assignment-email', {
    body: {
      ...notice,
      dueDate: notice.dueDate || undefined,
      appUrl: window.location.origin,
    },
  }).catch((err) => {
    console.warn('Assignment email failed to send:', err)
  })
}
