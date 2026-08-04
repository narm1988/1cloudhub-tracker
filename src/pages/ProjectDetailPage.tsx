import { useEffect, useState } from 'react'
import { useParams, useNavigate, Outlet } from 'react-router-dom'
import { ArrowLeft, Flag, List, CalendarDays, Tags } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Project } from '../types'

export default function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const [project, setProject] = useState<Project | null>(null)
  const [activeTab, setActiveTab] = useState<'board' | 'backlog' | 'timeline'>('board')

  useEffect(() => {
    if (projectId) fetchProject()
  }, [projectId])

  async function fetchProject() {
    const { data } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()
    if (data) setProject(data)
  }

  if (!project) {
    return <div className="flex items-center justify-center h-64 text-gray-400">Loading project...</div>
  }

  const tabs = [
    { key: 'board', label: 'Board', icon: Flag },
    { key: 'backlog', label: 'Backlog', icon: List },
    { key: 'timeline', label: 'Timeline', icon: CalendarDays },
  ] as const

  return (
    <div>
      <button
        onClick={() => navigate('/projects')}
        className="flex items-center gap-1.5 text-gray-500 text-[13px] hover:text-gray-700 mb-3"
      >
        <ArrowLeft size={14} /> All projects
      </button>

      <div className="flex items-center gap-3 mb-5">
        <span className="font-mono text-[12px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
          {project.key}
        </span>
        <h1 className="font-display text-xl font-semibold text-ink">{project.name}</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-gray-200">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium border-b-2 transition-colors ${
                isActive
                  ? 'border-brand text-brand'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      {activeTab === 'board' && <ProjectBoard projectId={project.id} projectKey={project.key} />}
      {activeTab === 'backlog' && <ProjectBacklog projectId={project.id} projectKey={project.key} />}
      {activeTab === 'timeline' && <ProjectTimeline projectId={project.id} />}
    </div>
  )
}

/* ---- Board Tab: Kanban view of all stories in the project ---- */
import { Plus, BookOpen } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { STATUS_OPTIONS, STATUS_META, PRIORITY_META } from '../lib/constants'
import type { Status, Priority } from '../lib/constants'
import type { Story, User } from '../types'
import Button from '../components/ui/Button'
import Avatar from '../components/ui/Avatar'
import StatusBadge from '../components/ui/StatusBadge'

function ProjectBoard({ projectId, projectKey }: { projectId: string; projectKey: string }) {
  const navigate = useNavigate()
  const [stories, setStories] = useState<Story[]>([])

  useEffect(() => {
    fetchStories()
  }, [projectId])

  async function fetchStories() {
    const { data } = await supabase
      .from('stories')
      .select('*, assignee:profiles!stories_assignee_id_fkey(id, full_name, email)')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
    if (data) setStories(data)
  }

  return (
    <div className="flex gap-4 overflow-x-auto scroll-thin pb-3 -mx-1 px-1">
      {STATUS_OPTIONS.map((status) => {
        const items = stories.filter((s) => s.status === status)
        return (
          <div key={status} className="w-[220px] shrink-0">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[12.5px] font-semibold text-gray-500 uppercase tracking-wide">{status}</span>
              <span className="text-[11.5px] text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">{items.length}</span>
            </div>
            <div className="space-y-2.5">
              {items.map((story) => (
                <div
                  key={story.id}
                  onClick={() => navigate(`/stories/${story.id}`)}
                  className="bg-white rounded-xl border border-gray-200 p-3.5 cursor-pointer hover:border-brand/30 hover:shadow-sm transition-all"
                  style={{ borderLeftWidth: 3, borderLeftColor: STATUS_META[story.status as Status]?.color || '#6B7280' }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-[11px] text-gray-400">{story.display_id}</span>
                    <span className="text-[11px]">{PRIORITY_META[story.priority as Priority]?.icon}</span>
                  </div>
                  <div className="text-[13px] text-ink font-medium leading-snug mb-2">{story.title}</div>
                  <div className="flex items-center justify-between">
                    {story.assignee ? <Avatar name={story.assignee.full_name} size="sm" /> : <span className="text-[10px] text-gray-400">—</span>}
                    {story.due_date && (
                      <span className="text-[10.5px] text-gray-400">{new Date(story.due_date).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              ))}
              {items.length === 0 && (
                <div className="border border-dashed border-gray-200 rounded-lg py-4 text-center text-[12px] text-gray-400">Empty</div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ---- Backlog Tab: Sprint planning ---- */
function ProjectBacklog({ projectId, projectKey }: { projectId: string; projectKey: string }) {
  const { user } = useAuth()
  const [stories, setStories] = useState<Story[]>([])
  const [sprints, setSprints] = useState<any[]>([])
  const [showCreateSprint, setShowCreateSprint] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    fetchData()
  }, [projectId])

  async function fetchData() {
    const [storiesRes, sprintsRes] = await Promise.all([
      supabase
        .from('stories')
        .select('*, assignee:profiles!stories_assignee_id_fkey(id, full_name, email)')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false }),
      supabase
        .from('sprints')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false }),
    ])
    if (storiesRes.data) setStories(storiesRes.data)
    if (sprintsRes.data) setSprints(sprintsRes.data)
  }

  async function createSprint(name: string, goal: string, startDate: string, endDate: string) {
    await supabase.from('sprints').insert({
      project_id: projectId,
      name,
      goal: goal || null,
      start_date: startDate || null,
      end_date: endDate || null,
      status: 'planned',
    })
    setShowCreateSprint(false)
    fetchData()
  }

  async function moveToSprint(storyId: string, sprintId: string | null) {
    await supabase.from('stories').update({ sprint_id: sprintId }).eq('id', storyId)
    fetchData()
  }

  async function startSprint(sprintId: string) {
    await supabase.from('sprints').update({ status: 'active' }).eq('id', sprintId)
    fetchData()
  }

  async function completeSprint(sprintId: string) {
    await supabase.from('sprints').update({ status: 'completed' }).eq('id', sprintId)
    // Move incomplete stories back to backlog
    await supabase.from('stories')
      .update({ sprint_id: null })
      .eq('sprint_id', sprintId)
      .neq('status', 'Done')
    fetchData()
  }

  const backlogStories = stories.filter((s) => !s.sprint_id)
  const activeSprints = sprints.filter((s) => s.status !== 'completed')

  return (
    <div className="space-y-6">
      {/* Sprints */}
      {activeSprints.map((sprint) => {
        const sprintStories = stories.filter((s) => s.sprint_id === sprint.id)
        const totalPoints = sprintStories.reduce((sum, s) => sum + (s.story_points || 0), 0)
        return (
          <div key={sprint.id} className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-[14px] font-semibold text-ink">{sprint.name}</h3>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                    sprint.status === 'active' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {sprint.status}
                  </span>
                </div>
                {sprint.goal && <p className="text-[12px] text-gray-500 mt-0.5">{sprint.goal}</p>}
                <div className="flex gap-3 mt-1 text-[11px] text-gray-400">
                  {sprint.start_date && <span>Start: {sprint.start_date}</span>}
                  {sprint.end_date && <span>End: {sprint.end_date}</span>}
                  <span>{sprintStories.length} stories · {totalPoints} pts</span>
                </div>
              </div>
              <div className="flex gap-2">
                {sprint.status === 'planned' && (
                  <Button size="sm" onClick={() => startSprint(sprint.id)}>Start sprint</Button>
                )}
                {sprint.status === 'active' && (
                  <Button size="sm" variant="secondary" onClick={() => completeSprint(sprint.id)}>Complete</Button>
                )}
              </div>
            </div>

            {sprintStories.length === 0 ? (
              <p className="text-[12px] text-gray-400 text-center py-3 border border-dashed border-gray-200 rounded-lg">
                Drag stories here or assign from backlog
              </p>
            ) : (
              <div className="space-y-1.5">
                {sprintStories.map((story) => (
                  <BacklogStoryRow
                    key={story.id}
                    story={story}
                    onRemoveFromSprint={() => moveToSprint(story.id, null)}
                    onClick={() => navigate(`/stories/${story.id}`)}
                  />
                ))}
              </div>
            )}
          </div>
        )
      })}

      {/* Create sprint */}
      <Button size="sm" variant="secondary" onClick={() => setShowCreateSprint(true)}>
        <Plus size={13} /> Create sprint
      </Button>

      {/* Backlog */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="font-display text-[14px] font-semibold text-ink mb-3">
          Backlog ({backlogStories.length})
        </h3>
        {backlogStories.length === 0 ? (
          <p className="text-[12px] text-gray-400 text-center py-4">All stories are assigned to sprints.</p>
        ) : (
          <div className="space-y-1.5">
            {backlogStories.map((story) => (
              <BacklogStoryRow
                key={story.id}
                story={story}
                sprints={activeSprints}
                onMoveToSprint={(sprintId) => moveToSprint(story.id, sprintId)}
                onClick={() => navigate(`/stories/${story.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      {showCreateSprint && (
        <CreateSprintModal onClose={() => setShowCreateSprint(false)} onCreate={createSprint} />
      )}
    </div>
  )
}

/* ---- Backlog Story Row ---- */
function BacklogStoryRow({
  story,
  sprints,
  onMoveToSprint,
  onRemoveFromSprint,
  onClick,
}: {
  story: Story
  sprints?: any[]
  onMoveToSprint?: (sprintId: string) => void
  onRemoveFromSprint?: () => void
  onClick: () => void
}) {
  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-lg border border-gray-100 hover:border-gray-200 group transition-colors">
      <span className="font-mono text-[11px] text-gray-400 shrink-0 w-16">{story.display_id}</span>
      <span
        className="text-[13px] text-ink font-medium flex-1 truncate cursor-pointer hover:text-brand"
        onClick={onClick}
      >
        {story.title}
      </span>
      {story.story_points && (
        <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded shrink-0">
          {story.story_points} pts
        </span>
      )}
      <span className="text-[11px]">{PRIORITY_META[story.priority as Priority]?.icon}</span>
      {story.assignee && <Avatar name={story.assignee.full_name} size="sm" />}
      <StatusBadge status={story.status as Status} />

      {/* Sprint action */}
      {sprints && onMoveToSprint && (
        <select
          className="text-[11px] border border-gray-200 rounded px-1.5 py-0.5 outline-none opacity-0 group-hover:opacity-100 transition-opacity"
          defaultValue=""
          onChange={(e) => { if (e.target.value) onMoveToSprint(e.target.value) }}
        >
          <option value="">→ Sprint</option>
          {sprints.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      )}
      {onRemoveFromSprint && (
        <button
          onClick={onRemoveFromSprint}
          className="text-[11px] text-gray-400 hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity"
        >
          ✕
        </button>
      )}
    </div>
  )
}

/* ---- Timeline Tab (simple Gantt-style) ---- */
function ProjectTimeline({ projectId }: { projectId: string }) {
  const [stories, setStories] = useState<Story[]>([])

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('stories')
        .select('*')
        .eq('project_id', projectId)
        .not('start_date', 'is', null)
        .order('start_date')
      if (data) setStories(data as Story[])
    }
    fetch()
  }, [projectId])

  if (stories.length === 0) {
    return (
      <div className="text-center py-10 text-gray-400">
        <CalendarDays size={32} className="mx-auto mb-3 text-gray-300" />
        <p className="text-sm">No stories with dates assigned yet.</p>
        <p className="text-[12px] mt-1">Add start/due dates to stories to see them on the timeline.</p>
      </div>
    )
  }

  // Simple timeline list (Gantt can be added later)
  return (
    <div className="space-y-2">
      {stories.map((story) => (
        <div key={story.id} className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-4 py-3">
          <span className="font-mono text-[11px] text-gray-400 shrink-0">{story.display_id}</span>
          <span className="text-[13px] text-ink font-medium flex-1 truncate">{story.title}</span>
          <span className="text-[11px] text-gray-500 shrink-0">
            {story.start_date && new Date(story.start_date).toLocaleDateString()}
            {story.start_date && story.due_date && ' → '}
            {story.due_date && new Date(story.due_date).toLocaleDateString()}
          </span>
          <StatusBadge status={story.status as Status} />
        </div>
      ))}
    </div>
  )
}

/* ---- Create Sprint Modal ---- */
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'

function CreateSprintModal({
  onClose,
  onCreate,
}: {
  onClose: () => void
  onCreate: (name: string, goal: string, startDate: string, endDate: string) => void
}) {
  const [name, setName] = useState('')
  const [goal, setGoal] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  return (
    <Modal title="Create sprint" onClose={onClose}>
      <div className="space-y-4">
        <Input
          label="Sprint name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Sprint 1"
        />
        <Input
          label="Goal (optional)"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="What do you want to achieve?"
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Start date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Input
            label="End date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <Button onClick={() => onCreate(name, goal, startDate, endDate)} className="w-full" disabled={!name.trim()}>
          Create sprint
        </Button>
      </div>
    </Modal>
  )
}
