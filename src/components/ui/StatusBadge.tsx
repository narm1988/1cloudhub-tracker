import { STATUS_META } from '../../lib/constants'
import type { Status } from '../../lib/constants'

interface StatusBadgeProps {
  status: Status
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const meta = STATUS_META[status]
  return (
    <span
      className={`text-caption font-semibold px-2.5 py-0.5 rounded-md whitespace-nowrap ${meta.tailwind}`}
    >
      {status}
    </span>
  )
}
