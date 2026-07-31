import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Filter, BookOpen, Flag, Bug, CheckSquare } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { STATUS_OPTIONS, PRIORITY_OPTIONS, PRIORITY_META } from '../lib/constants'
import type { Status, Priority } from '../lib/constants'
import type { Story, User } from '../types'
import Avatar from '../components/ui/Avatar'
import StatusBadge from '../components/ui/StatusBadge'

export default function SearchPage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Story[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [priorityFilter, setPriorityFilter] = useState<string>('')
  const [assigneeFilter, setAssigneeFilter] = useState<string>('')
  const [members, setMembers] = useState<User[]>([])
  const [showFilters, setShowFilters] = useState(false)

  async function handleSearch() {
    setLoading(true)
    setSearched(true)

    // Fetch members for filter dropdown (once)
    if (members.length === 0) {
      const { data } = await supabase.from('profiles').select('*')
      if (data) setMembers(data)
    }

    let queryBuilder = supabase
      .from('stories')
      .select('*, assignee:profiles!stories_assignee_id_fkey(id, full_name, email)')
      .order('updated_at', { ascending: false })
      .limit(50)

    // Text search
    if (query.trim()) {
      queryBuilder = queryBuilder.or(`title.ilike.%${query}%,display_id.ilike.%${query}%,description.ilike.%${query}%`)
    }

    // Filters
    if (statusFilter) queryBuilder = queryBuilder.eq('status', statusFilter)
    if (priorityFilter) queryBuilder = queryBuilder.eq('priority', priorityFilter)
    if (assigneeFilter) queryBuilder = queryBuilder.eq('assignee_id', assigneeFilter)

    const { data } = await queryBuilder
    setResults(data || [])
    setLoading(false)
  }

  return (
    <div>
      <h1 className="font-display text-[22px] font-semibold text-ink mb-5">Search & Filter</h1>

      {/* Search bar */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand/20"
            placeholder="Search by title, ID, or description..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch() }}
          />
        </div>
        <button
          onClick={() => setShowFilters((s) => !s)}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
            showFilters ? 'bg-brand-soft border-brand text-brand' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Filter size={14} /> Filters
        </button>
        <button
          onClick={handleSearch}
          className="px-5 py-2.5 bg-brand text-white rounded-lg text-sm font-semibold hover:bg-brand-deep transition-colors"
        >
          Search
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="flex gap-3 mb-5 p-4 bg-white border border-gray-200 rounded-xl">
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 mb-1">Status</label>
            <select
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm outline-none"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All</option>
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 mb-1">Priority</label>
            <select
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm outline-none"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="">All</option>
              {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 mb-1">Assignee</label>
            <select
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm outline-none"
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
            >
              <option value="">All</option>
              {members.map((m) => <option key={m.id} value={m.id}>{m.full_name}</option>)}
            </select>
          </div>
          <button
            onClick={() => { setStatusFilter(''); setPriorityFilter(''); setAssigneeFilter('') }}
            className="self-end text-[12px] text-gray-400 hover:text-gray-600 pb-1.5"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Results */}
      {loading && <p className="text-gray-400 text-sm">Searching...</p>}

      {searched && !loading && results.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <Search size={32} className="mx-auto mb-3 text-gray-300" />
          <p className="text-sm">No results found. Try a different search or filter.</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {results.map((story, i) => (
            <div
              key={story.id}
              onClick={() => navigate(`/stories/${story.id}`)}
              className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                i < results.length - 1 ? 'border-b border-gray-100' : ''
              }`}
            >
              <span className="text-[13px]">📗</span>
              <span className="font-mono text-[11px] text-gray-400 shrink-0 w-16">{story.display_id}</span>
              <span className="text-[13px] text-ink font-medium flex-1 truncate">{story.title}</span>
              <span className="text-[11px]">{PRIORITY_META[story.priority as Priority]?.icon}</span>
              {story.assignee && <Avatar name={story.assignee.full_name} size="sm" />}
              <StatusBadge status={story.status as Status} />
              {story.due_date && (
                <span className="text-[10.5px] text-gray-400 shrink-0">
                  Due {new Date(story.due_date).toLocaleDateString()}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
