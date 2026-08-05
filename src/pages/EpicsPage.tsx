import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Flag, ChevronRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
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
  const { user } = useAuth()

  useEffect(() => {
    fetchProjects()
  }, [])

  useEffect(() => {
    fetchEpics()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  async function fetchEpics() {
    setLoading(true)
    const from = (page - 1) * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    const { data, error, count } = await supabase
      .from('epics')
      .select('*, owner:profiles!epics_owner_id_fkey(id, full_name, email), project:projects(id, name, key)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (!error && data) {
      setEpics(data)
      setTotal(count || 0)
    }
    setLoading(false)
  }

  async function fetchProjects() {
    const { data } = await supabase.from('projects').select('*').order('name')
    if (data) setProjects(data)
  }

  async function createEpic(title: string, description: string, projectId: string) {
    const { error } = await supabase.from('epics').insert({
      title,
      description,
      owner_id: user?.id,
      project_id: projectId,
      status: 'Created',
    })

    if (!error) {
      setShowCreateModal(false)
      fetchEpics()
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
          <h1 className="font-display text-heading font-semibold text-ink">Epics</h1>
          <p className="text-body text-gray-500 mt-1">
            <span className="font-mono tabular-nums">{total}</span> epics in your workspace
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} disabled={projects.length === 0} title={projects.length === 0 ? 'Create a project first' : undefined}>
          <Plus size={14} /> New epic
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
              <span className="font-mono text-caption text-gray-400 shrink-0 w-16">{epic.id.slice(0, 8)}</span>
              <div className="flex-1 min-w-0">
                <div className="text-body-lg font-semibold text-ink truncate">{epic.title}</div>
                {epic.description && (
                  <div className="text-label text-gray-500 truncate">{epic.description}</div>
                )}
              </div>
              {epic.project && (
                <span className="text-caption font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded shrink-0">
                  {epic.project.key}
                </span>
              )}
              <div className="flex items-center gap-1.5 shrink-0">
                <Avatar name={epic.owner?.full_name || 'Unknown'} size="sm" />
                <span className="text-caption text-gray-500 hidden sm:inline">
                  {epic.owner?.full_name || 'Unassigned'}
                </span>
              </div>
              <span className="text-caption font-semibold px-2 py-0.5 rounded-md bg-gray-100 text-gray-500 shrink-0">
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
      <div className="space-y-4">
        <div>
          <label className="block text-body font-semibold text-ink mb-1.5">Project</label>
          <select
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-body-lg outline-none focus:border-brand focus:ring-1 focus:ring-brand/30"
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
          <label className="block text-body font-semibold text-ink mb-1.5">
            Description
          </label>
          <textarea
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-body-lg font-body text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 transition-colors min-h-[80px] resize-y"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What does this epic cover?"
          />
        </div>
        <Button
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
