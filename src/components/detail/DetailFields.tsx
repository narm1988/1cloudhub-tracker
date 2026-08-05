import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Upload } from 'lucide-react'
import { STATUS_OPTIONS, STATUS_META, PRIORITY_META, PRIORITY_OPTIONS, REOPEN_TARGETS, TERMINAL_STATUSES } from '../../lib/constants'
import type { Status, Priority } from '../../lib/constants'
import type { User } from '../../types'
import Button from '../ui/Button'
import Avatar from '../ui/Avatar'

export const SECTION_HEADER = 'text-sm font-semibold text-gray-900'

export function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2.5 gap-3">
      <span className="text-sm text-gray-500 shrink-0">{label}</span>
      {children}
    </div>
  )
}

export function InlineTitle({
  value,
  onSave,
  placeholder,
}: {
  value: string
  onSave: (v: string) => void
  placeholder?: string
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  useEffect(() => {
    if (!editing) setDraft(value)
  }, [value, editing])

  if (!editing) {
    return (
      <h1
        onClick={() => setEditing(true)}
        title="Click to edit"
        className="text-2xl font-semibold tracking-tight cursor-text rounded-md px-1.5 -mx-1.5 py-0.5 hover:bg-gray-50 transition-colors"
      >
        {value ? (
          <span className="text-gray-900">{value}</span>
        ) : (
          <span className="text-gray-400">{placeholder || 'Untitled'}</span>
        )}
      </h1>
    )
  }

  return (
    <input
      autoFocus
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      placeholder={placeholder}
      onBlur={() => {
        setEditing(false)
        const trimmed = draft.trim()
        if (trimmed !== value) onSave(trimmed)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur()
        if (e.key === 'Escape') { setDraft(value); setEditing(false) }
      }}
      className="text-2xl font-semibold tracking-tight text-gray-900 w-full px-1.5 -mx-1.5 py-0.5 rounded-md border border-brand outline-none focus:ring-1 focus:ring-brand/30"
    />
  )
}

export function InlineDescription({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  useEffect(() => {
    if (!editing) setDraft(value)
  }, [value, editing])

  if (!editing) {
    return (
      <div
        onClick={() => setEditing(true)}
        className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap rounded-md px-1.5 -mx-1.5 py-1 hover:bg-gray-50 transition-colors cursor-text min-h-[32px]"
      >
        {value || <span className="text-gray-400">Add a description...</span>}
      </div>
    )
  }

  return (
    <textarea
      autoFocus
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        setEditing(false)
        if (draft !== value) onSave(draft)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') { setDraft(value); setEditing(false) }
      }}
      placeholder="Add a description..."
      className="w-full px-2.5 py-2 rounded-lg border border-brand text-sm outline-none focus:ring-1 focus:ring-brand/30 resize-y min-h-[100px]"
    />
  )
}

function StatusSelect({ status, onChange }: { status: Status; onChange: (s: Status) => void }) {
  const meta = STATUS_META[status]
  return (
    <select
      value={status}
      onChange={(e) => onChange(e.target.value as Status)}
      aria-label="Status"
      className={`text-xs font-semibold pl-2.5 pr-6 py-0.5 rounded-md whitespace-nowrap outline-none cursor-pointer border-0 appearance-none focus:ring-2 focus:ring-brand/50 ${meta.tailwind}`}
      style={{
        backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%236B7280'><path d='M5.5 7.5l4.5 4.5 4.5-4.5' stroke='%236B7280' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/></svg>")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 4px center',
        backgroundSize: '12px',
      }}
    >
      {STATUS_OPTIONS.map((s) => (
        <option key={s} value={s}>{s}</option>
      ))}
    </select>
  )
}

export function StatusField({ status, onChange }: { status: Status; onChange: (s: Status) => void }) {
  const [reopenOpen, setReopenOpen] = useState(false)
  const isTerminal = TERMINAL_STATUSES.includes(status)

  return (
    <div className="flex items-center gap-1.5">
      <StatusSelect status={status} onChange={onChange} />
      {isTerminal && (
        <div className="relative">
          <button
            onClick={() => setReopenOpen((o) => !o)}
            className="flex items-center gap-1 text-xs font-semibold text-brand hover:text-brand-deep px-2 py-0.5 rounded-md border border-brand/30 hover:bg-brand-soft transition-colors"
          >
            Reopen <ChevronDown size={11} />
          </button>
          {reopenOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setReopenOpen(false)} />
              <div className="absolute left-0 top-full mt-1 w-36 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
                {REOPEN_TARGETS.map((s) => (
                  <button
                    key={s}
                    onClick={() => { onChange(s); setReopenOpen(false) }}
                    className="w-full text-left px-3 py-1.5 text-sm text-gray-900 hover:bg-gray-50"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export function PriorityField({
  value,
  onChange,
}: {
  value: Priority
  onChange: (p: Priority) => void
}) {
  const [open, setOpen] = useState(false)
  const meta = PRIORITY_META[value]

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 hover:bg-gray-50 rounded-md px-1.5 -mx-1.5 py-1 transition-colors"
      >
        <span className="text-sm leading-none">{meta.icon}</span>
        <span className="text-sm text-gray-900 font-medium">{value}</span>
        <ChevronDown size={12} className="text-gray-400" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
            {PRIORITY_OPTIONS.map((p) => (
              <button
                key={p}
                onClick={() => { onChange(p); setOpen(false) }}
                className={`w-full flex items-center gap-2 text-left px-3 py-1.5 text-sm transition-colors ${
                  p === value ? 'bg-brand-soft text-brand font-semibold' : 'text-gray-900 hover:bg-gray-50'
                }`}
              >
                <span className="text-sm leading-none">{PRIORITY_META[p].icon}</span>
                {p}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export function AssigneeField({
  assigneeId,
  members,
  currentUserId,
  onChange,
}: {
  assigneeId: string | null
  members: User[]
  currentUserId?: string
  onChange: (id: string | null) => void
}) {
  const [open, setOpen] = useState(false)
  const assignee = members.find((m) => m.id === assigneeId) || null

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 hover:bg-gray-50 rounded-md px-1.5 -mx-1.5 py-1 transition-colors"
      >
        {assignee ? (
          <>
            <span className="text-sm text-gray-900 font-medium">{assignee.full_name}</span>
            <Avatar name={assignee.full_name} size="sm" />
          </>
        ) : (
          <span className="text-sm text-gray-400">Unassigned</span>
        )}
        <ChevronDown size={12} className="text-gray-400" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1 max-h-64 overflow-y-auto">
            {currentUserId && assigneeId !== currentUserId && (
              <button
                onClick={() => { onChange(currentUserId); setOpen(false) }}
                className="w-full text-left px-3 py-1.5 text-sm text-brand hover:bg-gray-50 font-medium"
              >
                Assign to me
              </button>
            )}
            <button
              onClick={() => { onChange(null); setOpen(false) }}
              className="w-full text-left px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-50"
            >
              Unassigned
            </button>
            <div className="h-px bg-gray-100 my-1" />
            {members.map((m) => (
              <button
                key={m.id}
                onClick={() => { onChange(m.id); setOpen(false) }}
                className="w-full flex items-center gap-2 text-left px-3 py-1.5 text-sm text-gray-900 hover:bg-gray-50"
              >
                <Avatar name={m.full_name} size="sm" /> {m.full_name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export function CommentInput({ onSubmit }: { onSubmit: (content: string) => void }) {
  const [content, setContent] = useState('')

  function handleSubmit() {
    if (!content.trim()) return
    onSubmit(content)
    setContent('')
  }

  return (
    <div className="flex gap-3">
      <textarea
        className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 resize-none min-h-[60px]"
        placeholder="Add a comment..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSubmit()
        }}
      />
      <Button size="sm" onClick={handleSubmit} disabled={!content.trim()} className="self-end">
        Post
      </Button>
    </div>
  )
}

export function FileUploadButton({ onUpload }: { onUpload: (file: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".png,.jpg,.jpeg,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onUpload(file)
          e.target.value = ''
        }}
      />
      <Button size="sm" variant="secondary" onClick={() => inputRef.current?.click()}>
        <Upload size={13} /> Upload
      </Button>
    </>
  )
}
