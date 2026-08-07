import { useEffect, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft, Plus, Link2, Paperclip, MessageSquare,
  X, Trash2, ChevronDown
} from 'lucide-react'
import { api, ApiError } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { STATUS_META, PRIORITY_META, ISSUE_TYPE_META, LINK_TYPES } from '../lib/constants'
import type { Status, Priority, IssueType, LinkType } from '../lib/constants'
import type { Story, Issue, Comment, Attachment, User, IssueLink, Epic } from '../types'
import Button from '../components/ui/Button'
import Avatar from '../components/ui/Avatar'
import Modal from '../components/ui/Modal'
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
import Card from '../components/ui/Card'
import LoadingSkeleton from '../components/ui/LoadingSkeleton'

interface StoryDraft {
  title: string
  description: string
  status: Status
  priority: Priority
  assignee_id: string | null
  story_points: number | null
  start_date: string | null
  due_date: string | null
}

const EMPTY_DRAFT: StoryDraft = {
  title: '',
  description: '',
  status: 'Created',
  priority: 'Medium',
  assignee_id: null,
  story_points: null,
  start_date: null,
  due_date: null,
}

function seedDraft(s: Story): StoryDraft {
  return {
    title: s.title,
    description: s.description || '',
    status: s.status as Status,
    priority: s.priority as Priority,
    assignee_id: s.assignee_id || null,
    story_points: s.story_points ?? null,
    start_date: s.start_date || null,
    due_date: s.due_date || null,
  }
}

function normalize(v: string | number | null | undefined) {
  return v === undefined || v === null || v === '' ? null : v
}

export default function StoryDetailPage() {
  const { storyId } = useParams<{ storyId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const toast = useToast()

  const isNew = storyId === 'new'
  const epicIdParam = searchParams.get('epicId')

  const [story, setStory] = useState<Story | null>(null)
  useDocumentTitle(isNew ? 'New story' : story ? `${story.display_id} · ${story.title}` : undefined)
  const [epic, setEpic] = useState<Epic | null>(null)
  const [issues, setIssues] = useState<Issue[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [links, setLinks] = useState<IssueLink[]>([])
  const [members, setMembers] = useState<User[]>([])
  const [allStories, setAllStories] = useState<{ id: string; title: string; display_id: string }[]>([])
  const [loading, setLoading] = useState(true)

  const [draft, setDraft] = useState<StoryDraft | null>(null)
  const [saving, setSaving] = useState(false)
  const [confirmBack, setConfirmBack] = useState(false)

  const [showLinkModal, setShowLinkModal] = useState(false)

  useEffect(() => {
    if (!storyId) return
    if (isNew) {
      fetchMembers()
      if (epicIdParam) fetchEpic(epicIdParam)
      setLoading(false)
      return
    }
    fetchAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storyId])

  // Switching to a different story should drop any in-progress draft from the last one.
  useEffect(() => {
    setDraft(null)
  }, [storyId])

  async function fetchAll() {
    try {
      const data = await api.getStoryFull(storyId!)
      setStory(data.story)
      setIssues(data.issues)
      setComments(data.comments)
      setAttachments(data.attachments)
      setLinks(data.links)
      setMembers(data.members)
      setAllStories(data.all_stories as any)
      if (data.epic) setEpic(data.epic as any)
    } catch {}
    setLoading(false)
  }

  async function fetchStory() {
    try {
      const data = await api.getStory(storyId!)
      setStory(data)
      if (data.epic_id) fetchEpic(data.epic_id)
      return data
    } catch {
      return null
    }
  }

  async function fetchEpic(epicId: string) {
    try {
      const data = await api.getEpic(epicId)
      setEpic(data)
    } catch {
      // Parent-epic link just won't show; not fatal to the page.
    }
  }

  async function fetchIssues(uuid?: string) {
    try {
      setIssues(await api.listIssues(uuid || storyId))
    } catch {}
  }

  async function fetchComments(uuid?: string) {
    try {
      setComments(await api.listComments(uuid || storyId!, 'story'))
    } catch {}
  }

  async function fetchAttachments(uuid?: string) {
    try {
      setAttachments(await api.listAttachments(uuid || storyId!, 'story'))
    } catch {}
  }

  async function fetchLinks(uuid?: string) {
    try {
      setLinks(await api.listIssueLinks(uuid || storyId!))
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

  async function fetchAllStories() {
    try {
      const data = await api.listStories()
      setAllStories(data.filter((s) => s.id !== storyId))
    } catch {
      // "Link issue" picker just stays empty.
    }
  }

  async function saveChanges() {
    if (!current.title.trim()) return
    setSaving(true)

    if (isNew) {
      try {
        const data = await api.createStory({
          epic_id: epicIdParam,
          title: current.title,
          description: current.description || null,
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
            item_type: 'Story',
            display_id: data.display_id,
            title: data.title,
            breadcrumb: epic?.title,
            priority: data.priority,
            due_date: data.due_date,
            item_path: `/stories/${data.display_id}`,
          }).catch(() => toast.error('Assignment email could not be sent — check SMTP settings.'))
        }
        navigate(`/stories/${data.display_id}`, { replace: true })
      } finally {
        setSaving(false)
      }
      return
    }

    const assigneeChanged = normalize(current.assignee_id) !== normalize(story?.assignee_id)

    try {
      await api.updateStory(story!.id, {
        title: current.title,
        description: current.description || null,
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
          item_type: 'Story',
          display_id: story!.display_id,
          title: current.title,
          breadcrumb: epic?.title,
          priority: current.priority,
          due_date: current.due_date || undefined,
          item_path: `/stories/${storyId}`,
        }).catch(() => toast.error('Assignment email could not be sent — check SMTP settings.'))
      }

      await fetchStory()
    } finally {
      setSaving(false)
    }
  }

  function cancelChanges() {
    if (isNew) {
      if (epicIdParam) navigate(`/epics/${epicIdParam}`)
      else navigate(-1)
      return
    }
    if (story) setDraft(seedDraft(story))
  }

  async function createIssue(type: IssueType) {
    navigate(`/issues/new?storyId=${story!.id}&type=${encodeURIComponent(type)}`)
  }

  async function addComment(content: string) {
    await api.createComment(story!.id, 'story', content)
    fetchComments()
  }

  async function deleteComment(commentId: string) {
    await api.deleteComment(commentId)
    fetchComments()
  }

  async function uploadFile(file: File) {
    try {
      await api.uploadAttachment(story!.id, 'story', file)
      fetchAttachments()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Upload failed.')
    }
  }

  async function deleteAttachment(att: Attachment) {
    await api.deleteAttachment(att.id)
    fetchAttachments()
  }

  async function addLink(targetId: string, linkType: LinkType) {
    try {
      await api.createIssueLink({
        source_id: storyId!,
        source_type: 'story',
        target_id: targetId,
        target_type: 'story',
        link_type: linkType,
      })
      setShowLinkModal(false)
      toast.success('Issue linked')
      fetchLinks()
    } catch {
      toast.error('Failed to link issue.')
    }
  }

  async function removeLink(linkId: string) {
    await api.deleteIssueLink(linkId)
    fetchLinks()
  }

  if (loading) {
    return (
      <div className="max-w-[1600px]">
        <div className="h-4 w-16 rounded bg-gray-100 animate-pulse mb-4" />
        <LoadingSkeleton variant="rows" count={5} />
      </div>
    )
  }

  if (!isNew && !story) {
    return <div className="text-gray-500">Story not found.</div>
  }

  const current = draft ?? (story ? seedDraft(story) : EMPTY_DRAFT)
  const isDirty = story ? (
    current.title !== story.title ||
    normalize(current.description) !== normalize(story.description) ||
    current.status !== story.status ||
    current.priority !== story.priority ||
    normalize(current.assignee_id) !== normalize(story.assignee_id) ||
    normalize(current.story_points) !== normalize(story.story_points) ||
    normalize(current.start_date) !== normalize(story.start_date) ||
    normalize(current.due_date) !== normalize(story.due_date)
  ) : false
  const hasNewContent = isNew && (current.title.trim() !== '' || current.description.trim() !== '')
  const showBar = isNew || isDirty

  function updateDraft(patch: Partial<StoryDraft>) {
    setDraft({ ...current, ...patch })
  }

  function proceedBack() {
    if (isNew && epicIdParam) navigate(`/epics/${epicIdParam}`)
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
      {!isNew && story && (
        <Breadcrumbs
          items={[
            { label: 'Epics', href: '/epics' },
            ...(epic?.project ? [{ label: epic.project.name, href: `/projects/${epic.project.id}` }] : []),
            ...(epic ? [{ label: epic.title, href: `/epics/${epic.id}` }] : []),
            { label: story.display_id },
          ]}
        />
      )}

      {/* Back + Save bar */}
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
              <span className="text-[13px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold">
                {ISSUE_TYPE_META.Story.icon} Story
              </span>
              {isNew ? (
                <span className="text-[13px] text-brand font-semibold">New — not yet saved</span>
              ) : (
                <span className="font-mono text-[12px] text-gray-400">{story!.display_id}</span>
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
              {/* Child Issues (Tasks/Bugs) */}
              <Card className="mb-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className={SECTION_HEADER}>Child Issues (<span className="font-mono tabular-nums">{issues.length}</span>)</h2>
                  <IssueTypePicker onCreate={createIssue} />
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
                        onClick={() => navigate(`/issues/${issue.display_id}`)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-gray-100 hover:border-brand/30 hover:shadow-sm cursor-pointer transition-all"
                      >
                        <span className="text-[13px] shrink-0">{ISSUE_TYPE_META[issue.type as IssueType]?.icon}</span>
                        <span className="font-mono text-[12px] text-gray-400 shrink-0 w-[70px]">{issue.display_id}</span>
                        <span className="text-[13px] text-gray-900 font-medium flex-1 min-w-0 truncate">{issue.title}</span>
                        <span className="text-[12px] shrink-0 w-4 text-center" style={{ color: PRIORITY_META[issue.priority as Priority]?.color }}>{PRIORITY_META[issue.priority as Priority]?.icon}</span>
                        <span className="shrink-0 w-5 flex justify-center">{issue.assignee ? <Avatar name={issue.assignee.full_name} size="sm" /> : null}</span>
                        <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-md whitespace-nowrap shrink-0 ${STATUS_META[issue.status as Status]?.tailwind}`}>
                          {issue.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Linked Issues */}
              <Card className="mb-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className={`${SECTION_HEADER} flex items-center gap-2`}>
                    <Link2 size={15} /> Linked Issues (<span className="font-mono tabular-nums">{links.length}</span>)
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
                          <span className="text-[13px] text-gray-500 italic shrink-0">{link.link_type}</span>
                          <span className="font-mono text-[12px] text-gray-400">
                            {linkedStory?.display_id || linkedId.slice(0, 8)}
                          </span>
                          <span className="text-[13px] text-gray-900 flex-1 truncate">
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
              </Card>

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
                            <span className="text-[12px] text-gray-400">
                              {(att.file_size / 1024).toFixed(1)} KB
                            </span>
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
                          <span className="text-[13px] font-semibold text-gray-900">
                            {comment.author?.full_name}
                          </span>
                          <span className="text-[12px] text-gray-400">
                            {new Date(comment.created_at).toLocaleString()}
                          </span>
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
              </Card>

              {/* Audit Log */}
              <AuditLogSection parentId={story!.id} parentType="story" />
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
                <LabelsField parentId={story!.id} kind="story" />
              </div>
            )}

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
              <span className="text-[13px] text-gray-900 font-medium">
                {isNew ? (user?.full_name || 'You') : (story!.reporter?.full_name || 'Unknown')}
              </span>
            </DetailRow>

            <DetailRow label="Priority">
              <PriorityField
                value={current.priority}
                onChange={(priority) => updateDraft({ priority })}
              />
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

          {!isNew && story && (
            <div className="mt-3 pt-3 border-t border-gray-100 text-[12px] text-gray-400 space-y-0.5">
              <div>Created {new Date(story.created_at).toLocaleDateString()}</div>
              <div>Updated {new Date(story.updated_at).toLocaleDateString()}</div>
            </div>
          )}
        </Card>
      </div>

      {/* Modals */}
      {showLinkModal && (
        <LinkIssueModal
          stories={allStories}
          onClose={() => setShowLinkModal(false)}
          onLink={addLink}
        />
      )}

      {confirmBack && (
        <ConfirmDialog
          title={isNew ? 'Discard new story' : 'Unsaved changes'}
          message={isNew ? 'Discard this new story?' : 'You have unsaved changes. Leave without saving?'}
          confirmLabel={isNew ? 'Discard' : 'Leave'}
          onConfirm={() => { setConfirmBack(false); proceedBack() }}
          onCancel={() => setConfirmBack(false)}
        />
      )}
    </div>
  )
}

/* ---- Add-issue type picker ---- */
function IssueTypePicker({ onCreate }: { onCreate: (type: IssueType) => void }) {
  const [open, setOpen] = useState(false)
  const types: IssueType[] = ['Task', 'Bug', 'Sub-task']

  return (
    <div className="relative">
      <Button size="sm" onClick={() => setOpen((o) => !o)}>
        <Plus size={13} /> Add issue <ChevronDown size={12} />
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
            {types.map((t) => (
              <button
                key={t}
                onClick={() => { onCreate(t); setOpen(false) }}
                className="w-full flex items-center gap-2 text-left px-3 py-1.5 text-[13px] text-gray-900 hover:bg-gray-50"
              >
                <span className="text-[13px] leading-none">{ISSUE_TYPE_META[t].icon}</span> {t}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
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
      <div className="space-y-3.5">
        <div>
          <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Relationship</label>
          <select
            className="w-full h-9 px-3 rounded-md border border-gray-200 bg-white text-[13px] text-gray-900 shadow-sm outline-none placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/10"
            value={linkType}
            onChange={(e) => setLinkType(e.target.value as LinkType)}
          >
            {LINK_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Target story</label>
          <select
            className="w-full h-9 px-3 rounded-md border border-gray-200 bg-white text-[13px] text-gray-900 shadow-sm outline-none placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/10"
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
          >
            <option value="">Select a story...</option>
            {stories.map((s) => (
              <option key={s.id} value={s.id}>{s.display_id} — {s.title}</option>
            ))}
          </select>
        </div>

        <Button size="sm" onClick={() => onLink(targetId, linkType)} className="w-full" disabled={!targetId}>
          Link issue
        </Button>
      </div>
    </Modal>
  )
}
