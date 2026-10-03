import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
import { useAuth } from '@/hooks/useAuth'
import { LoadingState } from '@/components/states/LoadingState'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { status } = useAuth()

  if (status === 'loading') {
    return (
      <main className="flex min-h-svh items-center justify-center p-6">
        <div className="w-full max-w-md">
          <LoadingState label="Checking authentication…" rows={2} />
        </div>
      </main>
    )
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace />
  }

  return children
}