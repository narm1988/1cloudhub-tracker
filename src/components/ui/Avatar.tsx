interface AvatarProps {
  name: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const HUES = ['bg-brand', 'bg-success', 'bg-warning', 'bg-danger', 'bg-info', 'bg-violet-500']

export default function Avatar({ name, size = 'md', className = '' }: AvatarProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const hueIndex = name.length % HUES.length
  const bgColor = HUES[hueIndex]

  const sizeClasses = {
    sm: 'w-5 h-5 text-[8px]',
    md: 'w-7 h-7 text-[10px]',
    lg: 'w-9 h-9 text-xs',
  }

  return (
    <div
      title={name}
      className={`${bgColor} ${sizeClasses[size]} rounded-full text-white font-semibold flex items-center justify-center shrink-0 ${className}`}
    >
      {initials}
    </div>
  )
}
