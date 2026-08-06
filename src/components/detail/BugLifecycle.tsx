import { Activity, RotateCcw } from 'lucide-react'
import type { Status } from '../../lib/constants'
import { SECTION_HEADER } from './DetailFields'
import Card from '../ui/Card'

interface Stage {
  key: Status
  label: string
  color: string
  fill: string
  role: 'D' | 'Q'
}

// Reporter and QA are treated as the same stakeholder here — only Developer
// and QA/Tester show up as distinct owners.
const STAGES: Stage[] = [
  { key: 'Created', label: 'Created', color: '#475569', fill: '#F1F5F9', role: 'Q' },
  { key: 'In Progress', label: 'In Progress', color: '#2563EB', fill: '#EFF6FF', role: 'D' },
  { key: 'In Review', label: 'In Review', color: '#7C3AED', fill: '#F5F3FF', role: 'Q' },
  { key: 'Done', label: 'Done', color: '#059669', fill: '#ECFDF5', role: 'Q' },
  { key: 'Closed', label: 'Closed', color: '#374151', fill: '#E5E7EB', role: 'Q' },
]

const ROLE_COLOR: Record<Stage['role'], string> = { D: '#3B82F6', Q: '#8B5CF6' }
const NODE_Y = [10, 74, 138, 202, 266]
const BOX_H = 34

export default function BugLifecycle({ status }: { status: Status }) {
  const rawIndex = STAGES.findIndex((s) => s.key === status)
  // Statuses outside the 5-stage lifecycle (e.g. Archived) render as fully passed.
  const currentIndex = rawIndex === -1 ? STAGES.length : rawIndex

  return (
    <Card>
      <h2 className={`${SECTION_HEADER} flex items-center gap-2 mb-3.5`}>
        <Activity size={15} className="opacity-75" /> Bug Lifecycle
      </h2>

      <svg viewBox="0 0 240 320" className="w-full">
        <defs>
          <marker id="bl-ah-done" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill="#14171F" />
          </marker>
          <marker id="bl-ah-todo" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill="#D1D5DB" />
          </marker>
          <marker id="bl-ah-reopen" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill="#DC2626" />
          </marker>
        </defs>

        {[0, 1, 2, 3].map((i) => {
          const done = i < currentIndex
          return (
            <line
              key={i}
              x1="90" y1={NODE_Y[i] + BOX_H}
              x2="90" y2={NODE_Y[i + 1]}
              strokeWidth={2}
              stroke={done ? '#14171F' : '#D1D5DB'}
              markerEnd={done ? 'url(#bl-ah-done)' : 'url(#bl-ah-todo)'}
            />
          )
        })}

        <path
          d="M 160 155 C 205 155, 205 91, 163 91"
          fill="none" stroke="#DC2626" strokeWidth={1.5} strokeDasharray="3 3"
          markerEnd="url(#bl-ah-reopen)"
        />
        <text x="212" y="123" fontSize="8.5" fontWeight="600" fill="#DC2626" textAnchor="middle" transform="rotate(-90 212 123)">
          REOPEN
        </text>

        {STAGES.map((s, i) => {
          const y = NODE_Y[i]
          const isPast = i < currentIndex
          const isCurrent = i === currentIndex
          const isFuture = i > currentIndex
          const fillOpacity = isFuture ? 0.45 : 1
          const strokeOpacity = isCurrent ? 1 : isPast ? 0.5 : 0.35
          const emphasisOpacity = isPast ? 0.85 : isCurrent ? 1 : 0.55

          return (
            <g key={s.key}>
              {isCurrent && (
                <rect x={17} y={y - 3} width={146} height={40} rx={10} fill="none" stroke={s.color} strokeWidth={2} />
              )}
              <rect
                x={20} y={y} width={140} height={34} rx={8}
                fill={s.fill} fillOpacity={fillOpacity}
                stroke={s.color} strokeOpacity={strokeOpacity}
                strokeWidth={isCurrent ? 1.5 : 1}
                strokeDasharray={isFuture ? '3 3' : undefined}
              />
              <text x={30} y={y + 21} fontSize="12.5" fontWeight={600} fill={s.color} opacity={emphasisOpacity}>
                {s.label}
              </text>
              <circle cx={145} cy={y + 17} r={9} fill={ROLE_COLOR[s.role]} opacity={isFuture ? 0.4 : emphasisOpacity} />
              <text x={145} y={y + 20} fontSize="9" fontWeight={700} fill="#fff" textAnchor="middle" opacity={isFuture ? 0.4 : emphasisOpacity}>
                {s.role}
              </text>
            </g>
          )
        })}
      </svg>

      <div className="mt-2 bg-gray-50 border border-dashed border-gray-200 rounded-md px-2.5 py-2 text-[11px] text-gray-500 text-center leading-relaxed">
        <RotateCcw size={11} className="inline -mt-0.5 mr-1" style={{ color: '#DC2626' }} />
        <b className="text-gray-900 font-semibold">Reopen</b> — QA sends it back to In Progress if the fix doesn't hold.
      </div>

      <div className="mt-2.5 flex justify-center gap-3 text-[10.5px] text-gray-500">
        <span className="flex items-center gap-1">
          <i className="w-2 h-2 rounded-full inline-block" style={{ background: ROLE_COLOR.D }} /> D Developer
        </span>
        <span className="flex items-center gap-1">
          <i className="w-2 h-2 rounded-full inline-block" style={{ background: ROLE_COLOR.Q }} /> Q QA / Tester
        </span>
      </div>
    </Card>
  )
}
