import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, BookOpen } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { STATUS_OPTIONS, STATUS_META, PRIORITY_META } from '../lib/constants'
import type { Status, Priority } from '../lib/constants'
import type { Epic, Story } from '../types'
import Button from '../components/ui/Button'
import Avatar from '../components/ui/Avatar'
import StatusBadge from '../components/ui/StatusBadge'

export default function EpicDetailPage() {
  const { epicId } = useParams<{ epicId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [epic, setEpic] = useState<Epic | null>(null)
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (epicId) {
      fetchEpic()
      fetchStories()
    }
  }, [epicId])

  async function fetchEpic() {
    const { data } = await supabase
      .from('epics')
      .select('*, owner:profiles!epics_owner_id_fkey(id, full_name, email)')
      .eq('id', epicId)
      .single()
    if (data) setEpic(data)
    setLoading(false)
  }

  async function fetchStories() {
    const { data } = await supabase
      .from('stories')
      .select('*, assignee:profiles!stories_assignee_id_fkey(id, full_name, email), reporter:profiles!stories_reporter_id_fkey(id, full_name, email)')
      .eq('epic_id', epicId)
      .order('created_at', { ascending: false })
    if (data) setStories(data)
  }

  async function createStory() {
    // Get total story count from DB to avoid duplicate display_id conflicts
    const { count } = await supabase
      .from('stories')
      .select('id', { count: 'exact', head: true })

    const displayId = `1CH-${100 + (count || 0) + 1}`

    const { data, error } = await supabase.from('stories').insert({
      epic_id: epicId,
      title: 'Untitled story',
      reporter_id: user?.id,
      status: 'Created',
      priority: 'Medium',
      display_id: displayId,
    }).select().single()

    if (!error && data) {
      navigate(`/stories/${data.id}`)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>
  }

  if (!epic) {
    return <div className="text-gray-500">Epic not found.</div>
  }

  const doneCount = stories.filter((s) => s.status === 'Done').length

  return (
    <div>
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
          <h1 className="font-display text-[22px] font-semibold text-ink mt-0.5">{epic.title}</h1>
          {epic.description && (
            <p className="text-[13px] text-gray-500 mt-1.5 max-w-xl">{epic.description}</p>
          )}
          <div className="flex items-center gap-4 mt-2 text-[13px] text-gray-500">
            <span>Owner: <strong className="text-ink">{epic.owner?.full_name || 'Unassigned'}</strong></span>
            <span>{stories.length} stories</span>
            <span>{doneCount}/{stories.length} done</span>
          </div>
        </div>
        <Button onClick={createStory}>
          <Plus size={14} /> New story
        </Button>
      </div>

      {/* Kanban board */}
      <div className="grid gap-4 overflow-x-auto" style={{ gridTemplateColumns: `repeat(${STATUS_OPTIONS.length}, minmax(220px, 1fr))` }}>
        {STATUS_OPTIONS.map((status) => {
          const items = stories.filter((s) => s.status === status)
          return (
            <div key={status}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[12.5px] font-semibold text-gray-500 uppercase tracking-wide">
                  {status}
                </span>
                <span className="text-[11.5px] text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
                  {items.length}
                </span>
              </div>

              <div className="space-y-2.5">
                {items.map((story) => (
                  <StoryCard
                    key={story.id}
                    story={story}
                    onClick={() => navigate(`/stories/${story.id}`)}
                  />
                ))}
                {items.length === 0 && (
                  <div className="border border-dashed border-gray-200 rounded-lg py-4 text-center text-[12px] text-gray-400">
                    No stories
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

    </div>
  )
}

function StoryCard({ story, onClick }: { story: Story; onClick: () => void }) {
  const statusColor = STATUS_META[story.status as Status]?.color || '#6B7280'

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
          <span className="font-mono text-[11px] text-gray-400">{story.display_id}</span>
        </div>
        <span className="text-[11px]">{PRIORITY_META[story.priority as Priority]?.icon}</span>
      </div>

      {/* Perforation */}
      <div className="h-px my-2 bg-[repeating-linear-gradient(90deg,#F0F1F3_0,#F0F1F3_2px,transparent_2px,transparent_6px)]" />

      <div className="text-[13.5px] text-ink font-medium leading-snug mb-2.5">
        {story.title}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {story.assignee ? (
            <Avatar name={story.assignee.full_name} size="sm" />
          ) : (
            <span className="text-[10.5px] text-gray-400">Unassigned</span>
          )}
        </div>
        <StatusBadge status={story.status as Status} />
      </div>
    </div>
  )
}

