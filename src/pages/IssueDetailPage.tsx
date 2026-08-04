import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Paperclip, MessageSquare, Trash2, ChevronDown } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { ISSUE_TYPES, ISSUE_TYPE_META } from '../lib/constants'
import type { Status, Priority, IssueType } from '../lib/constants'
import type { Issue, Comment, Attachment, User } from '../types'
import Button from '../components/ui/Button'
import Avatar from '../components/ui/Avatar'
import {
  SECTION_HEADER, DetailRow, InlineTitle, InlineDescription,
  StatusField, PriorityField, AssigneeField, CommentInput, FileUploadButton,
} from '../components/detail/DetailFields'
import AuditLogSection from '../components/detail/AuditLogSection'
import LabelsField from '../components/detail/LabelsField'

interface IssueDraft {
  title: string
  description: string
  type: IssueType
  status: Status
  priority: Priority
  assignee_id: string | null
  story_points: number | null
  start_date: string | null
  due_date: string | null
}

function seedDraft(i: Issue): IssueDraft {
  return {
    title: i.title,
    description: i.description || '',
    type: i.type as IssueType,
    status: i.status as Status,
    priority: i.priority as Priority,
    assignee_id: i.assignee_id || null,
    story_points: i.story_points ?? null,
    start_date: i.start_date || null,
    due_date: i.due_date || null,
  }
}

function normalize(v: string | number | null | undefined) {
  return v === undefined || v === null || v === '' ? null : v
}

export default function IssueDetailPage() {
  const { issueId } = useParams<{ issueId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [issue, setIssue] = useState<Issue | null>(null)
  const [parentStory, setParentStory] = useState<{ id: string; title: string; display_id: string } | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [members, setMembers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  const [draft, setDraft] = useState<IssueDraft | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (issueId) fetchAll()
  }, [issueId])

  useEffect(() => {
    setDraft(null)
  }, [issueId])

  async function fetchAll() {
    await Promise.all([fetchIssue(), fetchComments(), fetchAttachments(), fetchMembers()])
    setLoading(false)
  }

  async function fetchIssue() {
    const { data } = await supabase
      .from('issues')
      .select('*, assignee:profiles!issues_assignee_id_fkey(id, full_name, email), reporter:profiles!issues_reporter_id_fkey(id, full_name, email)')
      .eq('id', issueId)
      .single()
    if (data) {
      setIssue(data)
      if (data.story_id) fetchParentStory(data.story_id)
    }
  }

  async function fetchParentStory(storyId: string) {
    const { data } = await supabase.from('stories').select('id, title, display_id').eq('id', storyId).single()
    if (data) setParentStory(data)
  }

  async function fetchComments() {
    const { data } = await supabase
      .from('comments')
      .select('*, author:profiles!comments_author_id_fkey(id, full_name, email, avatar_url)')
      .eq('parent_id', issueId)
      .eq('parent_type', 'issue')
      .order('created_at')
    if (data) setComments(data)
  }

  async function fetchAttachments() {
    const { data } = await supabase
      .from('attachments')
      .select('*')
      .eq('parent_id', issueId)
      .eq('parent_type', 'issue')
      .order('created_at', { ascending: false })
    if (data) setAttachments(data)
  }

  async function fetchMembers() {
    const { data } = await supabase.from('profiles').select('*')
    if (data) setMembers(data)
  }

  async function saveChanges() {
    if (!draft) return
    setSaving(true)
    await supabase.from('issues').update({
      title: draft.title,
      description: draft.description || null,
      type: draft.type,
      status: draft.status,
      priority: draft.priority,
      assignee_id: draft.assignee_id,
      story_points: draft.story_points,
      start_date: draft.start_date,
      due_date: draft.due_date,
    }).eq('id', issueId)
    await fetchIssue()
    setSaving(false)
  }

  function cancelChanges() {
    if (issue) setDraft(seedDraft(issue))
  }

  async function addComment(content: string) {
    await supabase.from('comments').insert({
      parent_id: issueId,
      parent_type: 'issue',
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
    const filePath = `attachments/${issueId}/${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('tracker-files')
      .upload(filePath, file, { cacheControl: '3600', upsert: false })

    if (uploadError) {
      alert(`Upload failed: ${uploadError.message}. Make sure the "tracker-files" bucket exists in Supabase Storage and is set to public.`)
      return
    }

    const { data: urlData } = supabase.storage.from('tracker-files').getPublicUrl(filePath)

    await supabase.from('attachments').insert({
      parent_id: issueId,
      parent_type: 'issue',
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

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>
  }

  if (!issue) {
    return <div className="text-gray-500">Issue not found.</div>
  }

  const current = draft ?? seedDraft(issue)
  const isDirty =
    current.title !== issue.title ||
    normalize(current.description) !== normalize(issue.description) ||
    current.type !== issue.type ||
    current.status !== issue.status ||
    current.priority !== issue.priority ||
    normalize(current.assignee_id) !== normalize(issue.assignee_id) ||
    normalize(current.story_points) !== normalize(issue.story_points) ||
    normalize(current.start_date) !== normalize(issue.start_date) ||
    normalize(current.due_date) !== normalize(issue.due_date)

  function updateDraft(patch: Partial<IssueDraft>) {
    setDraft({ ...current, ...patch })
  }

  function handleBack() {
    if (isDirty && !window.confirm('You have unsaved changes. Leave without saving?')) return
    navigate(-1)
  }

  return (
    <div className="max-w-[1600px]">
      {/* Back */}
      <button
        onClick={handleBack}
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
              <TypeField type={current.type} onChange={(type) => updateDraft({ type })} />
              <span className="font-mono text-[12px] text-gray-400">{issue.display_id}</span>
              <StatusField
                status={current.status}
                onChange={(status) => updateDraft({ status })}
              />
            </div>

            <InlineTitle value={current.title} onSave={(title) => updateDraft({ title })} />
          </div>

          {/* Description */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
            <h2 className={`${SECTION_HEADER} mb-2`}>Description</h2>
            <InlineDescription
              value={current.description}
              onSave={(description) => updateDraft({ description })}
            />
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
                        <img src={att.file_url} alt={att.file_name} className="w-10 h-10 rounded object-cover shrink-0" />
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
                        <span className="text-[11px] text-gray-400">{(att.file_size / 1024).toFixed(1)} KB</span>
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
                      <span className="text-[13px] font-semibold text-ink">{comment.author?.full_name}</span>
                      <span className="text-[11px] text-gray-400">{new Date(comment.created_at).toLocaleString()}</span>
                      {comment.author_id === user?.id && (
                        <button onClick={() => deleteComment(comment.id)} className="text-gray-300 hover:text-danger ml-auto">
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                    <p className="text-[13px] text-gray-700 mt-1 whitespace-pre-wrap leading-relaxed">{comment.content}</p>
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
          <AuditLogSection parentId={issueId!} parentType="issue" />
        </div>

        {/* ---- Sidebar ---- */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 lg:sticky lg:top-4">
          <h3 className={`${SECTION_HEADER} mb-1`}>Details</h3>

          <div className="divide-y divide-gray-100">
            <DetailRow label="Assignee">
              <AssigneeField
                assigneeId={current.assignee_id}
                members={members}
                currentUserId={user?.id}
                onChange={(assigneeId) => updateDraft({ assignee_id: assigneeId })}
              />
            </DetailRow>

            <div className="py-2.5">
              <LabelsField parentId={issueId!} kind="issue" />
            </div>

            <DetailRow label="Parent">
              {parentStory ? (
                <button
                  onClick={() => navigate(`/stories/${parentStory.id}`)}
                  className="text-[13px] text-brand hover:underline font-medium truncate max-w-[170px] text-right"
                >
                  {parentStory.display_id}
                </button>
              ) : (
                <span className="text-[13px] text-gray-400">None</span>
              )}
            </DetailRow>

            <DetailRow label="Reporter">
              <span className="text-[13px] text-ink font-medium">{issue.reporter?.full_name || 'Unknown'}</span>
            </DetailRow>

            <DetailRow label="Priority">
              <PriorityField value={current.priority} onChange={(priority) => updateDraft({ priority })} />
            </DetailRow>

            <DetailRow label="Story points">
              <input
                type="number"
                min={0}
                value={current.story_points ?? ''}
                onChange={(e) => updateDraft({ story_points: e.target.value ? parseInt(e.target.value) : null })}
                placeholder="None"
                className="text-[13px] text-ink font-medium bg-transparent outline-none hover:bg-gray-50 rounded px-1.5 py-1 -mx-1.5 text-right w-20"
              />
            </DetailRow>

            <DetailRow label="Start date">
              <input
                type="date"
                value={current.start_date || ''}
                onChange={(e) => updateDraft({ start_date: e.target.value || null })}
                className="text-[13px] text-ink font-medium bg-transparent outline-none hover:bg-gray-50 rounded px-1.5 py-1 -mx-1.5"
              />
            </DetailRow>

            <DetailRow label="Due date">
              <input
                type="date"
                value={current.due_date || ''}
                onChange={(e) => updateDraft({ due_date: e.target.value || null })}
                className="text-[13px] text-ink font-medium bg-transparent outline-none hover:bg-gray-50 rounded px-1.5 py-1 -mx-1.5"
              />
            </DetailRow>
          </div>

          <div className="mt-3 pt-3 border-t border-gray-100 text-[11px] text-gray-400 space-y-0.5">
            <div>Created {new Date(issue.created_at).toLocaleDateString()}</div>
            <div>Updated {new Date(issue.updated_at).toLocaleDateString()}</div>
          </div>
        </div>
      </div>

      {/* Save / Cancel bar */}
      {isDirty && (
        <div className="sticky bottom-0 z-30 -mx-6 -mb-6 mt-4 bg-white border-t border-gray-200 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] px-6 py-3.5 flex items-center justify-between animate-fade-in-up">
          <span className="text-[13px] text-gray-600">You have unsaved changes.</span>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={cancelChanges} disabled={saving}>
              Cancel
            </Button>
            <Button size="sm" onClick={saveChanges} disabled={saving}>
              {saving ? 'Saving...' : 'Save changes'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ---- Issue type field (header) ---- */
function TypeField({ type, onChange }: { type: IssueType; onChange: (t: IssueType) => void }) {
  const [open, setOpen] = useState(false)
  const meta = ISSUE_TYPE_META[type]
  const options = ISSUE_TYPES.filter((t) => t !== 'Story')

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1 text-[13px] px-2 py-0.5 rounded font-semibold transition-colors ${meta.tailwind}`}
      >
        {meta.icon} {type} <ChevronDown size={12} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 w-36 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
            {options.map((t) => (
              <button
                key={t}
                onClick={() => { onChange(t); setOpen(false) }}
                className="w-full flex items-center gap-2 text-left px-3 py-1.5 text-[12.5px] text-ink hover:bg-gray-50"
              >
                {ISSUE_TYPE_META[t].icon} {t}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
