import Card from './Card'

interface LoadingSkeletonProps {
  variant?: 'cards' | 'rows'
  count?: number
}

export default function LoadingSkeleton({ variant = 'rows', count = 3 }: LoadingSkeletonProps) {
  if (variant === 'cards') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: count }).map((_, i) => (
          <Card key={i} className="animate-pulse" style={{ animationDelay: `${i * 80}ms` }}>
            <div className="w-9 h-9 rounded-lg bg-gray-200 mb-4" />
            <div className="h-3.5 w-2/3 rounded bg-gray-200 mb-2" />
            <div className="h-3 w-full rounded bg-gray-100 mb-1.5" />
            <div className="h-3 w-4/5 rounded bg-gray-100" />
          </Card>
        ))}
      </div>
    )
  }

  return (
    <Card padding="none" className="overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`flex items-center gap-3 px-4 py-3.5 animate-pulse ${i < count - 1 ? 'border-b border-gray-100' : ''}`}
          style={{ animationDelay: `${i * 80}ms` }}
        >
          <div className="w-7 h-7 rounded-full bg-gray-200 shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-1/3 rounded bg-gray-200" />
            <div className="h-2.5 w-1/2 rounded bg-gray-100" />
          </div>
          <div className="h-5 w-16 rounded bg-gray-100 shrink-0" />
        </div>
      ))}
    </Card>
  )
}
