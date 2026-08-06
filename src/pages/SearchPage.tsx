import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Search, Filter } from 'lucide-react'
import { api } from '../lib/api'
import { STATUS_OPTIONS, PRIORITY_OPTIONS, PRIORITY_META, ISSUE_TYPE_META } from '../lib/constants'
import type { Status, Priority } from '../lib/constants'
import type { User } from '../types'
import Avatar from '../components/ui/Avatar'
import StatusBadge from '../components/ui/StatusBadge'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Pagination from '../components/ui/Pagination'
import EmptyState from '../components/ui/EmptyState'
import { useDocumentTitle } from '../lib/useDocumentTitle'

const PAGE_SIZE = 20

interface SearchResult {
  id: string
  kind: 'story' | 'issue'
  type: string
  display_id: string
  title: string
  status: string
  priority: string
  due_date?: string | null
  assignee?: { full_name: string } | null
}

export default function SearchPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  useDocumentTitle('Search')
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [results, setResults] = useState<SearchResult[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [priorityFilter, setPriorityFilter] = useState<string>('')
  const [assigneeFilter, setAssigneeFilter] = useState<string>('')
  const [members, setMembers] = useState<User[]>([])
  const [showFilters, setShowFilters] = useState(false)

  // Debounced live search — re-runs 300ms after the query or any filter
  // settles. Skips the fetch entirely when nothing is set, so landing on
  // the page cold doesn't dump every story/issue in the workspace.
  useEffect(() => {
    if (!query.trim() && !statusFilter && !priorityFilter && !assigneeFilter) {
      setResults([])
      setTotal(0)
      setSearched(false)
      return
    }
    const t = setTimeout(() => {
      setPage(1)
      handleSearch(1)
    }, 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, statusFilter, priorityFilter, assigneeFilter])

  async function handleSearch(pageOverride?: number) {
    const p = pageOverride ?? page
    setLoading(true)
    setSearched(true)

    // Fetch members for filter dropdown (once)
    if (members.length === 0) {
      try {
        const { data } = await api.listPeople(1, 100)
        setMembers(data)
      } catch {
        // Filter dropdown just stays empty.
      }
    }

    try {
      const { data, total: resultTotal } = await api.search({
        q: query.trim() || undefined,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        assignee_id: assigneeFilter || undefined,
        page: p,
        page_size: PAGE_SIZE,
      })
      setResults(data as unknown as SearchResult[])
      setTotal(resultTotal)
    } catch {
      setResults([])
      setTotal(0)
    }
    setLoading(false)
  }

  function goToPage(p: number) {
    setPage(p)
    handleSearch(p)
  }

  return (
    <div>
      <h1 className="text-[17px] font-semibold tracking-[-0.01em] text-gray-900 mb-5">Search & Filter</h1>

      {/* Search bar */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full pl-10 pr-4 h-9 rounded-md border border-gray-200 text-[13px] text-gray-900 shadow-sm outline-none placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/10"
            placeholder="Search by title, ID, or description..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { setPage(1); handleSearch(1) } }}
            aria-label="Search by title, ID, or description"
          />
        </div>
        <button
          onClick={() => setShowFilters((s) => !s)}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg border text-[13px] font-medium transition-colors ${
            showFilters ? 'bg-brand-soft border-brand text-brand' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Filter size={14} /> Filters
        </button>
        <Button size="sm" onClick={() => { setPage(1); handleSearch(1) }}>Search</Button>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card padding="sm" className="flex gap-3 mb-5">
          <div>
            <label className="block text-[12px] font-medium text-gray-500 mb-1">Status</label>
            <select
              className="h-8 px-3 rounded-md border border-gray-200 text-[13px] text-gray-900 shadow-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All</option>
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[12px] font-medium text-gray-500 mb-1">Priority</label>
            <select
              className="h-8 px-3 rounded-md border border-gray-200 text-[13px] text-gray-900 shadow-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="">All</option>
              {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[12px] font-medium text-gray-500 mb-1">Assignee</label>
            <select
              className="h-8 px-3 rounded-md border border-gray-200 text-[13px] text-gray-900 shadow-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
            >
              <option value="">All</option>
              {members.map((m) => <option key={m.id} value={m.id}>{m.full_name}</option>)}
            </select>
          </div>
          <button
            onClick={() => { setStatusFilter(''); setPriorityFilter(''); setAssigneeFilter('') }}
            className="self-end text-[13px] text-gray-400 hover:text-gray-600 pb-1.5"
          >
            Clear all
          </button>
        </Card>
      )}

      {/* Results */}
      {loading && <p className="text-gray-400 text-[13px]">Searching...</p>}

      {searched && !loading && total === 0 && (
        <EmptyState
          icon={<Search size={32} />}
          title="No results found"
          description="Try a different search or filter."
        />
      )}

      {results.length > 0 && (
        <Card padding="none" className="overflow-hidden">
          {results.map((item, i) => (
            <div
              key={`${item.kind}-${item.id}`}
              onClick={() => navigate(item.kind === 'story' ? `/stories/${item.display_id}` : `/issues/${item.display_id}`)}
              className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                i < results.length - 1 ? 'border-b border-gray-100' : ''
              }`}
            >
              <span className="text-[13px] shrink-0">{ISSUE_TYPE_META[item.type as keyof typeof ISSUE_TYPE_META]?.icon || '📗'}</span>
              <span className="font-mono text-[12px] text-gray-400 shrink-0 w-[70px]">{item.display_id}</span>
              <span className="text-[13px] text-gray-900 font-medium flex-1 min-w-0 truncate">{item.title}</span>
              <span className="text-[12px] shrink-0 w-4 text-center" style={{ color: PRIORITY_META[item.priority as Priority]?.color }}>{PRIORITY_META[item.priority as Priority]?.icon}</span>
              <span className="shrink-0 w-5 flex justify-center">{item.assignee ? <Avatar name={item.assignee.full_name} size="sm" /> : null}</span>
              <span className="shrink-0"><StatusBadge status={item.status as Status} /></span>
              {item.due_date && (
                <span className="text-[12px] text-gray-400 shrink-0">
                  Due {new Date(item.due_date).toLocaleDateString()}
                </span>
              )}
            </div>
          ))}
        </Card>
      )}

      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={goToPage} />
    </div>
  )
}
