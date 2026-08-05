import { forwardRef } from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'ghost' | 'destructive' | 'outline'
  size?: 'sm' | 'default' | 'lg' | 'icon'
  children: React.ReactNode
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'default', size = 'default', children, className = '', ...props }, ref) => {
    const base =
      'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 disabled:pointer-events-none disabled:opacity-50 cursor-pointer'

    const variants = {
      default: 'bg-brand text-white hover:bg-brand-deep shadow-sm',
      secondary: 'bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 shadow-sm',
      ghost: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
      destructive: 'bg-danger text-white hover:bg-danger/90 shadow-sm',
      outline: 'border border-gray-200 bg-white text-gray-900 hover:bg-gray-50',
    }

    const sizes = {
      sm: 'h-8 px-3 text-xs',
      default: 'h-10 px-4 text-sm',
      lg: 'h-12 px-6 text-sm',
      icon: 'h-10 w-10',
    }

    return (
      <button
        ref={ref}
        className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
export default Button
