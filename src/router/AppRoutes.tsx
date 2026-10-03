import { lazy, Suspense } from 'react'
import { Navigate } from 'react-router'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { LoadingState } from '@/components/states/LoadingState'

export const AppShell = lazy(() =>
  import('@/components/layout/AppShell').then((module) => ({ default: module.AppShell })),
)

export const DashboardPage = lazy(() =>
  import('@/pages/DashboardPage').then((module) => ({ default: module.DashboardPage })),
)

export function AppShellLoader() {
  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <div className="w-full max-w-md">
        <LoadingState label="Loading workspace…" rows={3} />
      </div>
    </main>
  )
}

export function ProtectedApp() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<AppShellLoader />}>
        <AppShell />
      </Suspense>
    </ProtectedRoute>
  )
}

export function DashboardRoute() {
  return (
    <Suspense fallback={<LoadingState rows={3} />}>
      <DashboardPage />
    </Suspense>
  )
}

export function AppIndexRedirect() {
  return <Navigate to="/app/dashboard" replace />
}