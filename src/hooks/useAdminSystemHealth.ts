import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { loadAdminSystemHealth } from '@/services/adminSystem'
import type { AdminSystemHealth } from '@/types/admin'

export interface UseAdminSystemHealthResult {
  health: AdminSystemHealth | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useAdminSystemHealth(): UseAdminSystemHealthResult {
  const { isAdmin, isAdminLoading } = useAuth()
  const [health, setHealth] = useState<AdminSystemHealth | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (isAdminLoading || !isAdmin) {
      setHealth(null)
      setLoading(isAdminLoading)
      if (!isAdminLoading) setError(null)
      return
    }

    setLoading(true)
    try {
      setHealth(await loadAdminSystemHealth())
      setError(null)
    } catch {
      setError('Unable to load system health. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [isAdmin, isAdminLoading])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- fetch-on-mount idiom; setState occurs after await
    void refresh()
  }, [refresh])

  return { health, loading, error, refresh }
}
