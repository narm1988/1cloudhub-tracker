import { useEffect, useState } from 'react'
import { Flag, FolderKanban, ArchiveRestore } from 'lucide-react'
import { api } from '../lib/api'
import type { Epic, Project } from '../types'
import Card from '../components/ui/Card'
import Pagination from '../components/ui/Pagination'
import EmptyState from '../components/ui/EmptyState'
import LoadingSkeleton from '../components/ui/LoadingSkeleton'
import Avatar from '../components/ui/Avatar'

const PAGE_SIZE = 12

export default function ArchivedPage() {
  const [tab, setTab] = useState<'projects' | 'epics'>('projects')
  const [projects, setProjects] = useState<Project[]>([])
  const [projectTotal, setProjectTotal] = useState(0)
  const [projectPage, setProjectPage] = useState(1)
  const [epics, setEpics] = useState<Epic[]>([])
  const [epicTotal, setEpicTotal] = useState(0)
  const [epicPage, setEpicPage] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (tab === 'projects') fetchProjects()
    else fetchEpics()
  }, [tab, projectPage, epicPage])

  async function fetchProjects() {
    setLoading(true)
    try {
      const { data, total } = await api.listProjects(projectPage, PAGE_SIZE, true)
      setProjects(data)
      setProjectTotal(total)
    } catch {}
    setLoading(false)
  }

  async function fetchEpics() {
    setLoading(true)
    try {
      const { data, total } = await api.listEpics(epicPage, PAGE_SIZE, true)
      setEpics(data)
      setEpicTotal(total)
    } catch {}
    setLoading(false)
  }

  async function unarchiveProject(id: string) {
    try {
      await api.unarchiveProject(id)
      fetchProjects()
    } catch {}
  }

  async function unarchiveEpic(id: string) {
    try {
      await api.unarchiveEpic(id)
      fetchEpics()
    } catch {}
  }

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-[17px] font-semibold tracking-[-0.01em] text-gray-900">Archived</h1>
        <p className="text-[12px] text-gray-500 mt-1">Projects and epics that have been archived.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-gray-200">
        <button
          onClick={() => setTab('projects')}
          className={`px-3 py-2.5 text-[13px] font-medium border-b-2 transition-colors ${
            tab === 'projects' ? 'border-brand text-brand' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Projects
        </button>
        <button
          onClick={() => setTab('epics')}
          className={`px-3 py-2.5 text-[13px] font-medium border-b-2 transition-colors ${
            tab === 'epics' ? 'border-brand text-brand' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Epics
        </button>
      </div>

      {loading ? (
        <LoadingSkeleton variant="rows" count={4} />
      ) : tab === 'projects' ? (
        <>
          {projects.length === 0 ? (
            <EmptyState
              icon={<FolderKanban size={32} />}
              title="No archived projects"
              description="Archived projects will appear here."
            />
          ) : (
            <Card padding="none" className="overflow-hidden divide-y divide-gray-100">
              {projects.map((project) => (
                <div key={project.id} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="bg-gray-100 rounded p-1 flex shrink-0">
                    <FolderKanban size={13} className="text-gray-400" />
                  </div>
                  <span className="font-mono text-[11px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded shrink-0">{project.key}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-gray-700 truncate">{project.name}</div>
                    {project.description && (
                      <div className="text-[12px] text-gray-400 truncate">{project.description}</div>
                    )}
                  </div>
                  <button
                    onClick={() => unarchiveProject(project.id)}
                    title="Unarchive project and its epics"
                    className="text-brand hover:text-brand-deep shrink-0 transition-colors"
                  >
                    <ArchiveRestore size={14} />
                  </button>
                </div>
              ))}
            </Card>
          )}
          <Pagination page={projectPage} pageSize={PAGE_SIZE} total={projectTotal} onPageChange={setProjectPage} />
        </>
      ) : (
        <>
          {epics.length === 0 ? (
            <EmptyState
              icon={<Flag size={32} />}
              title="No archived epics"
              description="Archived epics will appear here."
            />
          ) : (
            <Card padding="none" className="overflow-hidden divide-y divide-gray-100">
              {epics.map((epic) => (
                <div key={epic.id} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="bg-gray-100 rounded p-1 flex shrink-0">
                    <Flag size={13} className="text-gray-400" />
                  </div>
                  <span className="font-mono text-[11px] text-gray-400 shrink-0 w-16">{epic.id.slice(0, 8)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-gray-700 truncate">{epic.title}</div>
                    {epic.description && (
                      <div className="text-[12px] text-gray-400 truncate">{epic.description}</div>
                    )}
                  </div>
                  {epic.project && (
                    <span className="text-[11px] font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded shrink-0">
                      {epic.project.key}
                    </span>
                  )}
                  {epic.owner && (
                    <span className="shrink-0"><Avatar name={epic.owner.full_name} size="sm" /></span>
                  )}
                  <button
                    onClick={() => unarchiveEpic(epic.id)}
                    title="Unarchive"
                    className="text-brand hover:text-brand-deep shrink-0 transition-colors"
                  >
                    <ArchiveRestore size={14} />
                  </button>
                </div>
              ))}
            </Card>
          )}
          <Pagination page={epicPage} pageSize={PAGE_SIZE} total={epicTotal} onPageChange={setEpicPage} />
        </>
      )}
    </div>
  )
}
