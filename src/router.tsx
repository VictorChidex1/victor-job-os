import { createBrowserRouter } from 'react-router'
import { PlaceholderPage } from '@/pages/PlaceholderPage'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <PlaceholderPage />,
  },
  {
    path: '/',
    element: <PlaceholderPage />,
  },
  {
    path: '/opportunities',
    element: <PlaceholderPage />,
  },
  {
    path: '/opportunities/:id',
    element: <PlaceholderPage />,
  },
  {
    path: '/companies',
    element: <PlaceholderPage />,
  },
  {
    path: '/companies/:id',
    element: <PlaceholderPage />,
  },
  {
    path: '/outreach',
    element: <PlaceholderPage />,
  },
  {
    path: '/outreach/:id',
    element: <PlaceholderPage />,
  },
  {
    path: '/profile',
    element: <PlaceholderPage />,
  },
  {
    path: '/projects',
    element: <PlaceholderPage />,
  },
  {
    path: '/settings',
    element: <PlaceholderPage />,
  },
])