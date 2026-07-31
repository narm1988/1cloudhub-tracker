import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Plus, Link2, Paperclip, MessageSquare,
  Upload, X, Trash2, AlertCircle, CheckSquare, Bug
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
import StatusBadge from '../components/ui/StatusBadge'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'

export default function StoryDetailPage() {
  const { storyId } = useParams<{ storyId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [story, setStory] = useState<Story | null>(null)
  const [issues, setIssues] = useState<Issue[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [links, setLinks] = useState<IssueLink[]>([])
  const [members, setMembers] = useState<User[]>([])
  const [allStories, setAllStories] = useState<{ id: string; title: string; display_id: string }[]>([])
  const [loading, setLoading] = useState(true)

  const [showCreateIssue, setShowCreateIssue] = useState(false)
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [editingStory, setEditingStory] = useState(false)

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
    if (data) setStory(data)
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
    await supabase.from('stories').update(updates).eq('id', storyId)
    fetchStory()
    setEditingStory(false)
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
      .upload(filePath, file)

    if (uploadError) return

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
    // Delete from storage
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
    <div className="max-w-5xl">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-gray-500 text-[13px] hover:text-gray-700 mb-4"
      >
        <ArrowLeft size={14} /> Back
      </button>

      {/* Story header */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-[12px] text-gray-400">{story.display_id}</span>
              <StatusBadge status={story.status as Status} />
              <span className="text-[12px]">{PRIORITY_META[story.priority as Priority]?.icon} {story.priority}</span>
            </div>
            <h1 className="font-display text-xl font-semibold text-ink mb-2">{story.title}</h1>
            {story.description && (
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{story.description}</p>
            )}
          </div>
          <Button variant="secondary" size="sm" onClick={() => setEditingStory(true)}>
            Edit
          </Button>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-100 text-[13px] text-gray-500">
          <div className="flex items-center gap-1.5">
            <span>Assignee:</span>
            {story.assignee ? (
              <span className="flex items-center gap-1">
                <Avatar name={story.assignee.full_name} size="sm" />
                <strong className="text-ink">{story.assignee.full_name}</strong>
              </span>
            ) : (
              <span className="text-gray-400">Unassigned</span>
            )}
          </div>
          <div>Reporter: <strong className="text-ink">{story.reporter?.full_name || 'Unknown'}</strong></div>
          <div>Created: {new Date(story.created_at).toLocaleDateString()}</div>
        </div>
      </div>

      {/* Child Issues (Tasks/Bugs) */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-[15px] font-semibold text-ink">
            Child Issues ({issues.length})
          </h2>
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
                <StatusBadge status={issue.status as Status} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Linked Issues */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-[15px] font-semibold text-ink flex items-center gap-2">
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
          <h2 className="font-display text-[15px] font-semibold text-ink flex items-center gap-2">
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
        <h2 className="font-display text-[15px] font-semibold text-ink flex items-center gap-2 mb-4">
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

      {editingStory && (
        <EditStoryModal
          story={story}
          members={members}
          onClose={() => setEditingStory(false)}
          onSave={updateStory}
        />
      )}
    </div>
  )
}

/* ---- Sub-components ---- */

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

function EditStoryModal({
  story,
  members,
  onClose,
  onSave,
}: {
  story: Story
  members: User[]
  onClose: () => void
  onSave: (updates: Partial<Story>) => void
}) {
  const [title, setTitle] = useState(story.title)
  const [description, setDescription] = useState(story.description || '')
  const [status, setStatus] = useState(story.status)
  const [priority, setPriority] = useState(story.priority)
  const [assigneeId, setAssigneeId] = useState(story.assignee_id || '')
  const [startDate, setStartDate] = useState(story.start_date || '')
  const [dueDate, setDueDate] = useState(story.due_date || '')
  const [storyPoints, setStoryPoints] = useState(story.story_points?.toString() || '')

  return (
    <Modal title={`Edit ${story.display_id}`} onClose={onClose} width="max-w-lg">
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <div>
          <label className="block text-[13px] font-semibold text-ink mb-1.5">Description</label>
          <textarea
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 min-h-[100px] resize-y"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add details, acceptance criteria..."
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-[13px] font-semibold text-ink mb-1.5">Status</label>
            <select
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:border-brand"
              value={status}
              onChange={(e) => setStatus(e.target.value as Status)}
            >
              {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-ink mb-1.5">Priority</label>
            <select
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:border-brand"
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
            >
              {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{PRIORITY_META[p].icon} {p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-ink mb-1.5">Assignee</label>
            <select
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:border-brand"
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
            >
              <option value="">Unassigned</option>
              {members.map((m) => <option key={m.id} value={m.id}>{m.full_name}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Input
            label="Start date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Input
            label="Due date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
          <Input
            label="Story points"
            type="number"
            value={storyPoints}
            onChange={(e) => setStoryPoints(e.target.value)}
            placeholder="0"
          />
        </div>

        <Button
          onClick={() => onSave({
            title,
            description,
            status,
            priority,
            assignee_id: assigneeId || null,
            start_date: startDate || null,
            due_date: dueDate || null,
            story_points: storyPoints ? parseInt(storyPoints) : null,
          } as any)}
          className="w-full"
          disabled={!title.trim()}
        >
          Save changes
        </Button>
      </div>
    </Modal>
  )
}
