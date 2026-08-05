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

export default function EpicsPage() {
  const [epics, setEpics] = useState<Epic[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    fetchEpics()
    fetchProjects()
  }, [])

  async function fetchEpics() {
    const { data, error } = await supabase
      .from('epics')
      .select('*, owner:profiles!epics_owner_id_fkey(id, full_name, email), project:projects(id, name, key)')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setEpics(data)
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        Loading epics...
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-baseline justify-between mb-5">
        <div>
          <h1 className="font-display text-[22px] font-semibold text-ink">Epics</h1>
          <p className="text-[13px] text-gray-500 mt-1">
            <span className="font-mono tabular-nums">{epics.length}</span> epics in your workspace
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} disabled={projects.length === 0} title={projects.length === 0 ? 'Create a project first' : undefined}>
          <Plus size={14} /> New epic
        </Button>
      </div>

      {/* Epics grid */}
      {epics.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Flag size={40} className="mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium text-gray-500">No epics yet</p>
          <p className="text-sm mt-1">
            {projects.length === 0
              ? 'A project needs to exist before you can create an epic.'
              : 'Create your first epic to get started.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {epics.map((epic) => (
            <div
              key={epic.id}
              onClick={() => navigate(`/epics/${epic.id}`)}
              className="bg-white border border-gray-200 rounded-xl p-4 cursor-pointer hover:border-brand/40 hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-1.5 mb-2.5">
                <div className="bg-violet-50 rounded p-0.5 flex">
                  <Flag size={12} className="text-violet-500" />
                </div>
                <span className="font-mono text-[11.5px] text-gray-400">{epic.id.slice(0, 8)}</span>
                <ChevronRight size={13} className="text-gray-400 ml-auto" />
              </div>
              <div className="text-[14.5px] font-semibold text-ink mb-1">{epic.title}</div>
              {epic.project && (
                <span className="inline-block text-[10.5px] font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded mb-1.5">
                  {epic.project.key}
                </span>
              )}
              <div className="text-[12.5px] text-gray-500 leading-relaxed mb-4 line-clamp-2">
                {epic.description}
              </div>

              {/* Perforation */}
              <div className="h-px my-2.5 bg-[repeating-linear-gradient(90deg,#F0F1F3_0,#F0F1F3_3px,transparent_3px,transparent_7px)]" />

              <div className="flex items-center justify-between mt-2.5">
                <div className="flex items-center gap-1.5">
                  <Avatar name={epic.owner?.full_name || 'Unknown'} size="sm" />
                  <span className="text-[11.5px] text-gray-500">
                    {epic.owner?.full_name || 'Unassigned'}
                  </span>
                </div>
                <span className="text-[11.5px] text-gray-400">
                  {epic.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

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
          <label className="block text-[13px] font-semibold text-ink mb-1.5">Project</label>
          <select
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:border-brand"
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
          <label className="block text-[13px] font-semibold text-ink mb-1.5">
            Description
          </label>
          <textarea
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm font-body text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 transition-colors min-h-[80px] resize-y"
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
