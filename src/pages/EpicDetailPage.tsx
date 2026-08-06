import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, BookOpen, ArrowDownToLine } from 'lucide-react'
import { api } from '../lib/api'
import { STATUS_OPTIONS, STATUS_META, PRIORITY_META } from '../lib/constants'
import type { Status, Priority } from '../lib/constants'
import type { Epic, Story } from '../types'
import Button from '../components/ui/Button'
import Avatar from '../components/ui/Avatar'
import StatusBadge from '../components/ui/StatusBadge'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import Breadcrumbs from '../components/ui/Breadcrumbs'
import { useToast } from '../context/ToastContext'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import LoadingSkeleton from '../components/ui/LoadingSkeleton'

export default function EpicDetailPage() {
  const { epicId } = useParams<{ epicId: string }>()
  const navigate = useNavigate()

  const toast = useToast()
  const [epic, setEpic] = useState<Epic | null>(null)
  useDocumentTitle(epic?.title)
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const [movingToBacklog, setMovingToBacklog] = useState(false)
  const [confirmBacklog, setConfirmBacklog] = useState(false)

  useEffect(() => {
    if (epicId) {
      fetchEpic()
      fetchStories()
    }
  }, [epicId])

  async function fetchEpic() {
    try {
      const data = await api.getEpic(epicId!)
      setEpic(data)
    } catch {
      // Falls through to the "Epic not found" state below.
    }
    setLoading(false)
  }

  async function fetchStories() {
    try {
      const data = await api.listStories(epicId)
      setStories(data)
    } catch {
      // Leave whatever was already loaded in place.
    }
  }

  function moveEpicToBacklog() {
    if (stories.length === 0) return
    setConfirmBacklog(true)
  }

  async function confirmMoveEpicToBacklog() {
    setConfirmBacklog(false)
    setMovingToBacklog(true)
    try {
      await api.moveEpicToBacklog(epicId!)
      await fetchStories()
      toast.success('Moved to backlog')
    } catch {
      toast.error('Failed to move to backlog.')
    } finally {
      setMovingToBacklog(false)
    }
  }

  if (loading) {
    return (
      <div>
        <div className="h-4 w-20 rounded bg-gray-100 animate-pulse mb-4" />
        <div className="h-[17px] w-56 rounded bg-gray-200 animate-pulse mb-6" />
        <LoadingSkeleton variant="rows" count={4} />
      </div>
    )
  }

  if (!epic) {
    return <div className="text-gray-500">Epic not found.</div>
  }

  const doneCount = stories.filter((s) => s.status === 'Done').length

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: 'Epics', href: '/epics' },
          ...(epic.project ? [{ label: epic.project.name, href: `/projects/${epic.project.id}` }] : []),
          { label: epic.title },
        ]}
      />

      {/* Back button */}
      <button
        onClick={() => navigate('/epics')}
        className="flex items-center gap-1.5 text-gray-500 text-[13px] hover:text-gray-700 transition-colors mb-4"
      >
        <ArrowLeft size={14} /> All epics
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <span className="font-mono text-[12px] text-gray-400">{epic.id.slice(0, 8)}</span>
          <h1 className="text-[17px] font-semibold tracking-[-0.01em] text-gray-900 mt-0.5">{epic.title}</h1>
          {epic.description && (
            <p className="text-[13px] text-gray-500 mt-1.5 max-w-xl">{epic.description}</p>
          )}
          <div className="flex items-center gap-4 mt-2 text-[13px] text-gray-500">
            <span>Owner: <strong className="text-gray-900">{epic.owner?.full_name || 'Unassigned'}</strong></span>
            <span><span className="font-mono tabular-nums">{stories.length}</span> stories</span>
            <span><span className="font-mono tabular-nums">{doneCount}/{stories.length}</span> done</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={moveEpicToBacklog}
            disabled={movingToBacklog || stories.length === 0}
            title="Unschedule this epic's stories and their issues from any sprint"
          >
            <ArrowDownToLine size={13} /> {movingToBacklog ? 'Moving...' : 'Move to backlog'}
          </Button>
          <Button size="sm" onClick={() => navigate(`/stories/new?epicId=${epicId}`)}>
            <Plus size={13} /> New story
          </Button>
        </div>
      </div>

      {/* Kanban board */}
      <div className="flex gap-4 overflow-x-auto scroll-thin pb-3 -mx-1 px-1">
        {STATUS_OPTIONS.map((status) => {
          const items = stories.filter((s) => s.status === status)
          return (
            <div key={status} className="w-[240px] shrink-0">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide">
                  {status}
                </span>
                <span className="text-[11px] font-mono tabular-nums text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
                  {items.length}
                </span>
              </div>

              <div className="space-y-2.5">
                {items.map((story) => (
                  <StoryCard
                    key={story.id}
                    story={story}
                    onClick={() => navigate(`/stories/${story.display_id}`)}
                  />
                ))}
                {items.length === 0 && (
                  <div className="border border-dashed border-gray-200 rounded-lg py-4 text-center text-[13px] text-gray-400">
                    No stories
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {confirmBacklog && (
        <ConfirmDialog
          title="Move to backlog"
          message={`Move "${epic?.title}" to backlog? This unschedules all ${stories.length} of its stories and their tasks/bugs/sub-tasks from any sprint.`}
          confirmLabel="Move to backlog"
          onConfirm={confirmMoveEpicToBacklog}
          onCancel={() => setConfirmBacklog(false)}
        />
      )}
    </div>
  )
}

function StoryCard({ story, onClick }: { story: Story; onClick: () => void }) {
  const statusColor = STATUS_META[story.status as Status]?.color || '#475569'

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl border border-gray-200 p-3.5 cursor-pointer hover:border-brand/30 hover:shadow-sm transition-all"
      style={{ borderLeftWidth: 3, borderLeftColor: statusColor }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="bg-emerald-50 rounded p-0.5 flex">
            <BookOpen size={11} className="text-emerald-600" />
          </div>
          <span className="font-mono text-[12px] text-gray-400">{story.display_id}</span>
        </div>
        <span className="text-[12px]" style={{ color: PRIORITY_META[story.priority as Priority]?.color }}>{PRIORITY_META[story.priority as Priority]?.icon}</span>
      </div>

      {/* Perforation */}
      <div className="h-px my-2 bg-[repeating-linear-gradient(90deg,#F0F1F3_0,#F0F1F3_2px,transparent_2px,transparent_6px)]" />

      <div className="text-[13px] text-gray-900 font-medium leading-snug mb-2.5">
        {story.title}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {story.assignee ? (
            <Avatar name={story.assignee.full_name} size="sm" />
          ) : (
            <span className="text-xs text-gray-400">Unassigned</span>
          )}
        </div>
        <StatusBadge status={story.status as Status} />
      </div>
    </div>
  )
}

