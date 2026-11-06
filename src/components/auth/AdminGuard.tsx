import type { ReactNode } from 'react'
import { Link, Navigate, useLocation } from 'react-router'
import { ShieldX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { LoadingState } from '@/components/states/LoadingState'
import { useAuth } from '@/hooks/useAuth'

export function AdminGuard({ children }: { children: ReactNode }) {
  const { status, isAdmin, isAdminLoading } = useAuth()
  const location = useLocation()

  if (status === 'loading' || isAdminLoading) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md">
          <LoadingState label="Checking admin access…" rows={3} />
        </div>
      </main>
    )
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (!isAdmin) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-slate-50 p-6">
        <Card className="w-full max-w-md border-slate-200 shadow-sm">
          <CardHeader className="items-center text-center">
            <div className="mb-2 flex size-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <ShieldX className="size-5" />
            </div>
            <CardTitle>Admin access required</CardTitle>
            <CardDescription>
              This area is limited to system administrators.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button size="sm" render={<Link to="/app/dashboard" />}>
              Back to Job OS
            </Button>
          </CardContent>
        </Card>
      </main>
    )
  }

  return children
}
