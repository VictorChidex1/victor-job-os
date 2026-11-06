import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { loadAdminOverview } from '@/services/admin'
import type { AdminOverview } from '@/types/admin'

export interface UseAdminOverviewResult {
  overview: AdminOverview | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useAdminOverview(): UseAdminOverviewResult {
  const { isAdmin, isAdminLoading } = useAuth()
  const [overview, setOverview] = useState<AdminOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (isAdminLoading || !isAdmin) {
      setOverview(null)
      setLoading(isAdminLoading)
      if (!isAdminLoading) setError(null)
      return
    }

    try {
      const data = await loadAdminOverview()
      setOverview(data)
      setError(null)
    } catch {
      setError('Unable to load the admin overview. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [isAdmin, isAdminLoading])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- fetch-on-mount idiom; setState occurs after await
    void refresh()
  }, [refresh])

  return { overview, loading, error, refresh }
}
