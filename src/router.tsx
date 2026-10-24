import { createBrowserRouter } from 'react-router'
import {
  AppIndexRedirect,
  CompaniesRoute,
  CompanyViewRoute,
  DashboardRoute,
  OpportunitiesRoute,
  OpportunityViewRoute,
  OutreachEditorRoute,
  OutreachRoute,
  ProfileRoute,
  ProjectsRoute,
  ProtectedApp,
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
    path: '/app',
    element: <ProtectedApp />,
    children: [
      { index: true, element: <AppIndexRedirect /> },
      { path: 'dashboard', element: <DashboardRoute /> },
      { path: 'opportunities', element: <OpportunitiesRoute /> },
      { path: 'opportunities/:id', element: <OpportunityViewRoute /> },
      { path: 'outreach', element: <OutreachRoute /> },
      { path: 'outreach/:id', element: <OutreachEditorRoute /> },
      { path: 'companies', element: <CompaniesRoute /> },
      { path: 'companies/:id', element: <CompanyViewRoute /> },
      { path: 'projects', element: <ProjectsRoute /> },
      { path: 'activity', element: <PlaceholderPage /> },
      { path: 'automation', element: <PlaceholderPage /> },
      { path: 'profile', element: <ProfileRoute /> },
      { path: 'settings', element: <SettingsRoute /> },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])