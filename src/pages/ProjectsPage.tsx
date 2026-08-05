import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, FolderKanban, ChevronRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { Project } from '../types'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'
import Card from '../components/ui/Card'
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
    const from = (page - 1) * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    const { data, count } = await supabase
      .from('projects')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)
    if (data) {
      setProjects(data)
      setTotal(count || 0)
    }
    setLoading(false)
  }

  if (loading && projects.length === 0) {
    return (
      <div>
        <div className="flex items-baseline justify-between mb-5">
          <div>
            <div className="h-6 w-28 rounded bg-gray-200 animate-pulse" />
            <div className="h-4 w-40 rounded bg-gray-100 animate-pulse mt-2.5" />
          </div>
        </div>
        <LoadingSkeleton variant="cards" count={3} />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-baseline justify-between mb-5 animate-fade-in-up">
        <div>
          <h3 className="text-xl font-semibold tracking-tight">Projects</h3>
          <p className="text-sm text-gray-500 mt-1"><span className="font-mono tabular-nums">{total}</span> projects in your workspace</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowCreate(true)}>
            <Plus size={14} /> New project
          </Button>
        )}
      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon={<FolderKanban size={40} />}
          title="No projects yet"
          description={isAdmin ? 'Create a project to organize your epics and stories.' : 'Ask an admin to create a project to get started.'}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map((project, i) => (
            <Card
              key={project.id}
              onClick={() => navigate(`/projects/${project.id}`)}
              className="group cursor-pointer hover:border-brand/40 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 animate-fade-in-up"
              style={{ animationDelay: `${Math.min(i, 8) * 45}ms` }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-brand-soft flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
                    <FolderKanban size={18} className="text-brand" />
                  </div>
                  <span className="font-mono text-sm text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                    {project.key}
                  </span>
                </div>
                <ChevronRight size={14} className="text-gray-400 transition-transform duration-200 group-hover:translate-x-0.5" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{project.name}</h3>
              {project.description && (
                <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">
                  {project.description}
                </p>
              )}
              <div className="mt-3 text-xs text-gray-400">
                Created {new Date(project.created_at).toLocaleDateString()}
              </div>
            </Card>
          ))}
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
  const { user } = useAuth()

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

    const { error: dbError } = await supabase.from('projects').insert({
      name: name.trim(),
      key: key.trim().toUpperCase(),
      description: description.trim() || null,
      created_by: user?.id,
    })

    if (dbError) {
      if (dbError.code === '23505') {
        setError('A project with this key already exists.')
      } else {
        setError(dbError.message)
      }
    } else {
      onCreated()
    }
  }

  return (
    <Modal title="Create project" onClose={onClose}>
      <div className="space-y-4">
        {error && (
          <div className="bg-danger-soft text-danger text-sm px-4 py-2.5 rounded-lg">{error}</div>
        )}

        <Input
          label="Project name"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="e.g. Cloud Migration"
        />

        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-1.5">
            Key <span className="text-gray-400 font-normal">(used as prefix for issues)</span>
          </label>
          <input
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm font-mono uppercase outline-none focus:border-brand focus:ring-1 focus:ring-brand/30"
            value={key}
            onChange={(e) => setKey(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5))}
            placeholder="CM"
            maxLength={5}
          />
          <p className="text-xs text-gray-400 mt-1">2-5 characters. Issues will be like {key || 'XX'}-101</p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-1.5">Description</label>
          <textarea
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 min-h-[70px] resize-y"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this project about?"
          />
        </div>

        <Button onClick={handleCreate} className="w-full" disabled={!name.trim() || !key.trim()}>
          Create project
        </Button>
      </div>
    </Modal>
  )
}
