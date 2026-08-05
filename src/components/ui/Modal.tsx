import { X } from 'lucide-react'

interface ModalProps {
  title: string
  onClose: () => void
  children: React.ReactNode
  width?: string
}

export default function Modal({ title, onClose, children, width = 'max-w-md' }: ModalProps) {
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`bg-white rounded-lg ${width} w-full p-6 shadow-lg animate-pop-in`}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-[15px] font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-sm text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
