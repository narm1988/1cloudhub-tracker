import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { SIDEBAR_THEMES } from '../lib/themes'
import { Check } from 'lucide-react'
import Card from '../components/ui/Card'
import { SECTION_HEADER } from '../components/detail/DetailFields'
import { useDocumentTitle } from '../lib/useDocumentTitle'

export default function SettingsPage() {
  const { user } = useAuth()
  const { theme, setThemeId } = useTheme()
  useDocumentTitle('Settings')

  return (
    <div>
      <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-gray-900 mb-5">Settings</h1>

      <div className="space-y-5">
        <Card padding="lg">
          <h2 className={`${SECTION_HEADER} mb-4`}>Profile</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-[13px] text-gray-500 block">Name</label>
              <p className="text-[13px] text-gray-900">{user?.full_name}</p>
            </div>
            <div>
              <label className="text-[13px] text-gray-500 block">Email</label>
              <p className="text-[13px] text-gray-900 font-mono">{user?.email}</p>
            </div>
            <div>
              <label className="text-[13px] text-gray-500 block">Role</label>
              <p className="text-[13px] text-gray-900 capitalize">{user?.role}</p>
            </div>
          </div>
        </Card>

        <Card padding="lg">
          <h2 className={`${SECTION_HEADER} mb-1`}>Appearance</h2>
          <p className="text-[13px] text-gray-500 mb-4">Choose a colour theme for the sidebar.</p>
          <div className="grid grid-cols-3 gap-3">
            {SIDEBAR_THEMES.map((t) => {
              const isActive = theme.id === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => setThemeId(t.id)}
                  className={`flex flex-col items-center gap-2 p-2.5 rounded-lg border-2 transition-colors ${
                    isActive ? 'border-brand' : 'border-transparent hover:border-gray-200'
                  }`}
                >
                  <span
                    className="w-full h-10 rounded-md flex items-center justify-center"
                    style={{ backgroundColor: t.bg }}
                  >
                    {isActive && <Check size={16} className="text-white" />}
                  </span>
                  <span className="text-[13px] text-gray-900 font-medium">{t.name}</span>
                </button>
              )
            })}
          </div>
        </Card>
      </div>
    </div>
  )
}
