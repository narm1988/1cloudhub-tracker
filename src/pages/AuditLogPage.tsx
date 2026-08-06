import { useEffect, useState } from 'react'
import { History } from 'lucide-react'
import { api } from '../lib/api'
import type { ActivityLogEntry } from '../types'
import Avatar from '../components/ui/Avatar'
import Card from '../components/ui/Card'
import Pagination from '../components/ui/Pagination'
import EmptyState from '../components/ui/EmptyState'
import LoadingSkeleton from '../components/ui/LoadingSkeleton'
import { useDocumentTitle } from '../lib/useDocumentTitle'

const PAGE_SIZE = 25

function describeAction(log: ActivityLogEntry) {
  const name = log.user?.full_name || 'Someone'
  switch (log.action) {
    case 'created':
      return <><strong className="text-gray-900">{name}</strong> created a {log.parent_type}</>
    case 'deleted':
      return <><strong className="text-gray-900">{name}</strong> deleted a {log.parent_type}</>
    case 'comment_added':
      return <><strong className="text-gray-900">{name}</strong> added a comment</>
    case 'attachment_added':
      return <><strong className="text-gray-900">{name}</strong> attached "{log.new_value}"</>
    case 'label_added':
      return <><strong className="text-gray-900">{name}</strong> added label "{log.new_value}"</>
    case 'updated': {
      const field = log.field_name || 'a field'
      return <><strong className="text-gray-900">{name}</strong> changed <span className="text-gray-600">{field}</span> from "{log.old_value || 'empty'}" to "{log.new_value || 'empty'}"</>
    }
    default:
      return <><strong className="text-gray-900">{name}</strong> {log.action}</>
  }
}

export default function AuditLogPage() {
  useDocumentTitle('Audit Log')
  const [logs, setLogs] = useState<ActivityLogEntry[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLogs()
  }, [page])

  async function fetchLogs() {
    setLoading(true)
    try {
      const { data, total } = await api.listGlobalActivity(page, PAGE_SIZE)
      setLogs(data)
      setTotal(total)
    } catch {}
    setLoading(false)
  }

  if (loading && logs.length === 0) {
    return (
      <div>
        <div className="mb-4">
          <div className="h-[17px] w-28 rounded bg-gray-200 animate-pulse" />
          <div className="h-3.5 w-48 rounded bg-gray-100 animate-pulse mt-2" />
        </div>
        <LoadingSkeleton variant="rows" count={8} />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-[17px] font-semibold tracking-[-0.01em] text-gray-900">Audit Log</h1>
        <p className="text-[12px] text-gray-500 mt-1">
          <span className="font-mono tabular-nums">{total}</span> actions recorded
        </p>
      </div>

      {logs.length === 0 ? (
        <EmptyState
          icon={<History size={32} />}
          title="No activity yet"
          description="User actions like creates, updates, and deletes will appear here."
        />
      ) : (
        <Card padding="none" className="overflow-hidden divide-y divide-gray-100">
          {logs.map((log) => (
            <div key={log.id} className="flex items-center gap-3 px-4 py-2.5">
              <span className="shrink-0">
                <Avatar name={log.user?.full_name || 'User'} size="sm" />
              </span>
              <div className="flex-1 min-w-0 text-[12px] text-gray-600 truncate">
                {describeAction(log)}
              </div>
              <span className="text-[11px] font-mono text-gray-400 shrink-0">
                {new Date(log.created_at).toLocaleString()}
              </span>
            </div>
          ))}
        </Card>
      )}

      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
    </div>
  )
}
