import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, FolderKanban, ChevronRight } from 'lucide-react'
import { api, ApiError } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import type { Project } from '../types'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'
import Pagination from '../components/ui/Pagination'
import EmptyState from '../components/ui/EmptyState'
import LoadingSkeleton from '../components/ui/LoadingSkeleton'

const PAGE_SIZE = 12

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [showCreate, setShowCreate] = useState(false)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    fetchProjects()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  async function fetchProjects() {
    setLoading(true)
    try {
      const { data, total } = await api.listProjects(page, PAGE_SIZE)
      setProjects(data)
      setTotal(total)
    } catch {
      // Leave whatever was already loaded in place rather than blanking the page.
    }
    setLoading(false)
  }

  if (loading && projects.length === 0) {
    return (
      <div>
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <div className="h-[17px] w-24 rounded bg-gray-200 animate-pulse" />
            <div className="h-3.5 w-40 rounded bg-gray-100 animate-pulse mt-2" />
          </div>
        </div>
        <LoadingSkeleton variant="rows" count={3} />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-baseline justify-between mb-4 animate-fade-in-up">
        <div>
          <h3 className="text-[17px] font-semibold tracking-[-0.01em] text-gray-900">Projects</h3>
          <p className="text-[12px] text-gray-500 mt-1"><span className="font-mono tabular-nums">{total}</span> projects in your workspace</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowCreate(true)}
            className="h-[30px] px-3 rounded-md bg-brand text-white text-[12px] font-semibold flex items-center gap-1.5 hover:bg-brand-deep transition-colors"
          >
            <Plus size={13} /> New project
          </button>
        )}
      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon={<FolderKanban size={40} />}
          title="No projects yet"
          description={isAdmin ? 'Create a project to organize your epics and stories.' : 'Ask an admin to create a project to get started.'}
        />
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left text-[10px] font-bold tracking-wide uppercase text-gray-400 bg-gray-50 px-3 py-2 border-b border-gray-200">Key</th>
                <th className="text-left text-[10px] font-bold tracking-wide uppercase text-gray-400 bg-gray-50 px-3 py-2 border-b border-gray-200">Name</th>
                <th className="text-left text-[10px] font-bold tracking-wide uppercase text-gray-400 bg-gray-50 px-3 py-2 border-b border-gray-200">Description</th>
                <th className="text-left text-[10px] font-bold tracking-wide uppercase text-gray-400 bg-gray-50 px-3 py-2 border-b border-gray-200">Created</th>
                <th className="bg-gray-50 border-b border-gray-200 w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {projects.map((project) => (
                <tr
                  key={project.id}
                  onClick={() => navigate(`/projects/${project.id}`)}
                  className="cursor-pointer hover:bg-gray-50 transition-colors group"
                >
                  <td className="px-3 py-2">
                    <span className="font-mono text-[11px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{project.key}</span>
                  </td>
                  <td className="px-3 py-2 text-[13px] font-semibold text-gray-900">{project.name}</td>
                  <td className="px-3 py-2 text-[12px] text-gray-400 max-w-xs truncate">{project.description || '—'}</td>
                  <td className="px-3 py-2 font-mono tabular-nums text-[12px] text-gray-400">
                    {new Date(project.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-2 text-gray-300 group-hover:text-gray-400 transition-colors">
                    <ChevronRight size={14} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />

      {showCreate && (
        <CreateProjectModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); fetchProjects() }}
        />
      )}
    </div>
  )
}

function CreateProjectModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: () => void
}) {
  const [name, setName] = useState('')
  const [key, setKey] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)

  function handleNameChange(value: string) {
    setName(value)
    // Auto-generate key from name (first letters, uppercase)
    const autoKey = value
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 5)
    if (!key || key === name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 5).replace(/.$/, '')) {
      setKey(autoKey)
    }
  }

  async function handleCreate() {
    if (!name.trim() || !key.trim()) return
    setError('')
    setCreating(true)
    try {
      await api.createProject(name.trim(), key.trim().toUpperCase(), description.trim())
      onCreated()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create project.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <Modal title="Create project" onClose={onClose}>
      <div className="space-y-3.5">
        {error && (
          <div className="text-[13px] bg-red-50 text-red-600 border border-red-100 rounded-md px-3 py-2.5">{error}</div>
        )}

        <Input
          label="Project name"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="e.g. Cloud Migration"
        />

        <div>
          <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
            Key <span className="text-gray-400 font-normal">(used as prefix for issues)</span>
          </label>
          <input
            className="w-full h-9 px-3 rounded-md border border-gray-200 bg-white text-[13px] font-mono uppercase shadow-sm outline-none placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/10"
            value={key}
            onChange={(e) => setKey(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5))}
            placeholder="CM"
            maxLength={5}
          />
          <p className="text-[12px] text-gray-400 mt-1">2-5 characters. Issues will be like {key || 'XX'}-101</p>
        </div>

        <div>
          <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Description</label>
          <textarea
            className="w-full px-3 py-2 rounded-md border border-gray-200 text-[13px] text-gray-900 shadow-sm outline-none placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/10 min-h-[70px] resize-y"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this project about?"
          />
        </div>

        <button
          onClick={handleCreate}
          disabled={!name.trim() || !key.trim() || creating}
          className="w-full h-[30px] rounded-md bg-brand text-white text-[12px] font-semibold flex items-center justify-center gap-1.5 hover:bg-brand-deep transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {creating ? 'Creating...' : 'Create project'}
        </button>
      </div>
    </Modal>
  )
}
