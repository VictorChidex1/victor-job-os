import { createBrowserRouter } from 'react-router'
import {
  AppIndexRedirect,
  DashboardRoute,
  OpportunitiesRoute,
  OpportunityViewRoute,
  ProfileRoute,
  ProjectsRoute,
  ProtectedApp,
  SettingsRoute,
} from '@/router/AppRoutes'
import { LoginPage } from '@/pages/LoginPage'
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
    path: '/app',
    element: <ProtectedApp />,
    children: [
      { index: true, element: <AppIndexRedirect /> },
      { path: 'dashboard', element: <DashboardRoute /> },
      { path: 'opportunities', element: <OpportunitiesRoute /> },
      { path: 'opportunities/:id', element: <OpportunityViewRoute /> },
      { path: 'outreach', element: <PlaceholderPage /> },
      { path: 'outreach/:id', element: <PlaceholderPage /> },
      { path: 'companies', element: <PlaceholderPage /> },
      { path: 'companies/:id', element: <PlaceholderPage /> },
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