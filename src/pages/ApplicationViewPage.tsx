import { Navigate, useParams } from 'react-router'

/**
 * The application detail now opens in the Applications pipeline sheet.
 * Keep direct `/app/applications/:id` links working.
 */
export function ApplicationViewPage() {
  const { id } = useParams<{ id: string }>()

  if (!id) {
    return <Navigate to="/app/applications" replace />
  }

  return <Navigate to={`/app/applications?application=${encodeURIComponent(id)}`} replace />
}
