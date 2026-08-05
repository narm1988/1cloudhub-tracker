interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export default function EmptyState({ icon, title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`text-center py-12 text-gray-400 ${className}`}>
      <div className="mb-4 flex justify-center text-gray-300">{icon}</div>
      <p className="text-subhead font-medium text-gray-500">{title}</p>
      {description && <p className="text-body mt-1">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
