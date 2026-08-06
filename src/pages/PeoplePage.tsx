import { useEffect, useState } from 'react'
import { Plus, Shield, Trash2 } from 'lucide-react'
import { api, ApiError } from '../lib/api'
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
    try {
      const { data, total } = await api.listPeople(page, PAGE_SIZE)
      setPeople(data)
      setTotal(total)
    } catch {
      // Leave whatever was already loaded in place rather than blanking the page.
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
    try {
      await api.invite(normalized, role)
      setShowInvite(false)
      fetchPeople()
    } catch (err) {
      setInviteError(err instanceof ApiError ? err.message : 'Failed to send invite.')
    } finally {
      setInviting(false)
    }
  }

  async function removePerson(person: User) {
    if (!window.confirm(`Remove ${person.full_name} from the team? This cannot be undone.`)) return

    setRemovingId(person.id)
    try {
      await api.removePerson(person.id)
      setPeople((prev) => prev.filter((p) => p.id !== person.id))
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Failed to remove person.')
    } finally {
      setRemovingId(null)
    }
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
        <h1 className="text-[17px] font-semibold tracking-[-0.01em] text-gray-900">People</h1>
        <p className="text-[13px] text-gray-500 mt-1">
          Admins can invite teammates and tag them to projects.
        </p>
      </div>

      {/* People table */}
      <Card padding="none" className="overflow-hidden">
        {people.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-[13px]">
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
                <div className="text-[13px] font-semibold text-gray-900">{person.full_name}</div>
                <div className="text-[13px] text-gray-400 font-mono truncate">{person.email}</div>
              </div>
              <span
                className={`flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-md ${
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
        <Button size="sm" onClick={() => setShowInvite(true)} className="mt-4">
          <Plus size={13} /> Invite person
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
      <div className="space-y-3.5">
        {error && (
          <div className="text-[13px] bg-red-50 text-red-600 border border-red-100 rounded-md px-3 py-2.5">{error}</div>
        )}

        <div>
          <Input
            label="Email address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={`name@${ALLOWED_DOMAIN}`}
          />
          <p className="text-[12px] text-gray-400 mt-1">Must be a @{ALLOWED_DOMAIN} address.</p>
        </div>

        <div>
          <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Role</label>
          <select
            className="w-full h-9 px-3 rounded-md border border-gray-200 bg-white text-[13px] text-gray-900 shadow-sm outline-none placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/10"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <Button
          size="sm"
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
