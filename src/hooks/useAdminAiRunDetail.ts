import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { loadAdminAiRunDetail } from '@/services/adminAiUsage'
import type { AdminAiRunDetail } from '@/types/admin'

export interface UseAdminAiRunDetailResult {
  detail: AdminAiRunDetail | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useAdminAiRunDetail(
  runId?: string,
): UseAdminAiRunDetailResult {
  const { isAdmin, isAdminLoading } = useAuth()
  const [detail, setDetail] = useState<AdminAiRunDetail | null>(null)
  const [loading, setLoading] = useState(Boolean(runId))
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!runId || isAdminLoading || !isAdmin) {
      setDetail(null)
      setLoading(Boolean(runId) && isAdminLoading)
      if (!isAdminLoading) setError(null)
      return
    }

    try {
      setDetail(await loadAdminAiRunDetail(runId))
      setError(null)
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load this AI run.',
      )
    } finally {
      setLoading(false)
    }
  }, [runId, isAdmin, isAdminLoading])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- fetch-on-mount idiom; setState occurs after await
    void refresh()
  }, [refresh])

  return { detail, loading, error, refresh }
}
