import { useEffect, useState } from 'react'
import { useParams, useNavigate, Outlet } from 'react-router-dom'
import { ArrowLeft, Flag, List, CalendarDays, Tags } from 'lucide-react'
import { api } from '../lib/api'
import type { Project } from '../types'
import Card from '../components/ui/Card'
import Pagination from '../components/ui/Pagination'
import EmptyState from '../components/ui/EmptyState'
import LoadingSkeleton from '../components/ui/LoadingSkeleton'

const BACKLOG_PAGE_SIZE = 10

export default function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const [project, setProject] = useState<Project | null>(null)
  const [activeTab, setActiveTab] = useState<'board' | 'backlog' | 'timeline'>('board')

  useEffect(() => {
    if (projectId) fetchProject()
  }, [projectId])

  async function fetchProject() {
    try {
      const data = await api.getProject(projectId!)
      setProject(data)
    } catch {}
  }

  if (!project) {
    return (
      <div>
        <div className="h-4 w-24 rounded bg-gray-100 animate-pulse mb-3" />
        <div className="h-6 w-56 rounded bg-gray-200 animate-pulse mb-5" />
        <LoadingSkeleton variant="rows" count={4} />
      </div>
    )
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
        <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-gray-900">{project.name}</h1>
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
    try {
      const data = await api.listStories(undefined, projectId)
      setStories(data)
    } catch {}
  }

  return (
    <div className="flex gap-4 overflow-x-auto scroll-thin pb-3 -mx-1 px-1">
      {STATUS_OPTIONS.map((status) => {
        const items = stories.filter((s) => s.status === status)
        return (
          <div key={status} className="w-[220px] shrink-0">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide">{status}</span>
              <span className="text-[11px] font-mono tabular-nums text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">{items.length}</span>
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
                    <span className="font-mono text-[12px] text-gray-400">{story.display_id}</span>
                    <span className="text-[12px]">{PRIORITY_META[story.priority as Priority]?.icon}</span>
                  </div>
                  <div className="text-[13px] text-gray-900 font-medium leading-snug mb-2">{story.title}</div>
                  <div className="flex items-center justify-between">
                    {story.assignee ? <Avatar name={story.assignee.full_name} size="sm" /> : <span className="text-[12px] text-gray-400">—</span>}
                    {story.due_date && (
                      <span className="text-[12px] text-gray-400">{new Date(story.due_date).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              ))}
              {items.length === 0 && (
                <div className="border border-dashed border-gray-200 rounded-lg py-4 text-center text-[13px] text-gray-400">Empty</div>
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
  // Sprint-assigned stories are fetched in full (sprints are naturally bounded);
  // the unassigned backlog is the one list that can grow large, so it's the
  // one that's actually paginated at the DB level.
  const [sprintStories, setSprintStories] = useState<Story[]>([])
  const [backlogStories, setBacklogStories] = useState<Story[]>([])
  const [backlogTotal, setBacklogTotal] = useState(0)
  const [backlogPage, setBacklogPage] = useState(1)
  const [sprints, setSprints] = useState<any[]>([])
  const [showCreateSprint, setShowCreateSprint] = useState(false)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([fetchSprintsAndStories(), fetchBacklog()]).then(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  useEffect(() => {
    fetchBacklog()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backlogPage])

  async function fetchSprintsAndStories() {
    try {
      const [storiesData, sprintsData] = await Promise.all([
        api.listStories(undefined, projectId, false),
        api.listSprints(projectId),
      ])
      setSprintStories(storiesData)
      setSprints(sprintsData)
    } catch {}
  }

  async function fetchBacklog(pageOverride?: number) {
    const p = pageOverride ?? backlogPage
    try {
      const { data, total } = await api.listBacklogStories(projectId, p, BACKLOG_PAGE_SIZE)
      setBacklogStories(data)
      setBacklogTotal(total)
    } catch {}
  }

  async function refetchAll() {
    // Pass the target page explicitly — setBacklogPage(1) hasn't landed yet
    // when fetchBacklog() would otherwise read backlogPage from a stale closure.
    setBacklogPage(1)
    await Promise.all([fetchSprintsAndStories(), fetchBacklog(1)])
  }

  async function createSprint(name: string, goal: string, startDate: string, endDate: string) {
    try {
      await api.createSprint({ project_id: projectId, name, goal: goal || null, start_date: startDate || null, end_date: endDate || null })
    } catch {}
    setShowCreateSprint(false)
    refetchAll()
  }

  async function moveToSprint(storyId: string, sprintId: string | null) {
    try {
      await api.updateStory(storyId, { sprint_id: sprintId })
    } catch {}
    refetchAll()
  }

  async function startSprint(sprintId: string) {
    try { await api.startSprint(sprintId) } catch {}
    refetchAll()
  }

  async function completeSprint(sprintId: string) {
    try { await api.completeSprint(sprintId) } catch {}
    refetchAll()
  }

  const activeSprints = sprints.filter((s) => s.status !== 'completed')

  if (loading) {
    return <LoadingSkeleton variant="rows" count={4} />
  }

  return (
    <div className="space-y-6">
      {/* Sprints */}
      {activeSprints.map((sprint) => {
        const sprintStoriesForSprint = sprintStories.filter((s) => s.sprint_id === sprint.id)
        const totalPoints = sprintStoriesForSprint.reduce((sum, s) => sum + (s.story_points || 0), 0)
        return (
          <Card key={sprint.id}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-[13px] font-semibold text-gray-900">{sprint.name}</h3>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                    sprint.status === 'active' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {sprint.status}
                  </span>
                </div>
                {sprint.goal && <p className="text-[13px] text-gray-500 mt-0.5">{sprint.goal}</p>}
                <div className="flex gap-3 mt-1 text-[12px] text-gray-400">
                  {sprint.start_date && <span>Start: {sprint.start_date}</span>}
                  {sprint.end_date && <span>End: {sprint.end_date}</span>}
                  <span><span className="font-mono tabular-nums">{sprintStoriesForSprint.length}</span> stories · <span className="font-mono tabular-nums">{totalPoints}</span> pts</span>
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

            {sprintStoriesForSprint.length === 0 ? (
              <p className="text-[13px] text-gray-400 text-center py-3 border border-dashed border-gray-200 rounded-lg">
                Drag stories here or assign from backlog
              </p>
            ) : (
              <div className="space-y-1.5">
                {sprintStoriesForSprint.map((story) => (
                  <BacklogStoryRow
                    key={story.id}
                    story={story}
                    onRemoveFromSprint={() => moveToSprint(story.id, null)}
                    onClick={() => navigate(`/stories/${story.id}`)}
                  />
                ))}
              </div>
            )}
          </Card>
        )
      })}

      {/* Create sprint */}
      <Button size="sm" variant="secondary" onClick={() => setShowCreateSprint(true)}>
        <Plus size={13} /> Create sprint
      </Button>

      {/* Backlog */}
      <Card>
        <h3 className="text-[13px] font-semibold text-gray-900 mb-3">
          Backlog (<span className="font-mono tabular-nums">{backlogTotal}</span>)
        </h3>
        {backlogStories.length === 0 ? (
          <p className="text-[13px] text-gray-400 text-center py-4">All stories are assigned to sprints.</p>
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
        <Pagination page={backlogPage} pageSize={BACKLOG_PAGE_SIZE} total={backlogTotal} onPageChange={setBacklogPage} />
      </Card>

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
      <span className="font-mono text-[12px] text-gray-400 shrink-0 w-[70px]">{story.display_id}</span>
      <span
        className="text-[13px] text-gray-900 font-medium flex-1 min-w-0 truncate cursor-pointer hover:text-brand"
        onClick={onClick}
      >
        {story.title}
      </span>
      {story.story_points && (
        <span className="text-[12px] font-mono tabular-nums text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded shrink-0">
          {story.story_points} pts
        </span>
      )}
      <span className="text-[12px] shrink-0">{PRIORITY_META[story.priority as Priority]?.icon}</span>
      {story.assignee && <span className="shrink-0"><Avatar name={story.assignee.full_name} size="sm" /></span>}
      <span className="shrink-0"><StatusBadge status={story.status as Status} /></span>

      {/* Sprint action */}
      {sprints && onMoveToSprint && (
        <select
          aria-label={`Move "${story.title}" to sprint`}
          className="text-[12px] border border-gray-200 rounded px-1.5 py-0.5 outline-none opacity-0 group-hover:opacity-100 focus:opacity-100 focus:ring-1 focus:ring-brand/30 transition-opacity"
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
          aria-label={`Remove "${story.title}" from sprint`}
          className="text-[12px] text-gray-400 hover:text-danger opacity-0 group-hover:opacity-100 focus:opacity-100 focus-visible:ring-1 focus-visible:ring-brand/30 rounded transition-opacity"
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
      try {
        const data = await api.listStories(undefined, projectId)
        setStories(data.filter((s: Story) => s.start_date))
      } catch {}
    }
    fetch()
  }, [projectId])

  if (stories.length === 0) {
    return (
      <EmptyState
        icon={<CalendarDays size={32} />}
        title="No stories with dates assigned yet"
        description="Add start/due dates to stories to see them on the timeline."
      />
    )
  }

  // Simple timeline list (Gantt can be added later)
  return (
    <div className="space-y-2">
      {stories.map((story) => (
        <div key={story.id} className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-4 py-3">
          <span className="font-mono text-[12px] text-gray-400 shrink-0">{story.display_id}</span>
          <span className="text-[13px] text-gray-900 font-medium flex-1 truncate">{story.title}</span>
          <span className="text-[12px] text-gray-500 shrink-0">
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
