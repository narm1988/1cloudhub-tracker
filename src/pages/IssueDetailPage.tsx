import { useEffect, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
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
import Card from '../components/ui/Card'
import { notifyAssignment } from '../lib/notifyAssignment'

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

function emptyDraft(type: IssueType): IssueDraft {
  return {
    title: '',
    description: '',
    type,
    status: 'Created',
    priority: 'Medium',
    assignee_id: null,
    story_points: null,
    start_date: null,
    due_date: null,
  }
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
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const isNew = issueId === 'new'
  const storyIdParam = searchParams.get('storyId')
  const typeParam = (searchParams.get('type') as IssueType) || 'Task'

  const [issue, setIssue] = useState<Issue | null>(null)
  const [parentStory, setParentStory] = useState<{ id: string; title: string; display_id: string } | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [members, setMembers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  const [draft, setDraft] = useState<IssueDraft | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!issueId) return
    if (isNew) {
      fetchMembers()
      if (storyIdParam) fetchParentStory(storyIdParam)
      setLoading(false)
      return
    }
    fetchAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    if (!current.title.trim()) return
    setSaving(true)

    if (isNew) {
      const { count } = await supabase.from('issues').select('id', { count: 'exact', head: true })
      const prefix = current.type === 'Bug' ? 'BUG' : current.type === 'Sub-task' ? 'SUB' : 'TSK'
      const displayId = `${prefix}-${100 + (count || 0) + 1}`

      const { data, error } = await supabase.from('issues').insert({
        story_id: storyIdParam,
        title: current.title,
        description: current.description || null,
        type: current.type,
        status: current.status,
        priority: current.priority,
        assignee_id: current.assignee_id,
        story_points: current.story_points,
        start_date: current.start_date,
        due_date: current.due_date,
        reporter_id: user?.id,
        display_id: displayId,
      }).select().single()

      setSaving(false)
      if (!error && data) {
        if (data.assignee_id) {
          notifyAssignment({
            assigneeId: data.assignee_id,
            itemType: data.type,
            displayId: data.display_id,
            title: data.title,
            breadcrumb: parentStory ? `${parentStory.display_id} · ${parentStory.title}` : undefined,
            priority: data.priority,
            dueDate: data.due_date,
            itemPath: `/issues/${data.id}`,
          })
        }
        navigate(`/issues/${data.id}`, { replace: true })
      }
      return
    }

    const assigneeChanged = normalize(current.assignee_id) !== normalize(issue?.assignee_id)

    await supabase.from('issues').update({
      title: current.title,
      description: current.description || null,
      type: current.type,
      status: current.status,
      priority: current.priority,
      assignee_id: current.assignee_id,
      story_points: current.story_points,
      start_date: current.start_date,
      due_date: current.due_date,
    }).eq('id', issueId)

    if (assigneeChanged && current.assignee_id) {
      notifyAssignment({
        assigneeId: current.assignee_id,
        itemType: current.type,
        displayId: issue!.display_id,
        title: current.title,
        breadcrumb: parentStory ? `${parentStory.display_id} · ${parentStory.title}` : undefined,
        priority: current.priority,
        dueDate: current.due_date,
        itemPath: `/issues/${issueId}`,
      })
    }

    await fetchIssue()
    setSaving(false)
  }

  function cancelChanges() {
    if (isNew) {
      if (storyIdParam) navigate(`/stories/${storyIdParam}`)
      else navigate(-1)
      return
    }
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

  if (!isNew && !issue) {
    return <div className="text-gray-500">Issue not found.</div>
  }

  const current = draft ?? (issue ? seedDraft(issue) : emptyDraft(typeParam))
  const isDirty = issue ? (
    current.title !== issue.title ||
    normalize(current.description) !== normalize(issue.description) ||
    current.type !== issue.type ||
    current.status !== issue.status ||
    current.priority !== issue.priority ||
    normalize(current.assignee_id) !== normalize(issue.assignee_id) ||
    normalize(current.story_points) !== normalize(issue.story_points) ||
    normalize(current.start_date) !== normalize(issue.start_date) ||
    normalize(current.due_date) !== normalize(issue.due_date)
  ) : false
  const hasNewContent = isNew && (current.title.trim() !== '' || current.description.trim() !== '')
  const showBar = isNew || isDirty

  function updateDraft(patch: Partial<IssueDraft>) {
    setDraft({ ...current, ...patch })
  }

  function handleBack() {
    const dirty = isNew ? hasNewContent : isDirty
    if (dirty && !window.confirm(isNew ? 'Discard this new issue?' : 'You have unsaved changes. Leave without saving?')) return
    if (isNew && storyIdParam) navigate(`/stories/${storyIdParam}`)
    else navigate(-1)
  }

  return (
    <div className="max-w-[1600px]">
      {/* Back */}
      <button
        onClick={handleBack}
        className="flex items-center gap-1.5 text-gray-500 text-sm hover:text-gray-700 mb-4"
      >
        <ArrowLeft size={14} /> Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5 items-start">
        {/* ---- Main column ---- */}
        <div className="min-w-0">
          {/* Header card */}
          <Card padding="lg" className="mb-4">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <TypeField type={current.type} onChange={(type) => updateDraft({ type })} />
              {isNew ? (
                <span className="text-sm text-brand font-semibold">New — not yet saved</span>
              ) : (
                <span className="font-mono text-sm text-gray-400">{issue!.display_id}</span>
              )}
              <StatusField
                status={current.status}
                onChange={(status) => updateDraft({ status })}
              />
            </div>

            <InlineTitle
              value={current.title}
              onSave={(title) => updateDraft({ title })}
              placeholder={isNew ? 'Click to add a title' : undefined}
            />
          </Card>

          {/* Description */}
          <Card className="mb-4">
            <h2 className={`${SECTION_HEADER} mb-2`}>Description</h2>
            <InlineDescription
              value={current.description}
              onSave={(description) => updateDraft({ description })}
            />
          </Card>

          {!isNew && (
            <>
              {/* Attachments */}
              <Card className="mb-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className={`${SECTION_HEADER} flex items-center gap-2`}>
                    <Paperclip size={15} /> Attachments (<span className="font-mono tabular-nums">{attachments.length}</span>)
                  </h2>
                  <FileUploadButton onUpload={uploadFile} />
                </div>

                {attachments.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-3">No files attached.</p>
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
                              className="text-sm text-brand hover:underline truncate block"
                            >
                              {att.file_name}
                            </a>
                            <span className="text-xs text-gray-400">{(att.file_size / 1024).toFixed(1)} KB</span>
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
              </Card>

              {/* Comments */}
              <Card className="mb-4">
                <h2 className={`${SECTION_HEADER} flex items-center gap-2 mb-4`}>
                  <MessageSquare size={15} /> Comments (<span className="font-mono tabular-nums">{comments.length}</span>)
                </h2>

                <div className="space-y-3 mb-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <Avatar name={comment.author?.full_name || 'User'} size="md" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-900">{comment.author?.full_name}</span>
                          <span className="text-xs text-gray-400">{new Date(comment.created_at).toLocaleString()}</span>
                          {comment.author_id === user?.id && (
                            <button onClick={() => deleteComment(comment.id)} className="text-gray-300 hover:text-danger ml-auto">
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap leading-relaxed">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                  {comments.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-2">No comments yet.</p>
                  )}
                </div>

                <CommentInput onSubmit={addComment} />
              </Card>

              {/* Audit Log */}
              <AuditLogSection parentId={issueId!} parentType="issue" />
            </>
          )}
        </div>

        {/* ---- Sidebar ---- */}
        <Card className="lg:sticky lg:top-4">
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

            {!isNew && (
              <div className="py-2.5">
                <LabelsField parentId={issueId!} kind="issue" />
              </div>
            )}

            <DetailRow label="Parent">
              {parentStory ? (
                <button
                  onClick={() => navigate(`/stories/${parentStory.id}`)}
                  className="text-sm text-brand hover:underline font-medium truncate max-w-[170px] text-right"
                >
                  {parentStory.display_id}
                </button>
              ) : (
                <span className="text-sm text-gray-400">None</span>
              )}
            </DetailRow>

            <DetailRow label="Reporter">
              <span className="text-sm text-gray-900 font-medium">
                {isNew ? (user?.full_name || 'You') : (issue!.reporter?.full_name || 'Unknown')}
              </span>
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
                aria-label="Story points"
                className="text-sm font-mono tabular-nums text-gray-900 font-medium bg-transparent outline-none hover:bg-gray-50 focus:bg-gray-50 focus:ring-1 focus:ring-brand/30 rounded px-1.5 py-1 -mx-1.5 text-right w-20"
              />
            </DetailRow>

            <DetailRow label="Start date">
              <input
                type="date"
                value={current.start_date || ''}
                onChange={(e) => updateDraft({ start_date: e.target.value || null })}
                aria-label="Start date"
                className="text-sm text-gray-900 font-medium bg-transparent outline-none hover:bg-gray-50 focus:bg-gray-50 focus:ring-1 focus:ring-brand/30 rounded px-1.5 py-1 -mx-1.5"
              />
            </DetailRow>

            <DetailRow label="Due date">
              <input
                type="date"
                value={current.due_date || ''}
                onChange={(e) => updateDraft({ due_date: e.target.value || null })}
                aria-label="Due date"
                className="text-sm text-gray-900 font-medium bg-transparent outline-none hover:bg-gray-50 focus:bg-gray-50 focus:ring-1 focus:ring-brand/30 rounded px-1.5 py-1 -mx-1.5"
              />
            </DetailRow>
          </div>

          {!isNew && issue && (
            <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400 space-y-0.5">
              <div>Created {new Date(issue.created_at).toLocaleDateString()}</div>
              <div>Updated {new Date(issue.updated_at).toLocaleDateString()}</div>
            </div>
          )}
        </Card>
      </div>

      {/* Save / Cancel bar */}
      {showBar && (
        <div className="sticky bottom-0 z-30 -mx-6 -mb-6 mt-4 bg-white border-t border-gray-200 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] px-6 py-3.5 flex items-center justify-between animate-fade-in-up">
          <span className="text-sm text-gray-600">
            {isNew ? 'This item has not been created yet.' : 'You have unsaved changes.'}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={cancelChanges} disabled={saving}>
              Cancel
            </Button>
            <Button size="sm" onClick={saveChanges} disabled={saving || !current.title.trim()}>
              {saving ? 'Saving...' : isNew ? `Create ${current.type.toLowerCase()}` : 'Save changes'}
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
        className={`flex items-center gap-1 text-sm px-2 py-0.5 rounded font-semibold transition-colors ${meta.tailwind}`}
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
                className="w-full flex items-center gap-2 text-left px-3 py-1.5 text-sm text-gray-900 hover:bg-gray-50"
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
