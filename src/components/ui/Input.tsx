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
          <label className="block text-[13px] font-semibold text-ink mb-1.5">
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
            className={`w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm font-body text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 transition-colors ${icon ? 'pl-9' : ''} ${error ? 'border-danger' : ''} ${className}`}
            {...props}
          />
        </div>
        {error && <p className="text-danger text-xs mt-1">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
export default Input
