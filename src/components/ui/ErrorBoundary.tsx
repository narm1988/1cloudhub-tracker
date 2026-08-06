import { Component } from 'react'
import type { ReactNode } from 'react'
import { Cloud } from 'lucide-react'
import Button from './Button'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

// Must be a class component — React only supports error boundaries via
// getDerivedStateFromError/componentDidCatch, no hook equivalent exists.
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: unknown, info: unknown) {
    console.error('Unhandled UI error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-paper px-4">
          <div className="max-w-sm w-full text-center">
            <div className="w-10 h-10 rounded-lg bg-brand flex items-center justify-center mx-auto mb-4">
              <Cloud size={18} className="text-white" />
            </div>
            <h1 className="text-[17px] font-semibold text-gray-900 mb-1.5">Something went wrong</h1>
            <p className="text-[13px] text-gray-500 mb-5 leading-relaxed">
              This page ran into an unexpected error. Reloading usually fixes it.
            </p>
            <Button size="sm" onClick={() => window.location.reload()}>
              Reload page
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
