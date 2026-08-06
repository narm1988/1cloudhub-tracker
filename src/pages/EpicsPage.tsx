import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Flag, ChevronRight } from 'lucide-react'
import { api } from '../lib/api'
import type { Epic, Project } from '../types'
import Button from '../components/ui/Button'
import Avatar from '../components/ui/Avatar'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'
import Card from '../components/ui/Card'
import Pagination from '../components/ui/Pagination'
import EmptyState from '../components/ui/EmptyState'
import LoadingSkeleton from '../components/ui/LoadingSkeleton'

const PAGE_SIZE = 12

export default function EpicsPage() {
  const [epics, setEpics] = useState<Epic[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [projects, setProjects] = useState<Project[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchProjects()
  }, [])

  useEffect(() => {
    fetchEpics()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  async function fetchEpics() {
    setLoading(true)
    try {
      const { data, total } = await api.listEpics(page, PAGE_SIZE)
      setEpics(data)
      setTotal(total)
    } catch {
      // Leave whatever was already loaded in place rather than blanking the page.
    }
    setLoading(false)
  }

  async function fetchProjects() {
    try {
      const { data } = await api.listProjects(1, 100)
      setProjects(data)
    } catch {
      // Project picker just stays empty; the "create a project first" disabled
      // state already covers the empty case.
    }
  }

  async function createEpic(title: string, description: string, projectId: string) {
    try {
      await api.createEpic({ title, description, project_id: projectId })
      setShowCreateModal(false)
      fetchEpics()
    } catch {
      // Matches prior behavior: the modal stays open with no error banner
      // on failure (CreateEpicModal never had one, unlike CreateProjectModal).
    }
  }

  if (loading && epics.length === 0) {
    return (
      <div>
        <div className="flex items-baseline justify-between mb-5">
          <div>
            <div className="h-6 w-28 rounded bg-gray-200 animate-pulse" />
            <div className="h-4 w-40 rounded bg-gray-100 animate-pulse mt-2.5" />
          </div>
        </div>
        <LoadingSkeleton variant="rows" count={5} />
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-baseline justify-between mb-5">
        <div>
          <h1 className="text-[17px] font-semibold tracking-[-0.01em] text-gray-900">Epics</h1>
          <p className="text-[12px] text-gray-500 mt-1">
            <span className="font-mono tabular-nums">{total}</span> epics in your workspace
          </p>
        </div>
        <Button size="sm" onClick={() => setShowCreateModal(true)} disabled={projects.length === 0} title={projects.length === 0 ? 'Create a project first' : undefined}>
          <Plus size={13} /> New epic
        </Button>
      </div>

      {/* Epics row list */}
      {epics.length === 0 ? (
        <EmptyState
          icon={<Flag size={40} />}
          title="No epics yet"
          description={
            projects.length === 0
              ? 'A project needs to exist before you can create an epic.'
              : 'Create your first epic to get started.'
          }
        />
      ) : (
        <Card padding="none" className="overflow-hidden">
          {epics.map((epic, i) => (
            <div
              key={epic.id}
              onClick={() => navigate(`/epics/${epic.id}`)}
              className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-gray-50 transition-colors ${
                i < epics.length - 1 ? 'border-b border-gray-100' : ''
              }`}
            >
              <div className="bg-violet-50 rounded p-1 flex shrink-0">
                <Flag size={13} className="text-violet-500" />
              </div>
              <span className="font-mono text-[12px] text-gray-400 shrink-0 w-16">{epic.id.slice(0, 8)}</span>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-gray-900 truncate">{epic.title}</div>
                {epic.description && (
                  <div className="text-[13px] text-gray-500 truncate">{epic.description}</div>
                )}
              </div>
              {epic.project && (
                <span className="text-[12px] font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded shrink-0">
                  {epic.project.key}
                </span>
              )}
              <div className="flex items-center gap-1.5 shrink-0">
                <Avatar name={epic.owner?.full_name || 'Unknown'} size="sm" />
                <span className="text-[12px] text-gray-500 hidden sm:inline">
                  {epic.owner?.full_name || 'Unassigned'}
                </span>
              </div>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-gray-100 text-gray-500 shrink-0">
                {epic.status}
              </span>
              <ChevronRight size={14} className="text-gray-400 shrink-0" />
            </div>
          ))}
        </Card>
      )}

      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />

      {/* Create Epic Modal */}
      {showCreateModal && (
        <CreateEpicModal
          projects={projects}
          onClose={() => setShowCreateModal(false)}
          onCreate={createEpic}
        />
      )}
    </div>
  )
}

function CreateEpicModal({
  projects,
  onClose,
  onCreate,
}: {
  projects: Project[]
  onClose: () => void
  onCreate: (title: string, description: string, projectId: string) => void
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [projectId, setProjectId] = useState(projects[0]?.id || '')

  return (
    <Modal title="New epic" onClose={onClose}>
      <div className="space-y-3.5">
        <div>
          <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Project</label>
          <select
            className="w-full h-9 px-3 rounded-md border border-gray-200 bg-white text-[13px] text-gray-900 shadow-sm outline-none placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/10"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.key} — {p.name}</option>
            ))}
          </select>
        </div>

        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Client Onboarding Automation"
        />
        <div>
          <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
            Description
          </label>
          <textarea
            className="w-full px-3 py-2 rounded-md border border-gray-200 text-[13px] text-gray-900 shadow-sm outline-none placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/10 transition-colors min-h-[80px] resize-y"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What does this epic cover?"
          />
        </div>
        <Button
          size="sm"
          onClick={() => onCreate(title, description, projectId)}
          className="w-full"
          disabled={!title.trim() || !projectId}
        >
          Create epic
        </Button>
      </div>
    </Modal>
  )
}
