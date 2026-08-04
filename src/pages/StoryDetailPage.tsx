import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Plus, Link2, Paperclip, MessageSquare,
  Upload, X, Trash2, Tags, ChevronDown, History
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import {
  STATUS_OPTIONS, STATUS_META, PRIORITY_OPTIONS, PRIORITY_META,
  ISSUE_TYPES, ISSUE_TYPE_META, LINK_TYPES
} from '../lib/constants'
import type { Status, Priority, IssueType, LinkType } from '../lib/constants'
import type { Story, Issue, Comment, Attachment, User, IssueLink } from '../types'
import Button from '../components/ui/Button'
import Avatar from '../components/ui/Avatar'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'

const SECTION_HEADER = 'font-display text-[14px] font-semibold text-ink'

export default function StoryDetailPage() {
  const { storyId } = useParams<{ storyId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [story, setStory] = useState<Story | null>(null)
  const [epic, setEpic] = useState<{ id: string; title: string } | null>(null)
  const [issues, setIssues] = useState<Issue[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [links, setLinks] = useState<IssueLink[]>([])
  const [members, setMembers] = useState<User[]>([])
  const [allStories, setAllStories] = useState<{ id: string; title: string; display_id: string }[]>([])
  const [loading, setLoading] = useState(true)

  const [showCreateIssue, setShowCreateIssue] = useState(false)
  const [showLinkModal, setShowLinkModal] = useState(false)

  useEffect(() => {
    if (storyId) {
      fetchAll()
    }
  }, [storyId])

  async function fetchAll() {
    await Promise.all([
      fetchStory(),
      fetchIssues(),
      fetchComments(),
      fetchAttachments(),
      fetchLinks(),
      fetchMembers(),
      fetchAllStories(),
    ])
    setLoading(false)
  }

  async function fetchStory() {
    const { data } = await supabase
      .from('stories')
      .select('*, assignee:profiles!stories_assignee_id_fkey(id, full_name, email), reporter:profiles!stories_reporter_id_fkey(id, full_name, email)')
      .eq('id', storyId)
      .single()
    if (data) {
      setStory(data)
      if (data.epic_id) fetchEpic(data.epic_id)
    }
  }

  async function fetchEpic(epicId: string) {
    const { data } = await supabase.from('epics').select('id, title').eq('id', epicId).single()
    if (data) setEpic(data)
  }

  async function fetchIssues() {
    const { data } = await supabase
      .from('issues')
      .select('*, assignee:profiles!issues_assignee_id_fkey(id, full_name, email), reporter:profiles!issues_reporter_id_fkey(id, full_name, email)')
      .eq('story_id', storyId)
      .order('created_at', { ascending: false })
    if (data) setIssues(data)
  }

  async function fetchComments() {
    const { data } = await supabase
      .from('comments')
      .select('*, author:profiles!comments_author_id_fkey(id, full_name, email, avatar_url)')
      .eq('parent_id', storyId)
      .eq('parent_type', 'story')
      .order('created_at')
    if (data) setComments(data)
  }

  async function fetchAttachments() {
    const { data } = await supabase
      .from('attachments')
      .select('*')
      .eq('parent_id', storyId)
      .eq('parent_type', 'story')
      .order('created_at', { ascending: false })
    if (data) setAttachments(data)
  }

  async function fetchLinks() {
    const { data } = await supabase
      .from('issue_links')
      .select('*')
      .or(`source_id.eq.${storyId},target_id.eq.${storyId}`)
    if (data) setLinks(data)
  }

  async function fetchMembers() {
    const { data } = await supabase.from('profiles').select('*')
    if (data) setMembers(data)
  }

  async function fetchAllStories() {
    const { data } = await supabase
      .from('stories')
      .select('id, title, display_id')
      .neq('id', storyId)
    if (data) setAllStories(data)
  }

  async function updateStory(updates: Partial<Story>) {
    // optimistic local update so inline fields feel instant
    setStory((prev) => (prev ? { ...prev, ...updates } : prev))
    await supabase.from('stories').update(updates).eq('id', storyId)
    fetchStory()
  }

  async function createIssue(data: {
    title: string; description: string; type: IssueType;
    assigneeId: string; priority: Priority; status: Status
  }) {
    const count = issues.length + 1
    const prefix = data.type === 'Bug' ? 'BUG' : 'TSK'
    const displayId = `${prefix}-${100 + count}`

    await supabase.from('issues').insert({
      story_id: storyId,
      title: data.title,
      description: data.description,
      type: data.type,
      assignee_id: data.assigneeId || null,
      reporter_id: user?.id,
      priority: data.priority,
      status: data.status,
      display_id: displayId,
    })
    setShowCreateIssue(false)
    fetchIssues()
  }

  async function addComment(content: string) {
    await supabase.from('comments').insert({
      parent_id: storyId,
      parent_type: 'story',
      author_id: user?.id,
      content,
    })
    fetchComments()
  }

  async function deleteComment(commentId: string) {
    await supabase.from('comments').delete().eq('id', commentId)
    fetchComments()
  }

  async function uploadFile(file: File) {
    const fileExt = file.name.split('.').pop()
    const filePath = `attachments/${storyId}/${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('tracker-files')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      alert(`Upload failed: ${uploadError.message}. Make sure the "tracker-files" bucket exists in Supabase Storage and is set to public.`)
      return
    }

    const { data: urlData } = supabase.storage
      .from('tracker-files')
      .getPublicUrl(filePath)

    await supabase.from('attachments').insert({
      parent_id: storyId,
      parent_type: 'story',
      file_name: file.name,
      file_url: urlData.publicUrl,
      file_size: file.size,
      uploaded_by: user?.id,
    })
    fetchAttachments()
  }

  async function deleteAttachment(att: Attachment) {
    const path = att.file_url.split('/tracker-files/').pop()
    if (path) {
      await supabase.storage.from('tracker-files').remove([path])
    }
    await supabase.from('attachments').delete().eq('id', att.id)
    fetchAttachments()
  }

  async function addLink(targetId: string, linkType: LinkType) {
    await supabase.from('issue_links').insert({
      source_id: storyId,
      source_type: 'story',
      target_id: targetId,
      target_type: 'story',
      link_type: linkType,
    })
    setShowLinkModal(false)
    fetchLinks()
  }

  async function removeLink(linkId: string) {
    await supabase.from('issue_links').delete().eq('id', linkId)
    fetchLinks()
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>
  }

  if (!story) {
    return <div className="text-gray-500">Story not found.</div>
  }

  return (
    <div className="max-w-[1600px]">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-gray-500 text-[13px] hover:text-gray-700 mb-4"
      >
        <ArrowLeft size={14} /> Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5 items-start">
        {/* ---- Main column ---- */}
        <div className="min-w-0">
          {/* Header card */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-4">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="text-[13px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold">
                {ISSUE_TYPE_META.Story.icon} Story
              </span>
              <span className="font-mono text-[12px] text-gray-400">{story.display_id}</span>
              <StatusSelect
                status={story.status as Status}
                onChange={(s) => updateStory({ status: s } as any)}
              />
            </div>

            <InlineTitle value={story.title} onSave={(title) => updateStory({ title })} />
          </div>

          {/* Description */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
            <h2 className={`${SECTION_HEADER} mb-2`}>Description</h2>
            <InlineDescription
              value={story.description || ''}
              onSave={(description) => updateStory({ description })}
            />
          </div>

          {/* Child Issues (Tasks/Bugs) */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className={SECTION_HEADER}>Child Issues ({issues.length})</h2>
              <Button size="sm" onClick={() => setShowCreateIssue(true)}>
                <Plus size={13} /> Add issue
              </Button>
            </div>

            {issues.length === 0 ? (
              <p className="text-[13px] text-gray-400 text-center py-4">
                No tasks or bugs yet. Add one to break down this story.
              </p>
            ) : (
              <div className="space-y-2">
                {issues.map((issue) => (
                  <div
                    key={issue.id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
                  >
                    <span className="text-[14px]">
                      {issue.type === 'Bug' ? '🐛' : issue.type === 'Sub-task' ? '📎' : '✅'}
                    </span>
                    <span className="font-mono text-[11px] text-gray-400 shrink-0">{issue.display_id}</span>
                    <span className="text-[13px] text-ink font-medium flex-1 truncate">{issue.title}</span>
                    <span className="text-[11px]">{PRIORITY_META[issue.priority as Priority]?.icon}</span>
                    {issue.assignee && <Avatar name={issue.assignee.full_name} size="sm" />}
                    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-md whitespace-nowrap ${STATUS_META[issue.status as Status]?.tailwind}`}>
                      {issue.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Linked Issues */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className={`${SECTION_HEADER} flex items-center gap-2`}>
                <Link2 size={15} /> Linked Issues ({links.length})
              </h2>
              <Button size="sm" variant="secondary" onClick={() => setShowLinkModal(true)}>
                <Plus size={13} /> Link issue
              </Button>
            </div>

            {links.length === 0 ? (
              <p className="text-[13px] text-gray-400 text-center py-3">No linked issues.</p>
            ) : (
              <div className="space-y-2">
                {links.map((link) => {
                  const isSource = link.source_id === storyId
                  const linkedId = isSource ? link.target_id : link.source_id
                  const linkedStory = allStories.find((s) => s.id === linkedId)
                  return (
                    <div key={link.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-50">
                      <span className="text-[12px] text-gray-500 italic shrink-0">{link.link_type}</span>
                      <span className="font-mono text-[11px] text-gray-400">
                        {linkedStory?.display_id || linkedId.slice(0, 8)}
                      </span>
                      <span className="text-[13px] text-ink flex-1 truncate">
                        {linkedStory?.title || 'Unknown'}
                      </span>
                      <button
                        onClick={() => removeLink(link.id)}
                        className="text-gray-400 hover:text-danger transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Attachments */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className={`${SECTION_HEADER} flex items-center gap-2`}>
                <Paperclip size={15} /> Attachments ({attachments.length})
              </h2>
              <FileUploadButton onUpload={uploadFile} />
            </div>

            {attachments.length === 0 ? (
              <p className="text-[13px] text-gray-400 text-center py-3">No files attached.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {attachments.map((att) => {
                  const isImage = /\.(png|jpg|jpeg|gif|webp)$/i.test(att.file_name)
                  return (
                    <div key={att.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-gray-100 group">
                      {isImage ? (
                        <img
                          src={att.file_url}
                          alt={att.file_name}
                          className="w-10 h-10 rounded object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center shrink-0">
                          <Paperclip size={16} className="text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <a
                          href={att.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[13px] text-brand hover:underline truncate block"
                        >
                          {att.file_name}
                        </a>
                        <span className="text-[11px] text-gray-400">
                          {(att.file_size / 1024).toFixed(1)} KB
                        </span>
                      </div>
                      <button
                        onClick={() => deleteAttachment(att)}
                        className="text-gray-300 hover:text-danger transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Comments */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
            <h2 className={`${SECTION_HEADER} flex items-center gap-2 mb-4`}>
              <MessageSquare size={15} /> Comments ({comments.length})
            </h2>

            <div className="space-y-3 mb-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar name={comment.author?.full_name || 'User'} size="md" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold text-ink">
                        {comment.author?.full_name}
                      </span>
                      <span className="text-[11px] text-gray-400">
                        {new Date(comment.created_at).toLocaleString()}
                      </span>
                      {comment.author_id === user?.id && (
                        <button
                          onClick={() => deleteComment(comment.id)}
                          className="text-gray-300 hover:text-danger ml-auto"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                    <p className="text-[13px] text-gray-700 mt-1 whitespace-pre-wrap leading-relaxed">
                      {comment.content}
                    </p>
                  </div>
                </div>
              ))}
              {comments.length === 0 && (
                <p className="text-[13px] text-gray-400 text-center py-2">No comments yet.</p>
              )}
            </div>

            <CommentInput onSubmit={addComment} />
          </div>

          {/* Audit Log */}
          <AuditLogSection storyId={storyId!} />
        </div>

        {/* ---- Sidebar ---- */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 lg:sticky lg:top-4">
          <h3 className={`${SECTION_HEADER} mb-1`}>Details</h3>

          <div className="divide-y divide-gray-100">
            <DetailRow label="Assignee">
              <AssigneeField
                story={story}
                members={members}
                currentUserId={user?.id}
                onChange={(assigneeId) => updateStory({ assignee_id: assigneeId || null } as any)}
              />
            </DetailRow>

            <div className="py-2.5">
              <LabelsField storyId={storyId!} />
            </div>

            <DetailRow label="Parent">
              {epic ? (
                <button
                  onClick={() => navigate(`/epics/${epic.id}`)}
                  className="text-[13px] text-brand hover:underline font-medium truncate max-w-[170px] text-right"
                >
                  {epic.title}
                </button>
              ) : (
                <span className="text-[13px] text-gray-400">None</span>
              )}
            </DetailRow>

            <DetailRow label="Reporter">
              <span className="text-[13px] text-ink font-medium">{story.reporter?.full_name || 'Unknown'}</span>
            </DetailRow>

            <DetailRow label="Priority">
              <select
                value={story.priority}
                onChange={(e) => updateStory({ priority: e.target.value as Priority } as any)}
                className="text-[13px] text-ink font-medium bg-transparent outline-none cursor-pointer hover:bg-gray-50 rounded px-1.5 py-1 -mx-1.5 text-right"
              >
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p} value={p}>{PRIORITY_META[p].icon} {p}</option>
                ))}
              </select>
            </DetailRow>

            <DetailRow label="Story points">
              <input
                type="number"
                min={0}
                value={story.story_points ?? ''}
                onChange={(e) => updateStory({ story_points: e.target.value ? parseInt(e.target.value) : null } as any)}
                placeholder="None"
                className="text-[13px] text-ink font-medium bg-transparent outline-none hover:bg-gray-50 rounded px-1.5 py-1 -mx-1.5 text-right w-20"
              />
            </DetailRow>

            <DetailRow label="Start date">
              <input
                type="date"
                value={story.start_date || ''}
                onChange={(e) => updateStory({ start_date: e.target.value || null } as any)}
                className="text-[13px] text-ink font-medium bg-transparent outline-none hover:bg-gray-50 rounded px-1.5 py-1 -mx-1.5"
              />
            </DetailRow>

            <DetailRow label="Due date">
              <input
                type="date"
                value={story.due_date || ''}
                onChange={(e) => updateStory({ due_date: e.target.value || null } as any)}
                className="text-[13px] text-ink font-medium bg-transparent outline-none hover:bg-gray-50 rounded px-1.5 py-1 -mx-1.5"
              />
            </DetailRow>
          </div>

          <div className="mt-3 pt-3 border-t border-gray-100 text-[11px] text-gray-400 space-y-0.5">
            <div>Created {new Date(story.created_at).toLocaleDateString()}</div>
            <div>Updated {new Date(story.updated_at).toLocaleDateString()}</div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showCreateIssue && (
        <CreateIssueModal
          members={members}
          onClose={() => setShowCreateIssue(false)}
          onCreate={createIssue}
        />
      )}

      {showLinkModal && (
        <LinkIssueModal
          stories={allStories}
          onClose={() => setShowLinkModal(false)}
          onLink={addLink}
        />
      )}
    </div>
  )
}

/* ---- Sidebar helpers ---- */

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2.5 gap-3">
      <span className="text-[12px] text-gray-500 shrink-0">{label}</span>
      {children}
    </div>
  )
}

function InlineTitle({ value, onSave }: { value: string; onSave: (v: string) => void }) {
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
        className="font-display text-[22px] font-semibold text-ink cursor-text rounded-md px-1.5 -mx-1.5 py-0.5 hover:bg-gray-50 transition-colors"
      >
        {value}
      </h1>
    )
  }

  return (
    <input
      autoFocus
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        setEditing(false)
        const trimmed = draft.trim()
        if (trimmed && trimmed !== value) onSave(trimmed)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur()
        if (e.key === 'Escape') { setDraft(value); setEditing(false) }
      }}
      className="font-display text-[22px] font-semibold text-ink w-full px-1.5 -mx-1.5 py-0.5 rounded-md border border-brand outline-none focus:ring-1 focus:ring-brand/30"
    />
  )
}

function InlineDescription({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  useEffect(() => {
    if (!editing) setDraft(value)
  }, [value, editing])

  if (!editing) {
    return (
      <div
        onClick={() => setEditing(true)}
        className="text-[13.5px] text-gray-700 leading-relaxed whitespace-pre-wrap rounded-md px-1.5 -mx-1.5 py-1 hover:bg-gray-50 transition-colors cursor-text min-h-[32px]"
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
      className="w-full px-2.5 py-2 rounded-lg border border-brand text-[13.5px] outline-none focus:ring-1 focus:ring-brand/30 resize-y min-h-[100px]"
    />
  )
}

function StatusSelect({ status, onChange }: { status: Status; onChange: (s: Status) => void }) {
  const meta = STATUS_META[status]
  return (
    <select
      value={status}
      onChange={(e) => onChange(e.target.value as Status)}
      className={`text-[11px] font-semibold pl-2.5 pr-6 py-0.5 rounded-md whitespace-nowrap outline-none cursor-pointer border-0 appearance-none ${meta.tailwind}`}
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

function AssigneeField({
  story,
  members,
  currentUserId,
  onChange,
}: {
  story: Story
  members: User[]
  currentUserId?: string
  onChange: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const assignee = story.assignee

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 hover:bg-gray-50 rounded-md px-1.5 -mx-1.5 py-1 transition-colors"
      >
        {assignee ? (
          <>
            <span className="text-[13px] text-ink font-medium">{assignee.full_name}</span>
            <Avatar name={assignee.full_name} size="sm" />
          </>
        ) : (
          <span className="text-[13px] text-gray-400">Unassigned</span>
        )}
        <ChevronDown size={12} className="text-gray-400" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1 max-h-64 overflow-y-auto">
            {currentUserId && story.assignee_id !== currentUserId && (
              <button
                onClick={() => { onChange(currentUserId); setOpen(false) }}
                className="w-full text-left px-3 py-1.5 text-[12.5px] text-brand hover:bg-gray-50 font-medium"
              >
                Assign to me
              </button>
            )}
            <button
              onClick={() => { onChange(''); setOpen(false) }}
              className="w-full text-left px-3 py-1.5 text-[12.5px] text-gray-500 hover:bg-gray-50"
            >
              Unassigned
            </button>
            <div className="h-px bg-gray-100 my-1" />
            {members.map((m) => (
              <button
                key={m.id}
                onClick={() => { onChange(m.id); setOpen(false) }}
                className="w-full flex items-center gap-2 text-left px-3 py-1.5 text-[12.5px] text-ink hover:bg-gray-50"
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

function CommentInput({ onSubmit }: { onSubmit: (content: string) => void }) {
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

function FileUploadButton({ onUpload }: { onUpload: (file: File) => void }) {
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

function CreateIssueModal({
  members,
  onClose,
  onCreate,
}: {
  members: User[]
  onClose: () => void
  onCreate: (data: {
    title: string; description: string; type: IssueType;
    assigneeId: string; priority: Priority; status: Status
  }) => void
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<IssueType>('Task')
  const [assigneeId, setAssigneeId] = useState('')
  const [priority, setPriority] = useState<Priority>('Medium')
  const [status, setStatus] = useState<Status>('Created')

  return (
    <Modal title="Create child issue" onClose={onClose} width="max-w-lg">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[13px] font-semibold text-ink mb-1.5">Type</label>
            <select
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:border-brand"
              value={type}
              onChange={(e) => setType(e.target.value as IssueType)}
            >
              {ISSUE_TYPES.filter((t) => t !== 'Story').map((t) => (
                <option key={t} value={t}>{ISSUE_TYPE_META[t].icon} {t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-ink mb-1.5">Priority</label>
            <select
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:border-brand"
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
            >
              {PRIORITY_OPTIONS.map((p) => (
                <option key={p} value={p}>{PRIORITY_META[p].icon} {p}</option>
              ))}
            </select>
          </div>
        </div>

        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Fix login button not responding on mobile"
        />

        <div>
          <label className="block text-[13px] font-semibold text-ink mb-1.5">Description</label>
          <textarea
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 min-h-[80px] resize-y"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Steps to reproduce, expected behavior, screenshots..."
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[13px] font-semibold text-ink mb-1.5">Assign to</label>
            <select
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:border-brand"
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
            >
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.full_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-ink mb-1.5">Status</label>
            <select
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:border-brand"
              value={status}
              onChange={(e) => setStatus(e.target.value as Status)}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <Button onClick={() => onCreate({ title, description, type, assigneeId, priority, status })} className="w-full" disabled={!title.trim()}>
          Create {type.toLowerCase()}
        </Button>
      </div>
    </Modal>
  )
}

function LinkIssueModal({
  stories,
  onClose,
  onLink,
}: {
  stories: { id: string; title: string; display_id: string }[]
  onClose: () => void
  onLink: (targetId: string, linkType: LinkType) => void
}) {
  const [targetId, setTargetId] = useState('')
  const [linkType, setLinkType] = useState<LinkType>('blocks')

  return (
    <Modal title="Link an issue" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="block text-[13px] font-semibold text-ink mb-1.5">Relationship</label>
          <select
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:border-brand"
            value={linkType}
            onChange={(e) => setLinkType(e.target.value as LinkType)}
          >
            {LINK_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[13px] font-semibold text-ink mb-1.5">Target story</label>
          <select
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:border-brand"
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
          >
            <option value="">Select a story...</option>
            {stories.map((s) => (
              <option key={s.id} value={s.id}>{s.display_id} — {s.title}</option>
            ))}
          </select>
        </div>

        <Button onClick={() => onLink(targetId, linkType)} className="w-full" disabled={!targetId}>
          Link issue
        </Button>
      </div>
    </Modal>
  )
}

/* ---- Audit Log ---- */
interface ActivityLogEntry {
  id: string
  action: string
  field_name: string | null
  old_value: string | null
  new_value: string | null
  created_at: string
  user: { id: string; full_name: string } | null
}

function describeActivity(log: ActivityLogEntry) {
  const name = log.user?.full_name || 'Someone'
  switch (log.action) {
    case 'created':
      return `${name} created this story`
    case 'comment_added':
      return `${name} added a comment`
    case 'attachment_added':
      return `${name} attached "${log.new_value}"`
    case 'label_added':
      return `${name} added label "${log.new_value}"`
    case 'updated': {
      const field = log.field_name || 'a field'
      const from = log.old_value || 'empty'
      const to = log.new_value || 'empty'
      return `${name} changed ${field} from "${from}" to "${to}"`
    }
    default:
      return `${name} ${log.action}`
  }
}

function AuditLogSection({ storyId }: { storyId: string }) {
  const [logs, setLogs] = useState<ActivityLogEntry[]>([])
  const [open, setOpen] = useState(false)
  const [loaded, setLoaded] = useState(false)

  async function fetchLogs() {
    const { data } = await supabase
      .from('activity_log')
      .select('*, user:profiles!activity_log_user_id_fkey(id, full_name)')
      .eq('parent_id', storyId)
      .eq('parent_type', 'story')
      .order('created_at', { ascending: false })
    if (data) setLogs(data as unknown as ActivityLogEntry[])
    setLoaded(true)
  }

  function toggle() {
    setOpen((o) => !o)
    if (!loaded) fetchLogs()
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
      <button onClick={toggle} className="w-full flex items-center justify-between">
        <h2 className={`${SECTION_HEADER} flex items-center gap-2`}>
          <History size={15} /> Audit Log{loaded ? ` (${logs.length})` : ''}
        </h2>
        <ChevronDown size={16} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="mt-4 space-y-3">
          {!loaded ? (
            <p className="text-[13px] text-gray-400 text-center py-2">Loading...</p>
          ) : logs.length === 0 ? (
            <p className="text-[13px] text-gray-400 text-center py-2">No activity yet.</p>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="flex items-start gap-2.5">
                <Avatar name={log.user?.full_name || 'User'} size="sm" />
                <div className="flex-1 min-w-0">
                  <span className="text-[12.5px] text-gray-700">{describeActivity(log)}</span>
                  <span className="text-[11px] text-gray-400 ml-2">{new Date(log.created_at).toLocaleString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

/* ---- Labels Field (sidebar) ---- */
const LABEL_COLORS = ['#5B5FEF', '#1E9E6B', '#C6820F', '#E5484D', '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6']

function LabelsField({ storyId }: { storyId: string }) {
  const [labels, setLabels] = useState<{ id: string; name: string; color: string }[]>([])
  const [allLabels, setAllLabels] = useState<{ id: string; name: string; color: string }[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [newLabelName, setNewLabelName] = useState('')
  const [newLabelColor, setNewLabelColor] = useState(LABEL_COLORS[0])

  useEffect(() => {
    fetchLabels()
    fetchAllLabels()
  }, [storyId])

  async function fetchLabels() {
    const { data } = await supabase
      .from('story_labels')
      .select('label_id, labels:labels!story_labels_label_id_fkey(id, name, color)')
      .eq('story_id', storyId)
    if (data) {
      const mapped = data.map((d: any) => d.labels).filter(Boolean)
      setLabels(mapped)
    }
  }

  async function fetchAllLabels() {
    const { data } = await supabase.from('labels').select('*').order('name')
    if (data) setAllLabels(data)
  }

  async function createAndAttachLabel() {
    if (!newLabelName.trim()) return
    const { data } = await supabase.from('labels').insert({
      name: newLabelName.trim(),
      color: newLabelColor,
      project_id: null,
    }).select().single()

    if (data) {
      await supabase.from('story_labels').insert({
        story_id: storyId,
        label_id: data.id,
      })
    }
    setNewLabelName('')
    setShowAdd(false)
    fetchLabels()
    fetchAllLabels()
  }

  async function attachExistingLabel(labelId: string) {
    await supabase.from('story_labels').insert({
      story_id: storyId,
      label_id: labelId,
    })
    fetchLabels()
  }

  async function removeLabel(labelId: string) {
    await supabase.from('story_labels').delete()
      .eq('story_id', storyId)
      .eq('label_id', labelId)
    fetchLabels()
  }

  const unattachedLabels = allLabels.filter((l) => !labels.find((sl) => sl.id === l.id))

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[12px] text-gray-500 flex items-center gap-1">
          <Tags size={12} /> Labels
        </span>
        <button
          onClick={() => setShowAdd((s) => !s)}
          className="text-[11px] text-brand hover:text-brand-deep font-medium"
        >
          + Add
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5 justify-end">
        {labels.map((label) => (
          <span
            key={label.id}
            className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full text-white group"
            style={{ backgroundColor: label.color }}
          >
            {label.name}
            <button
              onClick={() => removeLabel(label.id)}
              className="opacity-0 group-hover:opacity-100 ml-0.5 hover:text-red-200"
            >
              ×
            </button>
          </span>
        ))}
        {labels.length === 0 && !showAdd && (
          <span className="text-[12px] text-gray-400">None</span>
        )}
      </div>

      {showAdd && (
        <div className="border border-gray-200 rounded-lg p-2.5 mt-2 space-y-2.5">
          {unattachedLabels.length > 0 && (
            <div>
              <label className="block text-[10.5px] font-semibold text-gray-500 mb-1.5">Existing labels</label>
              <div className="flex flex-wrap gap-1.5">
                {unattachedLabels.map((label) => (
                  <button
                    key={label.id}
                    onClick={() => attachExistingLabel(label.id)}
                    className="text-[10.5px] font-medium px-2 py-0.5 rounded-full text-white hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: label.color }}
                  >
                    + {label.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10.5px] font-semibold text-gray-500 mb-1.5">Create new label</label>
            <div className="flex items-center gap-1.5">
              <input
                className="flex-1 min-w-0 px-2 py-1.5 rounded-lg border border-gray-200 text-[11.5px] outline-none focus:border-brand"
                placeholder="Label name..."
                value={newLabelName}
                onChange={(e) => setNewLabelName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') createAndAttachLabel() }}
              />
              <div className="flex gap-1 shrink-0">
                {LABEL_COLORS.slice(0, 4).map((c) => (
                  <button
                    key={c}
                    onClick={() => setNewLabelColor(c)}
                    className={`w-4 h-4 rounded-full border-2 ${newLabelColor === c ? 'border-ink' : 'border-transparent'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <button
              onClick={createAndAttachLabel}
              disabled={!newLabelName.trim()}
              className="w-full mt-1.5 text-[11px] font-semibold px-3 py-1.5 bg-brand text-white rounded-lg disabled:opacity-50"
            >
              Create
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
