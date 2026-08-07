import { useEffect, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Paperclip, MessageSquare, Trash2, ChevronDown } from 'lucide-react'
import { api, ApiError } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { ISSUE_TYPES, ISSUE_TYPE_META } from '../lib/constants'
import type { Status, Priority, IssueType } from '../lib/constants'
import type { Issue, Comment, Attachment, User, Story, Epic } from '../types'
import Button from '../components/ui/Button'
import Avatar from '../components/ui/Avatar'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import Breadcrumbs from '../components/ui/Breadcrumbs'
import { useToast } from '../context/ToastContext'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import {
  SECTION_HEADER, DetailRow, InlineTitle, InlineDescription,
  StatusField, PriorityField, AssigneeField, CommentInput, FileUploadButton,
} from '../components/detail/DetailFields'
import AuditLogSection from '../components/detail/AuditLogSection'
import LabelsField from '../components/detail/LabelsField'
import BugLifecycle from '../components/detail/BugLifecycle'
import Card from '../components/ui/Card'
import LoadingSkeleton from '../components/ui/LoadingSkeleton'

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
  const toast = useToast()

  const isNew = issueId === 'new'
  const storyIdParam = searchParams.get('storyId')
  const typeParam = (searchParams.get('type') as IssueType) || 'Task'

  const [issue, setIssue] = useState<Issue | null>(null)
  useDocumentTitle(isNew ? `New ${typeParam}` : issue ? `${issue.display_id} · ${issue.title}` : undefined)
  const [parentStory, setParentStory] = useState<Story | null>(null)
  const [parentEpic, setParentEpic] = useState<Epic | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [members, setMembers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  const [draft, setDraft] = useState<IssueDraft | null>(null)
  const [saving, setSaving] = useState(false)
  const [confirmBack, setConfirmBack] = useState(false)

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
    try {
      const data = await api.getIssueFull(issueId!)
      setIssue(data.issue)
      setComments(data.comments)
      setAttachments(data.attachments)
      setMembers(data.members)
      if (data.parent_story) setParentStory(data.parent_story as any)
    } catch {}
    setLoading(false)
  }

  async function fetchIssue() {
    try {
      const data = await api.getIssue(issueId!)
      setIssue(data)
      if (data.story_id) fetchParentStory(data.story_id)
      return data
    } catch {
      return null
    }
  }

  async function fetchParentStory(storyId: string) {
    try {
      const data = await api.getStory(storyId)
      setParentStory(data)
      if (data.epic_id) fetchParentEpic(data.epic_id)
    } catch {
      // Parent-story link just won't show; not fatal to the page.
    }
  }

  async function fetchParentEpic(epicId: string) {
    try {
      setParentEpic(await api.getEpic(epicId))
    } catch {
      // Breadcrumb just stays shorter; not fatal to the page.
    }
  }

  async function fetchComments(uuid?: string) {
    try {
      setComments(await api.listComments(uuid || issue?.id || issueId!, 'issue'))
    } catch {}
  }

  async function fetchAttachments(uuid?: string) {
    try {
      setAttachments(await api.listAttachments(uuid || issue?.id || issueId!, 'issue'))
    } catch {}
  }

  async function fetchMembers() {
    try {
      const { data } = await api.listPeople(1, 100)
      setMembers(data)
    } catch {
      // Assignee picker just stays empty.
    }
  }

  async function saveChanges() {
    if (!current.title.trim()) return
    setSaving(true)

    if (isNew) {
      try {
        const data = await api.createIssue({
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
        })

        if (data.assignee_id) {
          api.notifyAssignment({
            assignee_id: data.assignee_id,
            item_type: data.type,
            display_id: data.display_id,
            title: data.title,
            breadcrumb: parentStory ? `${parentStory.display_id} · ${parentStory.title}` : undefined,
            priority: data.priority,
            due_date: data.due_date,
            item_path: `/issues/${data.display_id}`,
          })
            .then((res) => { if (!res.skipped) toast.success('Assignment email sent') })
            .catch(() => toast.error('Assignment email could not be sent — check SMTP settings.'))
        }
        navigate(`/issues/${data.display_id}`, { replace: true })
      } finally {
        setSaving(false)
      }
      return
    }

    const assigneeChanged = normalize(current.assignee_id) !== normalize(issue?.assignee_id)

    try {
      await api.updateIssue(issue!.id, {
        title: current.title,
        description: current.description || null,
        type: current.type,
        status: current.status,
        priority: current.priority,
        assignee_id: current.assignee_id,
        story_points: current.story_points,
        start_date: current.start_date,
        due_date: current.due_date,
      })

      if (assigneeChanged && current.assignee_id) {
        api.notifyAssignment({
          assignee_id: current.assignee_id,
          item_type: current.type,
          display_id: issue!.display_id,
          title: current.title,
          breadcrumb: parentStory ? `${parentStory.display_id} · ${parentStory.title}` : undefined,
          priority: current.priority,
          due_date: current.due_date || undefined,
          item_path: `/issues/${issueId}`,
        })
          .then((res) => { if (!res.skipped) toast.success('Assignment email sent') })
          .catch(() => toast.error('Assignment email could not be sent — check SMTP settings.'))
      }

      await fetchIssue()
    } finally {
      setSaving(false)
    }
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
    await api.createComment(issue!.id, 'issue', content)
    fetchComments()
  }

  async function deleteComment(commentId: string) {
    await api.deleteComment(commentId)
    fetchComments()
  }

  async function uploadFile(file: File) {
    try {
      await api.uploadAttachment(issueId!, 'issue', file)
      fetchAttachments()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Upload failed.')
    }
  }

  async function deleteAttachment(att: Attachment) {
    await api.deleteAttachment(att.id)
    fetchAttachments()
  }

  if (loading) {
    return (
      <div className="max-w-[1600px]">
        <div className="h-4 w-16 rounded bg-gray-100 animate-pulse mb-4" />
        <LoadingSkeleton variant="rows" count={5} />
      </div>
    )
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

  function proceedBack() {
    if (isNew && storyIdParam) navigate(`/stories/${storyIdParam}`)
    else navigate(-1)
  }

  function handleBack() {
    const dirty = isNew ? hasNewContent : isDirty
    if (dirty) {
      setConfirmBack(true)
      return
    }
    proceedBack()
  }

  return (
    <div className="max-w-[1600px]">
      {!isNew && issue && (
        <Breadcrumbs
          items={[
            { label: 'Epics', href: '/epics' },
            ...(parentEpic?.project ? [{ label: parentEpic.project.name, href: `/projects/${parentEpic.project.id}` }] : []),
            ...(parentEpic ? [{ label: parentEpic.title, href: `/epics/${parentEpic.id}` }] : []),
            ...(parentStory ? [{ label: parentStory.display_id, href: `/stories/${parentStory.display_id}` }] : []),
            { label: issue.display_id },
          ]}
        />
      )}

      {/* Back */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 text-gray-500 text-[13px] hover:text-gray-700"
        >
          <ArrowLeft size={14} /> Back
        </button>
        {showBar && (
          <div className="flex items-center gap-2 animate-fade-in-up">
            <span className="text-[12px] text-gray-500 mr-2">
              {isNew ? 'Not yet saved' : 'Unsaved changes'}
            </span>
            <Button variant="secondary" size="sm" onClick={cancelChanges} disabled={saving}>
              Cancel
            </Button>
            <Button size="sm" onClick={saveChanges} disabled={saving}>
              {saving ? 'Saving...' : 'Save changes'}
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5 items-start">
        {/* ---- Main column ---- */}
        <div className="min-w-0">
          {/* Header card */}
          <Card padding="lg" className="mb-4">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <TypeField type={current.type} onChange={(type) => updateDraft({ type })} editable={isNew} />
              {isNew ? (
                <span className="text-[13px] text-brand font-semibold">New — not yet saved</span>
              ) : (
                <span className="font-mono text-[12px] text-gray-400">{issue!.display_id}</span>
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
                            <span className="text-[12px] text-gray-400">{(att.file_size / 1024).toFixed(1)} KB</span>
                          </div>
                          <button
                            onClick={() => deleteAttachment(att)}
                            aria-label={`Delete ${att.file_name}`}
                            className="text-gray-300 hover:text-danger transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 focus-visible:ring-1 focus-visible:ring-brand/30 rounded"
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
                          <span className="text-[13px] font-semibold text-gray-900">{comment.author?.full_name}</span>
                          <span className="text-[12px] text-gray-400">{new Date(comment.created_at).toLocaleString()}</span>
                          {comment.author_id === user?.id && (
                            <button
                              onClick={() => deleteComment(comment.id)}
                              aria-label="Delete comment"
                              className="text-gray-300 hover:text-danger ml-auto focus-visible:ring-1 focus-visible:ring-brand/30 rounded"
                            >
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
              </Card>

              {/* Audit Log */}
              <AuditLogSection parentId={issue!.id} parentType="issue" />
            </>
          )}
        </div>

        {/* ---- Sidebar ---- */}
        <div className="flex flex-col gap-5 lg:sticky lg:top-4">
        <Card>
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
                <LabelsField parentId={issue!.id} kind="issue" />
              </div>
            )}

            <DetailRow label="Parent">
              {parentStory ? (
                <button
                  onClick={() => navigate(`/stories/${parentStory.display_id}`)}
                  className="text-[13px] text-brand hover:underline font-medium truncate max-w-[170px] text-right"
                >
                  {parentStory.display_id}
                </button>
              ) : (
                <span className="text-[13px] text-gray-400">None</span>
              )}
            </DetailRow>

            <DetailRow label="Reporter">
              <span className="text-[13px] text-gray-900 font-medium">
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
                className="text-[13px] font-mono tabular-nums text-gray-900 font-medium bg-transparent outline-none hover:bg-gray-50 focus:bg-gray-50 focus:ring-1 focus:ring-brand/30 rounded px-1.5 py-1 -mx-1.5 text-right w-20"
              />
            </DetailRow>

            <DetailRow label="Start date">
              <input
                type="date"
                value={current.start_date || ''}
                onChange={(e) => updateDraft({ start_date: e.target.value || null })}
                aria-label="Start date"
                className="text-[13px] text-gray-900 font-medium bg-transparent outline-none hover:bg-gray-50 focus:bg-gray-50 focus:ring-1 focus:ring-brand/30 rounded px-1.5 py-1 -mx-1.5"
              />
            </DetailRow>

            <DetailRow label="Due date">
              <input
                type="date"
                value={current.due_date || ''}
                onChange={(e) => updateDraft({ due_date: e.target.value || null })}
                aria-label="Due date"
                className="text-[13px] text-gray-900 font-medium bg-transparent outline-none hover:bg-gray-50 focus:bg-gray-50 focus:ring-1 focus:ring-brand/30 rounded px-1.5 py-1 -mx-1.5"
              />
            </DetailRow>
          </div>

          {!isNew && issue && (
            <div className="mt-3 pt-3 border-t border-gray-100 text-[12px] text-gray-400 space-y-0.5">
              <div>Created {new Date(issue.created_at).toLocaleDateString()}</div>
              <div>Updated {new Date(issue.updated_at).toLocaleDateString()}</div>
            </div>
          )}
        </Card>

        {!isNew && current.type === 'Bug' && <BugLifecycle status={current.status} />}
        </div>
      </div>

      {confirmBack && (
        <ConfirmDialog
          title={isNew ? 'Discard new issue' : 'Unsaved changes'}
          message={isNew ? 'Discard this new issue?' : 'You have unsaved changes. Leave without saving?'}
          confirmLabel={isNew ? 'Discard' : 'Leave'}
          onConfirm={() => { setConfirmBack(false); proceedBack() }}
          onCancel={() => setConfirmBack(false)}
        />
      )}
    </div>
  )
}

/* ---- Issue type field (header) ---- */
function TypeField({ type, onChange, editable = true }: { type: IssueType; onChange: (t: IssueType) => void; editable?: boolean }) {
  const [open, setOpen] = useState(false)
  const meta = ISSUE_TYPE_META[type]
  const options = ISSUE_TYPES.filter((t) => t !== 'Story')

  return (
    <div className="relative">
      <span
        onClick={editable ? () => setOpen((o) => !o) : undefined}
        className={`flex items-center gap-1 text-[13px] px-2 py-0.5 rounded font-semibold ${meta.tailwind} ${editable ? 'cursor-pointer' : ''}`}
      >
        {meta.icon} {type} {editable && <ChevronDown size={12} />}
      </span>
      {open && editable && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 w-36 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
            {options.map((t) => (
              <button
                key={t}
                onClick={() => { onChange(t); setOpen(false) }}
                className="w-full flex items-center gap-2 text-left px-3 py-1.5 text-[13px] text-gray-900 hover:bg-gray-50"
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
