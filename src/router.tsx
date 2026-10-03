import { createBrowserRouter } from 'react-router'
import {
  AppIndexRedirect,
  DashboardRoute,
  ProtectedApp,
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
      { path: 'opportunities', element: <PlaceholderPage /> },
      { path: 'opportunities/:id', element: <PlaceholderPage /> },
      { path: 'outreach', element: <PlaceholderPage /> },
      { path: 'outreach/:id', element: <PlaceholderPage /> },
      { path: 'companies', element: <PlaceholderPage /> },
      { path: 'companies/:id', element: <PlaceholderPage /> },
      { path: 'projects', element: <PlaceholderPage /> },
      { path: 'activity', element: <PlaceholderPage /> },
      { path: 'automation', element: <PlaceholderPage /> },
      { path: 'profile', element: <PlaceholderPage /> },
      { path: 'settings', element: <PlaceholderPage /> },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])