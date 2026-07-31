import { useEffect, useState } from 'react'
import { Plus, Shield } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { User } from '../types'
import Button from '../components/ui/Button'
import Avatar from '../components/ui/Avatar'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'

export default function PeoplePage() {
  const [people, setPeople] = useState<User[]>([])
  const [showInvite, setShowInvite] = useState(false)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    fetchPeople()
  }, [])

  async function fetchPeople() {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name')
    if (data) setPeople(data)
    setLoading(false)
  }

  async function inviteUser(email: string, role: string) {
    // In production, this would call a backend endpoint to send an invite
    // For now, we'll create the invite record in Supabase
    const { error } = await supabase.from('invites').insert({
      email,
      role,
      invited_by: user?.id,
    })

    if (!error) {
      setShowInvite(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-400">Loading people...</div>
  }

  return (
    <div>
      <div className="mb-5">
        <h1 className="font-display text-[22px] font-semibold text-ink">People</h1>
        <p className="text-[13px] text-gray-500 mt-1">
          Admins can invite teammates and tag them to projects.
        </p>
      </div>

      {/* People table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
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
                <div className="text-[13.5px] font-semibold text-ink">{person.full_name}</div>
                <div className="text-[12px] text-gray-400 font-mono truncate">{person.email}</div>
              </div>
              <span
                className={`flex items-center gap-1 text-[11.5px] font-semibold px-2.5 py-1 rounded-md ${
                  person.role === 'admin'
                    ? 'bg-brand-soft text-brand'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {person.role === 'admin' && <Shield size={11} />}
                {person.role === 'admin' ? 'Admin' : 'Member'}
              </span>
            </div>
          ))
        )}
      </div>

      {user?.role === 'admin' && (
        <Button onClick={() => setShowInvite(true)} className="mt-4">
          <Plus size={14} /> Invite person
        </Button>
      )}

      {showInvite && (
        <InviteModal onClose={() => setShowInvite(false)} onInvite={inviteUser} />
      )}
    </div>
  )
}

function InviteModal({
  onClose,
  onInvite,
}: {
  onClose: () => void
  onInvite: (email: string, role: string) => void
}) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('member')

  return (
    <Modal title="Invite a teammate" onClose={onClose}>
      <div className="space-y-4">
        <Input
          label="Email address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@1cloudhub.com"
        />

        <div>
          <label className="block text-[13px] font-semibold text-ink mb-1.5">Role</label>
          <select
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:border-brand"
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
          disabled={!email.trim()}
        >
          Send invite
        </Button>
      </div>
    </Modal>
  )
}
