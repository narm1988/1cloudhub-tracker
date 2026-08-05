import { useEffect, useState } from 'react'
import { Plus, Shield, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { User } from '../types'
import Button from '../components/ui/Button'
import Avatar from '../components/ui/Avatar'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'
import Card from '../components/ui/Card'
import Pagination from '../components/ui/Pagination'
import LoadingSkeleton from '../components/ui/LoadingSkeleton'

const ALLOWED_DOMAIN = '1cloudhub.com'
const PAGE_SIZE = 20

// supabase.functions.invoke() only gives a generic "non-2xx status code"
// message on failure — the actual { error: "..." } JSON body the function
// sends back is on error.context (the raw Response) and has to be read separately.
async function extractFunctionErrorMessage(error: unknown): Promise<string | null> {
  const context = (error as { context?: Response })?.context
  if (!context || typeof context.json !== 'function') return null
  try {
    const source = typeof context.clone === 'function' ? context.clone() : context
    const body = await source.json()
    return typeof body?.error === 'string' ? body.error : null
  } catch {
    return null
  }
}

export default function PeoplePage() {
  const [people, setPeople] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [showInvite, setShowInvite] = useState(false)
  const [loading, setLoading] = useState(true)
  const [inviteError, setInviteError] = useState('')
  const [inviting, setInviting] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    fetchPeople()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  async function fetchPeople() {
    setLoading(true)
    const from = (page - 1) * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    const { data, count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .order('full_name')
      .range(from, to)
    if (data) {
      setPeople(data)
      setTotal(count || 0)
    }
    setLoading(false)
  }

  async function inviteUser(email: string, role: string) {
    setInviteError('')

    const normalized = email.trim().toLowerCase()
    if (!normalized.endsWith(`@${ALLOWED_DOMAIN}`)) {
      setInviteError(`Invites are only allowed for @${ALLOWED_DOMAIN} email addresses.`)
      return
    }

    setInviting(true)
    const { data, error } = await supabase.functions.invoke('invite-user', {
      body: { email: normalized, role, redirectTo: `${window.location.origin}/accept-invite` },
    })
    setInviting(false)

    if (error) {
      const detailed = await extractFunctionErrorMessage(error)
      setInviteError(detailed || error.message || 'Failed to send invite.')
      return
    }
    if (data?.error) {
      setInviteError(data.error)
      return
    }

    setShowInvite(false)
    fetchPeople()
  }

  async function removePerson(person: User) {
    if (!window.confirm(`Remove ${person.full_name} from the team? This cannot be undone.`)) return

    setRemovingId(person.id)
    const { data, error } = await supabase.functions.invoke('remove-person', {
      body: { userId: person.id },
    })
    setRemovingId(null)

    if (error) {
      const detailed = await extractFunctionErrorMessage(error)
      alert(detailed || error.message || 'Failed to remove person.')
      return
    }
    if (data?.error) {
      alert(data.error)
      return
    }

    setPeople((prev) => prev.filter((p) => p.id !== person.id))
  }

  if (loading && people.length === 0) {
    return (
      <div>
        <div className="mb-5">
          <div className="h-6 w-24 rounded bg-gray-200 animate-pulse" />
          <div className="h-4 w-56 rounded bg-gray-100 animate-pulse mt-2.5" />
        </div>
        <LoadingSkeleton variant="rows" count={5} />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-5">
        <h1 className="font-display text-heading font-semibold text-ink">People</h1>
        <p className="text-body text-gray-500 mt-1">
          Admins can invite teammates and tag them to projects.
        </p>
      </div>

      {/* People table */}
      <Card padding="none" className="overflow-hidden">
        {people.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            No team members yet. Invite someone to get started.
          </div>
        ) : (
          people.map((person, i) => (
            <div
              key={person.id}
              className={`flex items-center gap-3 px-4 py-3.5 ${
                i < people.length - 1 ? 'border-b border-gray-100' : ''
              }`}
            >
              <Avatar name={person.full_name} size="lg" />
              <div className="flex-1 min-w-0">
                <div className="text-body font-semibold text-ink">{person.full_name}</div>
                <div className="text-label text-gray-400 font-mono truncate">{person.email}</div>
              </div>
              <span
                className={`flex items-center gap-1 text-caption font-semibold px-2.5 py-1 rounded-md ${
                  person.role === 'admin'
                    ? 'bg-brand-soft text-brand'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {person.role === 'admin' && <Shield size={11} />}
                {person.role === 'admin' ? 'Admin' : 'Member'}
              </span>
              {user?.role === 'admin' && person.id !== user.id && (
                <button
                  onClick={() => removePerson(person)}
                  disabled={removingId === person.id}
                  className="text-gray-400 hover:text-danger transition-colors disabled:opacity-50"
                  aria-label={`Remove ${person.full_name}`}
                  title="Remove person"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          ))
        )}
      </Card>

      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />

      {user?.role === 'admin' && (
        <Button onClick={() => setShowInvite(true)} className="mt-4">
          <Plus size={14} /> Invite person
        </Button>
      )}

      {showInvite && (
        <InviteModal
          error={inviteError}
          sending={inviting}
          onClose={() => { setShowInvite(false); setInviteError('') }}
          onInvite={inviteUser}
        />
      )}
    </div>
  )
}

function InviteModal({
  error,
  sending,
  onClose,
  onInvite,
}: {
  error: string
  sending: boolean
  onClose: () => void
  onInvite: (email: string, role: string) => void
}) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('member')

  return (
    <Modal title="Invite a teammate" onClose={onClose}>
      <div className="space-y-4">
        {error && (
          <div className="bg-danger-soft text-danger text-body-lg px-4 py-2.5 rounded-lg">{error}</div>
        )}

        <div>
          <Input
            label="Email address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={`name@${ALLOWED_DOMAIN}`}
          />
          <p className="text-caption text-gray-400 mt-1">Must be a @{ALLOWED_DOMAIN} address.</p>
        </div>

        <div>
          <label className="block text-body font-semibold text-ink mb-1.5">Role</label>
          <select
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-body-lg outline-none focus:border-brand"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <Button
          onClick={() => onInvite(email, role)}
          className="w-full"
          disabled={!email.trim() || sending}
        >
          {sending ? 'Sending invite...' : 'Send invite'}
        </Button>
      </div>
    </Modal>
  )
}
