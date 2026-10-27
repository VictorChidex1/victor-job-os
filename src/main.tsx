import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router/dom'
import './index.css'
import '@/services/firebase'
import { AuthProvider } from '@/providers/AuthProvider'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Toaster } from '@/components/ui/sonner'
import { reportClientError } from '@/lib/client-logger'
import { router } from './router.tsx'

window.addEventListener('error', (event) => {
  void reportClientError(event.error ?? event.message, { source: 'window.error' })
})

window.addEventListener('unhandledrejection', (event) => {
  void reportClientError(event.reason, { source: 'unhandledrejection' })
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <RouterProvider router={router} />
        <Toaster position="bottom-right" />
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>,
)
