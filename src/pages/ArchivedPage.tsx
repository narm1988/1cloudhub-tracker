import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Flag, ArchiveRestore } from 'lucide-react'
import { api } from '../lib/api'
import type { Epic } from '../types'
import Card from '../components/ui/Card'
import Pagination from '../components/ui/Pagination'
import EmptyState from '../components/ui/EmptyState'
import LoadingSkeleton from '../components/ui/LoadingSkeleton'
import Avatar from '../components/ui/Avatar'

const PAGE_SIZE = 12

export default function ArchivedPage() {
  const [epics, setEpics] = useState<Epic[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchArchived()
  }, [page])

  async function fetchArchived() {
    setLoading(true)
    try {
      const { data, total } = await api.listEpics(page, PAGE_SIZE, true)
      setEpics(data)
      setTotal(total)
    } catch {}
    setLoading(false)
  }

  async function unarchiveEpic(id: string) {
    try {
      await api.unarchiveEpic(id)
      fetchArchived()
    } catch {}
  }

  if (loading && epics.length === 0) {
    return (
      <div>
        <div className="mb-4">
          <div className="h-[17px] w-28 rounded bg-gray-200 animate-pulse" />
          <div className="h-3.5 w-48 rounded bg-gray-100 animate-pulse mt-2" />
        </div>
        <LoadingSkeleton variant="rows" count={4} />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-[17px] font-semibold tracking-[-0.01em] text-gray-900">Archived</h1>
        <p className="text-[12px] text-gray-500 mt-1">
          <span className="font-mono tabular-nums">{total}</span> archived epics
        </p>
      </div>

      {epics.length === 0 ? (
        <EmptyState
          icon={<Flag size={32} />}
          title="No archived epics"
          description="Archived epics will appear here. You can archive epics from the Epics page."
        />
      ) : (
        <Card padding="none" className="overflow-hidden">
          {epics.map((epic, i) => (
            <div
              key={epic.id}
              className={`flex items-center gap-3 px-4 py-3 ${
                i < epics.length - 1 ? 'border-b border-gray-100' : ''
              }`}
            >
              <div className="bg-gray-100 rounded p-1 flex shrink-0">
                <Flag size={13} className="text-gray-400" />
              </div>
              <span className="font-mono text-[12px] text-gray-400 shrink-0 w-16">{epic.id.slice(0, 8)}</span>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium text-gray-700 truncate">{epic.title}</div>
                {epic.description && (
                  <div className="text-[12px] text-gray-400 truncate">{epic.description}</div>
                )}
              </div>
              {epic.project && (
                <span className="text-[11px] font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded shrink-0">
                  {epic.project.key}
                </span>
              )}
              {epic.owner && (
                <span className="shrink-0">
                  <Avatar name={epic.owner.full_name} size="sm" />
                </span>
              )}
              <button
                onClick={() => unarchiveEpic(epic.id)}
                title="Unarchive"
                className="text-brand hover:text-brand-deep shrink-0 transition-colors"
              >
                <ArchiveRestore size={14} />
              </button>
            </div>
          ))}
        </Card>
      )}

      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
    </div>
  )
}
