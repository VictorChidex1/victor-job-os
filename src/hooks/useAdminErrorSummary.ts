import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { loadAdminErrorSummary } from '@/services/adminErrors'
import type { AdminErrorSummary } from '@/types/admin'

export interface UseAdminErrorSummaryResult {
  summary: AdminErrorSummary | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useAdminErrorSummary(): UseAdminErrorSummaryResult {
  const { isAdmin, isAdminLoading } = useAuth()
  const [summary, setSummary] = useState<AdminErrorSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (isAdminLoading || !isAdmin) {
      setSummary(null)
      setLoading(isAdminLoading)
      if (!isAdminLoading) setError(null)
      return
    }

    setLoading(true)
    try {
      setSummary(await loadAdminErrorSummary())
      setError(null)
    } catch {
      setError('Unable to load error summary.')
    } finally {
      setLoading(false)
    }
  }, [isAdmin, isAdminLoading])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- fetch-on-mount idiom; setState occurs after await
    void refresh()
  }, [refresh])

  return { summary, loading, error, refresh }
}
