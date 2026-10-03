import { createBrowserRouter } from 'react-router'
import { AppShell } from '@/components/layout/AppShell'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { PlaceholderPage } from '@/pages/PlaceholderPage'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
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