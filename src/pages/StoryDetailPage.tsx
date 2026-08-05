import { useEffect, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft, Plus, Link2, Paperclip, MessageSquare,
  X, Trash2, ChevronDown
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { STATUS_META, PRIORITY_META, ISSUE_TYPE_META, LINK_TYPES } from '../lib/constants'
import type { Status, Priority, IssueType, LinkType } from '../lib/constants'
import type { Story, Issue, Comment, Attachment, User, IssueLink } from '../types'
import Button from '../components/ui/Button'
import Avatar from '../components/ui/Avatar'
import Modal from '../components/ui/Modal'
import {
  SECTION_HEADER, DetailRow, InlineTitle, InlineDescription,
  StatusField, PriorityField, AssigneeField, CommentInput, FileUploadButton,
} from '../components/detail/DetailFields'
import AuditLogSection from '../components/detail/AuditLogSection'
import LabelsField from '../components/detail/LabelsField'
import Card from '../components/ui/Card'
import { notifyAssignment } from '../lib/notifyAssignment'

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

  const isNew = storyId === 'new'
  const epicIdParam = searchParams.get('epicId')

  const [story, setStory] = useState<Story | null>(null)
  const [epic, setEpic] = useState<{ id: string; title: string; project_id: string | null } | null>(null)
  const [issues, setIssues] = useState<Issue[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [links, setLinks] = useState<IssueLink[]>([])
  const [members, setMembers] = useState<User[]>([])
  const [allStories, setAllStories] = useState<{ id: string; title: string; display_id: string }[]>([])
  const [loading, setLoading] = useState(true)

  const [draft, setDraft] = useState<StoryDraft | null>(null)
  const [saving, setSaving] = useState(false)

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
    const { data } = await supabase.from('epics').select('id, title, project_id').eq('id', epicId).single()
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

  async function saveChanges() {
    if (!current.title.trim()) return
    setSaving(true)

    if (isNew) {
      const { count } = await supabase.from('stories').select('id', { count: 'exact', head: true })
      const displayId = `1CH-${100 + (count || 0) + 1}`

      const { data, error } = await supabase.from('stories').insert({
        epic_id: epicIdParam,
        project_id: epic?.project_id ?? null,
        title: current.title,
        description: current.description || null,
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
            itemType: 'Story',
            displayId: data.display_id,
            title: data.title,
            breadcrumb: epic?.title,
            priority: data.priority,
            dueDate: data.due_date,
            itemPath: `/stories/${data.id}`,
          })
        }
        navigate(`/stories/${data.id}`, { replace: true })
      }
      return
    }

    const assigneeChanged = normalize(current.assignee_id) !== normalize(story?.assignee_id)

    await supabase.from('stories').update({
      title: current.title,
      description: current.description || null,
      status: current.status,
      priority: current.priority,
      assignee_id: current.assignee_id,
      story_points: current.story_points,
      start_date: current.start_date,
      due_date: current.due_date,
    }).eq('id', storyId)

    if (assigneeChanged && current.assignee_id) {
      notifyAssignment({
        assigneeId: current.assignee_id,
        itemType: 'Story',
        displayId: story!.display_id,
        title: current.title,
        breadcrumb: epic?.title,
        priority: current.priority,
        dueDate: current.due_date,
        itemPath: `/stories/${storyId}`,
      })
    }

    await fetchStory()
    setSaving(false)
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
    navigate(`/issues/new?storyId=${storyId}&type=${encodeURIComponent(type)}`)
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

  function handleBack() {
    const dirty = isNew ? hasNewContent : isDirty
    if (dirty && !window.confirm(isNew ? 'Discard this new story?' : 'You have unsaved changes. Leave without saving?')) return
    if (isNew && epicIdParam) navigate(`/epics/${epicIdParam}`)
    else navigate(-1)
  }

  return (
    <div className="max-w-[1600px]">
      {/* Back */}
      <button
        onClick={handleBack}
        className="flex items-center gap-1.5 text-gray-500 text-body hover:text-gray-700 mb-4"
      >
        <ArrowLeft size={14} /> Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5 items-start">
        {/* ---- Main column ---- */}
        <div className="min-w-0">
          {/* Header card */}
          <Card padding="lg" className="mb-4">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="text-body px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold">
                {ISSUE_TYPE_META.Story.icon} Story
              </span>
              {isNew ? (
                <span className="text-label text-brand font-semibold">New — not yet saved</span>
              ) : (
                <span className="font-mono text-label text-gray-400">{story!.display_id}</span>
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
                  <p className="text-body text-gray-400 text-center py-4">
                    No tasks or bugs yet. Add one to break down this story.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {issues.map((issue) => (
                      <div
                        key={issue.id}
                        onClick={() => navigate(`/issues/${issue.id}`)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-gray-100 hover:border-brand/30 hover:shadow-sm cursor-pointer transition-all"
                      >
                        <span className="text-body-lg">{ISSUE_TYPE_META[issue.type as IssueType]?.icon}</span>
                        <span className="font-mono text-caption text-gray-400 shrink-0">{issue.display_id}</span>
                        <span className="text-body text-ink font-medium flex-1 truncate">{issue.title}</span>
                        <span className="text-caption">{PRIORITY_META[issue.priority as Priority]?.icon}</span>
                        {issue.assignee && <Avatar name={issue.assignee.full_name} size="sm" />}
                        <span className={`text-caption font-semibold px-2.5 py-0.5 rounded-md whitespace-nowrap ${STATUS_META[issue.status as Status]?.tailwind}`}>
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
                  <p className="text-body text-gray-400 text-center py-3">No linked issues.</p>
                ) : (
                  <div className="space-y-2">
                    {links.map((link) => {
                      const isSource = link.source_id === storyId
                      const linkedId = isSource ? link.target_id : link.source_id
                      const linkedStory = allStories.find((s) => s.id === linkedId)
                      return (
                        <div key={link.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-50">
                          <span className="text-label text-gray-500 italic shrink-0">{link.link_type}</span>
                          <span className="font-mono text-caption text-gray-400">
                            {linkedStory?.display_id || linkedId.slice(0, 8)}
                          </span>
                          <span className="text-body text-ink flex-1 truncate">
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
                  <p className="text-body text-gray-400 text-center py-3">No files attached.</p>
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
                              className="text-body text-brand hover:underline truncate block"
                            >
                              {att.file_name}
                            </a>
                            <span className="text-caption text-gray-400">
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
                          <span className="text-body font-semibold text-ink">
                            {comment.author?.full_name}
                          </span>
                          <span className="text-caption text-gray-400">
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
                        <p className="text-body text-gray-700 mt-1 whitespace-pre-wrap leading-relaxed">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  ))}
                  {comments.length === 0 && (
                    <p className="text-body text-gray-400 text-center py-2">No comments yet.</p>
                  )}
                </div>

                <CommentInput onSubmit={addComment} />
              </Card>

              {/* Audit Log */}
              <AuditLogSection parentId={storyId!} parentType="story" />
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
                <LabelsField parentId={storyId!} kind="story" />
              </div>
            )}

            <DetailRow label="Parent">
              {epic ? (
                <button
                  onClick={() => navigate(`/epics/${epic.id}`)}
                  className="text-body text-brand hover:underline font-medium truncate max-w-[170px] text-right"
                >
                  {epic.title}
                </button>
              ) : (
                <span className="text-body text-gray-400">None</span>
              )}
            </DetailRow>

            <DetailRow label="Reporter">
              <span className="text-body text-ink font-medium">
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
                className="text-body font-mono tabular-nums text-ink font-medium bg-transparent outline-none hover:bg-gray-50 rounded px-1.5 py-1 -mx-1.5 text-right w-20"
              />
            </DetailRow>

            <DetailRow label="Start date">
              <input
                type="date"
                value={current.start_date || ''}
                onChange={(e) => updateDraft({ start_date: e.target.value || null })}
                className="text-body text-ink font-medium bg-transparent outline-none hover:bg-gray-50 rounded px-1.5 py-1 -mx-1.5"
              />
            </DetailRow>

            <DetailRow label="Due date">
              <input
                type="date"
                value={current.due_date || ''}
                onChange={(e) => updateDraft({ due_date: e.target.value || null })}
                className="text-body text-ink font-medium bg-transparent outline-none hover:bg-gray-50 rounded px-1.5 py-1 -mx-1.5"
              />
            </DetailRow>
          </div>

          {!isNew && story && (
            <div className="mt-3 pt-3 border-t border-gray-100 text-caption text-gray-400 space-y-0.5">
              <div>Created {new Date(story.created_at).toLocaleDateString()}</div>
              <div>Updated {new Date(story.updated_at).toLocaleDateString()}</div>
            </div>
          )}
        </Card>
      </div>

      {/* Save / Cancel bar */}
      {showBar && (
        <div className="sticky bottom-0 z-30 -mx-6 -mb-6 mt-4 bg-white border-t border-gray-200 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] px-6 py-3.5 flex items-center justify-between animate-fade-in-up">
          <span className="text-body text-gray-600">
            {isNew ? 'This story has not been created yet.' : 'You have unsaved changes.'}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={cancelChanges} disabled={saving}>
              Cancel
            </Button>
            <Button size="sm" onClick={saveChanges} disabled={saving || !current.title.trim()}>
              {saving ? 'Saving...' : isNew ? 'Create story' : 'Save changes'}
            </Button>
          </div>
        </div>
      )}

      {/* Modals */}
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
                className="w-full flex items-center gap-2 text-left px-3 py-1.5 text-label text-ink hover:bg-gray-50"
              >
                <span className="text-body leading-none">{ISSUE_TYPE_META[t].icon}</span> {t}
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
      <div className="space-y-4">
        <div>
          <label className="block text-body font-semibold text-ink mb-1.5">Relationship</label>
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
          <label className="block text-body font-semibold text-ink mb-1.5">Target story</label>
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
