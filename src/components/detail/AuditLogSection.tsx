import { useState } from 'react'
import { History, ChevronDown } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import Avatar from '../ui/Avatar'
import { SECTION_HEADER } from './DetailFields'

interface ActivityLogEntry {
  id: string
  action: string
  field_name: string | null
  old_value: string | null
  new_value: string | null
  created_at: string
  user: { id: string; full_name: string } | null
}

function describeActivity(log: ActivityLogEntry) {
  const name = log.user?.full_name || 'Someone'
  switch (log.action) {
    case 'created':
      return `${name} created this`
    case 'comment_added':
      return `${name} added a comment`
    case 'attachment_added':
      return `${name} attached "${log.new_value}"`
    case 'label_added':
      return `${name} added label "${log.new_value}"`
    case 'updated': {
      const field = log.field_name || 'a field'
      const from = log.old_value || 'empty'
      const to = log.new_value || 'empty'
      return `${name} changed ${field} from "${from}" to "${to}"`
    }
    default:
      return `${name} ${log.action}`
  }
}

export default function AuditLogSection({
  parentId,
  parentType,
}: {
  parentId: string
  parentType: 'story' | 'issue'
}) {
  const [logs, setLogs] = useState<ActivityLogEntry[]>([])
  const [open, setOpen] = useState(false)
  const [loaded, setLoaded] = useState(false)

  async function fetchLogs() {
    const { data } = await supabase
      .from('activity_log')
      .select('*, user:profiles!activity_log_user_id_fkey(id, full_name)')
      .eq('parent_id', parentId)
      .eq('parent_type', parentType)
      .order('created_at', { ascending: false })
    if (data) setLogs(data as unknown as ActivityLogEntry[])
    setLoaded(true)
  }

  function toggle() {
    setOpen((o) => !o)
    if (!loaded) fetchLogs()
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
      <button onClick={toggle} className="w-full flex items-center justify-between">
        <h2 className={`${SECTION_HEADER} flex items-center gap-2`}>
          <History size={15} /> Audit Log{loaded ? <> (<span className="font-mono tabular-nums">{logs.length}</span>)</> : ''}
        </h2>
        <ChevronDown size={16} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="mt-4 space-y-3">
          {!loaded ? (
            <p className="text-[13px] text-gray-400 text-center py-2">Loading...</p>
          ) : logs.length === 0 ? (
            <p className="text-[13px] text-gray-400 text-center py-2">No activity yet.</p>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="flex items-start gap-2.5">
                <Avatar name={log.user?.full_name || 'User'} size="sm" />
                <div className="flex-1 min-w-0">
                  <span className="text-[12.5px] text-gray-700">{describeActivity(log)}</span>
                  <span className="text-[11px] text-gray-400 ml-2">{new Date(log.created_at).toLocaleString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
