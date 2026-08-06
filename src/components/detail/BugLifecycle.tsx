import { Activity, ChevronDown } from 'lucide-react'
import { STATUS_META } from '../../lib/constants'
import type { Status } from '../../lib/constants'
import { SECTION_HEADER } from './DetailFields'
import Card from '../ui/Card'
import StatusBadge from '../ui/StatusBadge'

const STAGES: Status[] = ['Created', 'In Progress', 'In Review', 'Done', 'Closed']

// Reporter and QA are treated as the same stakeholder here — only Developer
// and QA/Tester show up as distinct owners.
const ROLE: Record<Status, 'D' | 'Q'> = {
  Created: 'Q',
  'In Progress': 'D',
  'In Review': 'Q',
  Done: 'Q',
  Closed: 'Q',
  Archived: 'Q',
}
const ROLE_BG: Record<'D' | 'Q', string> = { D: 'bg-blue-500', Q: 'bg-violet-500' }

export default function BugLifecycle({ status }: { status: Status }) {
  const rawIndex = STAGES.indexOf(status)
  // Statuses outside the 5-stage lifecycle (e.g. Archived) render as fully passed.
  const currentIndex = rawIndex === -1 ? STAGES.length : rawIndex

  return (
    <Card>
      <h2 className={`${SECTION_HEADER} flex items-center gap-2 mb-3.5`}>
        <Activity size={15} className="opacity-75" /> Bug Lifecycle
      </h2>

      <div className="flex flex-col">
        {STAGES.map((s, i) => {
          const isPast = i < currentIndex
          const isCurrent = i === currentIndex
          const isFuture = i > currentIndex
          const role = ROLE[s]
          const meta = STATUS_META[s]

          return (
            <div key={s}>
              <div
                className={`flex items-center justify-between rounded-md border border-gray-200 pl-2.5 pr-2 py-1.5 ${
                  isFuture ? 'opacity-45' : ''
                }`}
                style={isCurrent ? { borderLeftWidth: 3, borderLeftColor: meta.color, backgroundColor: meta.bg } : undefined}
              >
                <StatusBadge status={s} />
                <span
                  className={`w-5 h-5 rounded-full text-white text-[10px] font-semibold flex items-center justify-center shrink-0 ${ROLE_BG[role]}`}
                >
                  {role}
                </span>
              </div>
              {i < STAGES.length - 1 && (
                <div className="flex justify-center py-0.5">
                  <ChevronDown size={13} className={isPast ? 'text-gray-400' : 'text-gray-300'} />
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-2.5 bg-gray-50 border border-dashed border-gray-200 rounded-md px-2.5 py-2 text-[11px] text-gray-500 text-center leading-relaxed">
        <b className="text-gray-900 font-semibold">Reopen</b> — QA sends it back to In Progress if the fix doesn't hold.
      </div>

      <div className="mt-2.5 flex justify-center gap-3 text-[10.5px] text-gray-500">
        <span className="flex items-center gap-1">
          <i className="w-2 h-2 rounded-full inline-block bg-blue-500" /> D Developer
        </span>
        <span className="flex items-center gap-1">
          <i className="w-2 h-2 rounded-full inline-block bg-violet-500" /> Q QA / Tester
        </span>
      </div>
    </Card>
  )
}
