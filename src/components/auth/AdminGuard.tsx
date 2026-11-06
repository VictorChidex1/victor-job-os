import type { ReactNode } from 'react'
import { Link, Navigate, useLocation } from 'react-router'
import { PageContainer } from '@/components/layout/PageContainer'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/states/EmptyState'
import { LoadingState } from '@/components/states/LoadingState'
import { useAuth } from '@/hooks/useAuth'

export function AdminGuard({ children }: { children: ReactNode }) {
  const { status, isAdmin, isAdminLoading } = useAuth()
  const location = useLocation()

  if (status === 'loading' || isAdminLoading) {
    return (
      <PageContainer title="Admin">
        <LoadingState label="Checking admin access…" rows={3} />
      </PageContainer>
    )
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (!isAdmin) {
    return (
      <PageContainer title="Admin access required">
        <EmptyState
          title="You do not have admin access"
          description="This area is limited to system administrators."
          action={
            <Button size="sm" render={<Link to="/app/dashboard" />}>
              Back to dashboard
            </Button>
          }
        />
      </PageContainer>
    )
  }

  return children
}
