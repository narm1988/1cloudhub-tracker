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
      <p className="text-[15px] font-medium text-gray-600">{title}</p>
      {description && <p className="text-[13px] text-gray-400 mt-1">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
