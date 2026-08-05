import { forwardRef } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  icon?: React.ReactNode
  error?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, icon, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-900 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-1 text-sm text-gray-900 shadow-sm outline-none placeholder:text-gray-400 focus:border-brand focus:ring-1 focus:ring-brand/30 transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${icon ? 'pl-9' : ''} ${error ? 'border-danger' : ''} ${className}`}
            {...props}
          />
        </div>
        {error && <p className="text-danger text-xs mt-1.5">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
export default Input
