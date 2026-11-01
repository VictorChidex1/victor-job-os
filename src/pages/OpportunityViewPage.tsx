import { Navigate, useParams } from 'react-router'

/**
 * The opportunity detail now lives inside the Opportunities workspace.
 * Keep old `/app/opportunities/:id` links working by redirecting them.
 */
export function OpportunityViewPage() {
  const { id } = useParams<{ id: string }>()

  if (!id) {
    return <Navigate to="/app/opportunities" replace />
  }

  return <Navigate to={`/app/opportunities?job=${encodeURIComponent(id)}`} replace />
}
