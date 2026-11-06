import { createBrowserRouter, Navigate } from 'react-router'
import {
  AppIndexRedirect,
  AdminRoute,
  AdminUsersRoute,
  AdminUserDetailRoute,
  ApplicationsRoute,
  ApplicationPreparationRoute,
  ApplicationViewRoute,
  CompaniesRoute,
  CompanyViewRoute,
  DashboardRoute,
  DocsRoute,
  OpportunitiesRoute,
  OpportunityViewRoute,
  OutreachEditorRoute,
  OutreachRoute,
  ProfileRoute,
  ProjectsRoute,
  ResumeVariantsRoute,
  ProtectedApp,
  ProtectedAdminApp,
  PublicDocsRoute,
  SettingsRoute,
} from '@/router/AppRoutes'
import { LoginPage } from '@/pages/LoginPage'
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { PlaceholderPage } from '@/pages/PlaceholderPage'
import { LandingPage } from '@/features/landing/LandingPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPasswordPage />,
  },
  {
    path: '/docs',
    element: <PublicDocsRoute />,
  },
  {
    path: '/admin',
    element: <ProtectedAdminApp />,
    children: [
      { index: true, element: <AdminRoute /> },
      { path: 'users', element: <AdminUsersRoute /> },
      { path: 'users/:uid', element: <AdminUserDetailRoute /> },
    ],
  },
  {
    path: '/app',
    element: <ProtectedApp />,
    children: [
      { index: true, element: <AppIndexRedirect /> },
      { path: 'dashboard', element: <DashboardRoute /> },
      { path: 'admin', element: <Navigate to="/admin" replace /> },
      { path: 'opportunities', element: <OpportunitiesRoute /> },
      { path: 'opportunities/:id', element: <OpportunityViewRoute /> },
      { path: 'outreach', element: <OutreachRoute /> },
      { path: 'outreach/:id', element: <OutreachEditorRoute /> },
      { path: 'applications', element: <ApplicationsRoute /> },
      { path: 'applications/:id/prepare', element: <ApplicationPreparationRoute /> },
      { path: 'applications/:id', element: <ApplicationViewRoute /> },
      { path: 'companies', element: <CompaniesRoute /> },
      { path: 'companies/:id', element: <CompanyViewRoute /> },
      { path: 'projects', element: <ProjectsRoute /> },
      { path: 'resumes', element: <ResumeVariantsRoute /> },
      { path: 'activity', element: <PlaceholderPage /> },
      { path: 'automation', element: <PlaceholderPage /> },
      { path: 'profile', element: <ProfileRoute /> },
      { path: 'settings', element: <SettingsRoute /> },
      { path: 'docs', element: <DocsRoute /> },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])