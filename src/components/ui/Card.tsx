interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const PADDING = {
  none: '',
  sm: 'p-3.5',
  md: 'p-5',
  lg: 'p-6',
}

export default function Card({ padding = 'md', className = '', children, ...props }: CardProps) {
  return (
    <div className={`bg-white border border-gray-200 rounded-xl ${PADDING[padding]} ${className}`} {...props}>
      {children}
    </div>
  )
}
