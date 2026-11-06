import { lazy, Suspense } from 'react'
import { Navigate } from 'react-router'
import { AdminGuard } from '@/components/auth/AdminGuard'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { LoadingState } from '@/components/states/LoadingState'

export const AppShell = lazy(() =>
  import('@/components/layout/AppShell').then((module) => ({ default: module.AppShell })),
)

export const AdminShell = lazy(() =>
  import('@/components/admin/AdminShell').then((module) => ({
    default: module.AdminShell,
  })),
)

export const DashboardPage = lazy(() =>
  import('@/pages/DashboardPage').then((module) => ({ default: module.DashboardPage })),
)

export const AdminPage = lazy(() =>
  import('@/pages/AdminPage').then((module) => ({ default: module.AdminPage })),
)

export const AdminUsersPage = lazy(() =>
  import('@/pages/AdminUsersPage').then((module) => ({
    default: module.AdminUsersPage,
  })),
)

export const AdminUserDetailPage = lazy(() =>
  import('@/pages/AdminUserDetailPage').then((module) => ({
    default: module.AdminUserDetailPage,
  })),
)

export const ProfilePage = lazy(() =>
  import('@/pages/ProfilePage').then((module) => ({ default: module.ProfilePage })),
)

export const ProjectsPage = lazy(() =>
  import('@/pages/ProjectsPage').then((module) => ({ default: module.ProjectsPage })),
)

export const ResumeVariantsPage = lazy(() =>
  import('@/pages/ResumeVariantsPage').then((module) => ({
    default: module.ResumeVariantsPage,
  })),
)

export const SettingsPage = lazy(() =>
  import('@/pages/SettingsPage').then((module) => ({ default: module.SettingsPage })),
)

export const OpportunitiesPage = lazy(() =>
  import('@/pages/OpportunitiesPage').then((module) => ({ default: module.OpportunitiesPage })),
)

export const OpportunityViewPage = lazy(() =>
  import('@/pages/OpportunityViewPage').then((module) => ({ default: module.OpportunityViewPage })),
)

export const OutreachPage = lazy(() =>
  import('@/pages/OutreachPage').then((module) => ({ default: module.OutreachPage })),
)

export const OutreachEditorPage = lazy(() =>
  import('@/pages/OutreachEditorPage').then((module) => ({ default: module.OutreachEditorPage })),
)

export const CompaniesPage = lazy(() =>
  import('@/pages/CompaniesPage').then((module) => ({ default: module.CompaniesPage })),
)

export const CompanyViewPage = lazy(() =>
  import('@/pages/CompanyViewPage').then((module) => ({ default: module.CompanyViewPage })),
)

export const ApplicationsPage = lazy(() =>
  import('@/pages/ApplicationsPage').then((module) => ({
    default: module.ApplicationsPage,
  })),
)

export const ApplicationViewPage = lazy(() =>
  import('@/pages/ApplicationViewPage').then((module) => ({
    default: module.ApplicationViewPage,
  })),
)

export const ApplicationPreparationPage = lazy(() =>
  import('@/pages/ApplicationPreparationPage').then((module) => ({
    default: module.ApplicationPreparationPage,
  })),
)

export const DocumentationPage = lazy(() =>
  import('@/features/docs/DocsPage').then((module) => ({
    default: module.DocsPage,
  })),
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

export function AdminShellLoader() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md">
        <LoadingState label="Loading admin console…" rows={3} />
      </div>
    </main>
  )
}

export function ProtectedAdminApp() {
  return (
    <ProtectedRoute>
      <AdminGuard>
        <Suspense fallback={<AdminShellLoader />}>
          <AdminShell />
        </Suspense>
      </AdminGuard>
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

export function AdminRoute() {
  return (
    <Suspense fallback={<LoadingState rows={3} />}>
      <AdminPage />
    </Suspense>
  )
}

export function AdminUsersRoute() {
  return (
    <Suspense fallback={<LoadingState rows={3} />}>
      <AdminUsersPage />
    </Suspense>
  )
}

export function AdminUserDetailRoute() {
  return (
    <Suspense fallback={<LoadingState rows={5} />}>
      <AdminUserDetailPage />
    </Suspense>
  )
}

export function ProfileRoute() {
  return (
    <Suspense fallback={<LoadingState rows={3} />}>
      <ProfilePage />
    </Suspense>
  )
}

export function ProjectsRoute() {
  return (
    <Suspense fallback={<LoadingState rows={3} />}>
      <ProjectsPage />
    </Suspense>
  )
}

export function ResumeVariantsRoute() {
  return (
    <Suspense fallback={<LoadingState rows={3} />}>
      <ResumeVariantsPage />
    </Suspense>
  )
}

export function SettingsRoute() {
  return (
    <Suspense fallback={<LoadingState rows={3} />}>
      <SettingsPage />
    </Suspense>
  )
}

export function OpportunitiesRoute() {
  return (
    <Suspense fallback={<LoadingState rows={3} />}>
      <OpportunitiesPage />
    </Suspense>
  )
}

export function OpportunityViewRoute() {
  return (
    <Suspense fallback={<LoadingState rows={3} />}>
      <OpportunityViewPage />
    </Suspense>
  )
}

export function OutreachRoute() {
  return (
    <Suspense fallback={<LoadingState rows={3} />}>
      <OutreachPage />
    </Suspense>
  )
}

export function OutreachEditorRoute() {
  return (
    <Suspense fallback={<LoadingState rows={3} />}>
      <OutreachEditorPage />
    </Suspense>
  )
}

export function CompaniesRoute() {
  return (
    <Suspense fallback={<LoadingState rows={3} />}>
      <CompaniesPage />
    </Suspense>
  )
}

export function CompanyViewRoute() {
  return (
    <Suspense fallback={<LoadingState rows={3} />}>
      <CompanyViewPage />
    </Suspense>
  )
}

export function ApplicationsRoute() {
  return (
    <Suspense fallback={<LoadingState rows={3} />}>
      <ApplicationsPage />
    </Suspense>
  )
}

export function ApplicationViewRoute() {
  return (
    <Suspense fallback={<LoadingState rows={3} />}>
      <ApplicationViewPage />
    </Suspense>
  )
}

export function ApplicationPreparationRoute() {
  return (
    <Suspense fallback={<LoadingState rows={5} />}>
      <ApplicationPreparationPage />
    </Suspense>
  )
}

export function DocsRoute() {
  return (
    <Suspense fallback={<LoadingState rows={3} />}>
      <DocumentationPage mode="app" />
    </Suspense>
  )
}

export function DocsPageLoader() {
  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <div className="w-full max-w-md">
        <LoadingState label="Loading documentation…" rows={3} />
      </div>
    </main>
  )
}

export function PublicDocsRoute() {
  return (
    <Suspense fallback={<DocsPageLoader />}>
      <DocumentationPage mode="public" />
    </Suspense>
  )
}

export function AppIndexRedirect() {
  return <Navigate to="/app/dashboard" replace />
}