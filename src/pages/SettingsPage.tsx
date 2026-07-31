import { useAuth } from '../context/AuthContext'

export default function SettingsPage() {
  const { user } = useAuth()

  return (
    <div>
      <h1 className="font-display text-[22px] font-semibold text-ink mb-5">Settings</h1>

      <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-lg">
        <h2 className="text-sm font-semibold text-ink mb-4">Profile</h2>
        <div className="space-y-3">
          <div>
            <label className="text-[12px] text-gray-500 block">Name</label>
            <p className="text-sm text-ink">{user?.full_name}</p>
          </div>
          <div>
            <label className="text-[12px] text-gray-500 block">Email</label>
            <p className="text-sm text-ink font-mono">{user?.email}</p>
          </div>
          <div>
            <label className="text-[12px] text-gray-500 block">Role</label>
            <p className="text-sm text-ink capitalize">{user?.role}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
