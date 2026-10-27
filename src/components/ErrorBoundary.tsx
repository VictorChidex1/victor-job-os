import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { reportClientError } from '@/lib/client-logger'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

/**
 * Catches render-time errors so one broken page doesn't blank the whole app.
 * Reports the error (console + errorLogs when signed in).
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    void reportClientError(error, { componentStack: info.componentStack })
  }

  render() {
    if (this.state.error) {
      return (
        <main className="flex min-h-svh items-center justify-center bg-background p-6 text-foreground">
          <div className="w-full max-w-md rounded-2xl border p-6 text-center">
            <h1 className="text-lg font-semibold">Something went wrong</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              The page hit an unexpected error. Reloading usually fixes it.
            </p>
            <Button className="mt-4" onClick={() => window.location.reload()}>
              Reload
            </Button>
          </div>
        </main>
      )
    }

    return this.props.children
  }
}
