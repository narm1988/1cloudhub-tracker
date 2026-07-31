import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, BookOpen, MoreHorizontal } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { STATUS_OPTIONS, STATUS_META } from '../lib/constants'
import type { Status } from '../lib/constants'
import type { Epic, Story, User } from '../types'
import Button from '../components/ui/Button'
import Avatar from '../components/ui/Avatar'
import StatusBadge from '../components/ui/StatusBadge'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'

export default function EpicDetailPage() {
  const { epicId } = useParams<{ epicId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [epic, setEpic] = useState<Epic | null>(null)
  const [stories, setStories] = useState<Story[]>([])
  const [members, setMembers] = useState<User[]>([])
  const [showCreateStory, setShowCreateStory] = useState(false)
  const [selectedStory, setSelectedStory] = useState<Story | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (epicId) {
      fetchEpic()
      fetchStories()
      fetchMembers()
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
      .select('*, assignee:profiles!stories_assignee_id_fkey(id, full_name, email)')
      .eq('epic_id', epicId)
      .order('created_at', { ascending: false })
    if (data) setStories(data)
  }

  async function fetchMembers() {
    const { data } = await supabase.from('profiles').select('*')
    if (data) setMembers(data)
  }

  async function createStory(title: string, assigneeId: string, status: Status, type: string) {
    const storyCount = stories.length + 1
    const displayId = `1CH-${100 + storyCount}`

    const { error } = await supabase.from('stories').insert({
      epic_id: epicId,
      title,
      assignee_id: assigneeId || null,
      reporter_id: user?.id,
      status,
      type,
      priority: 'Medium',
      display_id: displayId,
    })

    if (!error) {
      setShowCreateStory(false)
      fetchStories()
    }
  }

  async function updateStory(storyId: string, updates: Partial<Story>) {
    const { error } = await supabase
      .from('stories')
      .update(updates)
      .eq('id', storyId)

    if (!error) {
      setSelectedStory(null)
      fetchStories()
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>
  }

  if (!epic) {
    return <div className="text-gray-500">Epic not found.</div>
  }

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
      <div className="flex items-baseline justify-between mb-5">
        <div>
          <span className="font-mono text-[12px] text-gray-400">{epic.id.slice(0, 8)}</span>
          <h1 className="font-display text-[22px] font-semibold text-ink mt-0.5">{epic.title}</h1>
          <p className="text-[13px] text-gray-500 mt-1">
            Owner: {epic.owner?.full_name || 'Unassigned'} · {stories.length} user stories
          </p>
        </div>
        <Button onClick={() => setShowCreateStory(true)}>
          <Plus size={14} /> New user story
        </Button>
      </div>

      {/* Kanban board */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${STATUS_OPTIONS.length}, minmax(200px, 1fr))` }}>
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
                    onClick={() => setSelectedStory(story)}
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

      {/* Create Story Modal */}
      {showCreateStory && (
        <CreateStoryModal
          members={members}
          onClose={() => setShowCreateStory(false)}
          onCreate={createStory}
        />
      )}

      {/* Story Detail Modal */}
      {selectedStory && (
        <StoryDetailModal
          story={selectedStory}
          members={members}
          onClose={() => setSelectedStory(null)}
          onUpdate={updateStory}
        />
      )}
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
        <MoreHorizontal size={13} className="text-gray-400" />
      </div>

      {/* Perforation */}
      <div className="h-px my-2 bg-[repeating-linear-gradient(90deg,#F0F1F3_0,#F0F1F3_2px,transparent_2px,transparent_6px)]" />

      <div className="text-[13.5px] text-ink font-medium leading-snug mb-2.5">
        {story.title}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-[10.5px] text-gray-400">Assignee</span>
          {story.assignee && <Avatar name={story.assignee.full_name} size="sm" />}
        </div>
        <StatusBadge status={story.status as Status} />
      </div>
    </div>
  )
}

function CreateStoryModal({
  members,
  onClose,
  onCreate,
}: {
  members: User[]
  onClose: () => void
  onCreate: (title: string, assigneeId: string, status: Status, type: string) => void
}) {
  const [title, setTitle] = useState('')
  const [assigneeId, setAssigneeId] = useState('')
  const [status, setStatus] = useState<Status>('Created')
  const [type, setType] = useState('Story')

  return (
    <Modal title="New user story" onClose={onClose}>
      <div className="space-y-4">
        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="As a user, I want to..."
        />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[13px] font-semibold text-ink mb-1.5">Assign to</label>
            <select
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:border-brand"
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
            >
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.full_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-ink mb-1.5">Status</label>
            <select
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:border-brand"
              value={status}
              onChange={(e) => setStatus(e.target.value as Status)}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[13px] font-semibold text-ink mb-1.5">Type</label>
          <select
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:border-brand"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option>Epic</option>
            <option>Story</option>
            <option>Task</option>
            <option>Bug</option>
          </select>
        </div>

        <Button onClick={() => onCreate(title, assigneeId, status, type)} className="w-full" disabled={!title.trim()}>
          Create story
        </Button>
      </div>
    </Modal>
  )
}

function StoryDetailModal({
  story,
  members,
  onClose,
  onUpdate,
}: {
  story: Story
  members: User[]
  onClose: () => void
  onUpdate: (id: string, updates: Partial<Story>) => void
}) {
  const [status, setStatus] = useState(story.status)
  const [assigneeId, setAssigneeId] = useState(story.assignee_id || '')

  return (
    <Modal title={story.display_id} onClose={onClose}>
      <div className="space-y-4">
        <div className="text-[15px] font-semibold text-ink">{story.title}</div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[13px] font-semibold text-ink mb-1.5">Assigned to</label>
            <select
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:border-brand"
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
            >
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.full_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-ink mb-1.5">Status</label>
            <select
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:border-brand"
              value={status}
              onChange={(e) => setStatus(e.target.value as Status)}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <p className="text-[12px] text-gray-400">Reporter: {story.reporter?.full_name || 'Unknown'}</p>

        <Button
          onClick={() => onUpdate(story.id, { status, assignee_id: assigneeId || null } as any)}
          className="w-full"
        >
          Save changes
        </Button>
      </div>
    </Modal>
  )
}
