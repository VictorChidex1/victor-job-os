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

export const AdminOpportunitiesPage = lazy(() =>
  import('@/pages/AdminOpportunitiesPage').then((module) => ({
    default: module.AdminOpportunitiesPage,
  })),
)

export const AdminOpportunityDetailPage = lazy(() =>
  import('@/pages/AdminOpportunityDetailPage').then((module) => ({
    default: module.AdminOpportunityDetailPage,
  })),
)

export const AdminApplicationsPage = lazy(() =>
  import('@/pages/AdminApplicationsPage').then((module) => ({
    default: module.AdminApplicationsPage,
  })),
)

export const AdminInterviewsPage = lazy(() =>
  import('@/pages/AdminInterviewsPage').then((module) => ({
    default: module.AdminInterviewsPage,
  })),
)

export const AdminApplicationDetailPage = lazy(() =>
  import('@/pages/AdminApplicationDetailPage').then((module) => ({
    default: module.AdminApplicationDetailPage,
  })),
)

export const AdminOutreachPage = lazy(() =>
  import('@/pages/AdminOutreachPage').then((module) => ({
    default: module.AdminOutreachPage,
  })),
)

export const AdminOutreachDetailPage = lazy(() =>
  import('@/pages/AdminOutreachDetailPage').then((module) => ({
    default: module.AdminOutreachDetailPage,
  })),
)

export const AdminCompaniesPage = lazy(() =>
  import('@/pages/AdminCompaniesPage').then((module) => ({
    default: module.AdminCompaniesPage,
  })),
)

export const AdminCompanyDetailPage = lazy(() =>
  import('@/pages/AdminCompanyDetailPage').then((module) => ({
    default: module.AdminCompanyDetailPage,
  })),
)

export const AdminResumesPage = lazy(() =>
  import('@/pages/AdminResumesPage').then((module) => ({
    default: module.AdminResumesPage,
  })),
)

export const AdminResumeDetailPage = lazy(() =>
  import('@/pages/AdminResumeDetailPage').then((module) => ({
    default: module.AdminResumeDetailPage,
  })),
)

export const AdminSystemHealthPage = lazy(() =>
  import('@/pages/AdminSystemHealthPage').then((module) => ({
    default: module.AdminSystemHealthPage,
  })),
)

export const AdminAiUsagePage = lazy(() =>
  import('@/pages/AdminAiUsagePage').then((module) => ({
    default: module.AdminAiUsagePage,
  })),
)

export const AdminAiRunDetailPage = lazy(() =>
  import('@/pages/AdminAiRunDetailPage').then((module) => ({
    default: module.AdminAiRunDetailPage,
  })),
)

export const AdminErrorsPage = lazy(() =>
  import('@/pages/AdminErrorsPage').then((module) => ({
    default: module.AdminErrorsPage,
  })),
)

export const AdminErrorDetailPage = lazy(() =>
  import('@/pages/AdminErrorDetailPage').then((module) => ({
    default: module.AdminErrorDetailPage,
  })),
)

export const AdminAuditLogPage = lazy(() =>
  import('@/pages/AdminAuditLogPage').then((module) => ({
    default: module.AdminAuditLogPage,
  })),
)

export const AdminAuditLogDetailPage = lazy(() =>
  import('@/pages/AdminAuditLogDetailPage').then((module) => ({
    default: module.AdminAuditLogDetailPage,
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

export const AutomationPage = lazy(() =>
  import('@/pages/AutomationPage').then((module) => ({
    default: module.AutomationPage,
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

export function AdminOpportunitiesRoute() {
  return (
    <Suspense fallback={<LoadingState rows={5} />}>
      <AdminOpportunitiesPage />
    </Suspense>
  )
}

export function AdminOpportunityDetailRoute() {
  return (
    <Suspense fallback={<LoadingState rows={5} />}>
      <AdminOpportunityDetailPage />
    </Suspense>
  )
}

export function AdminApplicationsRoute() {
  return (
    <Suspense fallback={<LoadingState rows={5} />}>
      <AdminApplicationsPage />
    </Suspense>
  )
}

export function AdminApplicationDetailRoute() {
  return (
    <Suspense fallback={<LoadingState rows={5} />}>
      <AdminApplicationDetailPage />
    </Suspense>
  )
}

export function AdminInterviewsRoute() {
  return (
    <Suspense fallback={<LoadingState rows={5} />}>
      <AdminInterviewsPage />
    </Suspense>
  )
}

export function AdminOutreachRoute() {
  return (
    <Suspense fallback={<LoadingState rows={5} />}>
      <AdminOutreachPage />
    </Suspense>
  )
}

export function AdminOutreachDetailRoute() {
  return (
    <Suspense fallback={<LoadingState rows={5} />}>
      <AdminOutreachDetailPage />
    </Suspense>
  )
}

export function AdminCompaniesRoute() {
  return (
    <Suspense fallback={<LoadingState rows={5} />}>
      <AdminCompaniesPage />
    </Suspense>
  )
}

export function AdminCompanyDetailRoute() {
  return (
    <Suspense fallback={<LoadingState rows={5} />}>
      <AdminCompanyDetailPage />
    </Suspense>
  )
}

export function AdminResumesRoute() {
  return (
    <Suspense fallback={<LoadingState rows={5} />}>
      <AdminResumesPage />
    </Suspense>
  )
}

export function AdminResumeDetailRoute() {
  return (
    <Suspense fallback={<LoadingState rows={5} />}>
      <AdminResumeDetailPage />
    </Suspense>
  )
}

export function AdminSystemHealthRoute() {
  return (
    <Suspense fallback={<LoadingState rows={6} />}>
      <AdminSystemHealthPage />
    </Suspense>
  )
}

export function AdminAiUsageRoute() {
  return (
    <Suspense fallback={<LoadingState rows={5} />}>
      <AdminAiUsagePage />
    </Suspense>
  )
}

export function AdminAiRunDetailRoute() {
  return (
    <Suspense fallback={<LoadingState rows={5} />}>
      <AdminAiRunDetailPage />
    </Suspense>
  )
}

export function AdminErrorsRoute() {
  return (
    <Suspense fallback={<LoadingState rows={5} />}>
      <AdminErrorsPage />
    </Suspense>
  )
}

export function AdminErrorDetailRoute() {
  return (
    <Suspense fallback={<LoadingState rows={5} />}>
      <AdminErrorDetailPage />
    </Suspense>
  )
}

export function AdminAuditLogRoute() {
  return (
    <Suspense fallback={<LoadingState rows={5} />}>
      <AdminAuditLogPage />
    </Suspense>
  )
}

export function AdminAuditLogDetailRoute() {
  return (
    <Suspense fallback={<LoadingState rows={5} />}>
      <AdminAuditLogDetailPage />
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

export function AutomationRoute() {
  return (
    <Suspense fallback={<LoadingState rows={3} />}>
      <AutomationPage />
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