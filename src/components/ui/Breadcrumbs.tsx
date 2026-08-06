import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

export interface BreadcrumbItem {
  label: string
  href?: string
}

export default function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <div className="flex items-center gap-1.5 text-[12.5px] text-gray-500 mb-3 flex-wrap">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5 min-w-0">
          {i > 0 && <ChevronRight size={12} className="text-gray-300 shrink-0" />}
          {item.href ? (
            <Link to={item.href} className="hover:text-brand transition-colors truncate">
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-900 font-medium truncate">{item.label}</span>
          )}
        </span>
      ))}
    </div>
  )
}
