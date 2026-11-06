import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { loadAdminErrorLogDetail } from '@/services/adminErrors'
import type { AdminErrorLogDetail } from '@/types/admin'

export interface UseAdminErrorLogDetailResult {
  detail: AdminErrorLogDetail | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useAdminErrorLogDetail(
  errorId?: string,
): UseAdminErrorLogDetailResult {
  const { isAdmin, isAdminLoading } = useAuth()
  const [detail, setDetail] = useState<AdminErrorLogDetail | null>(null)
  const [loading, setLoading] = useState(Boolean(errorId))
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!errorId || isAdminLoading || !isAdmin) {
      setDetail(null)
      setLoading(Boolean(errorId) && isAdminLoading)
      if (!isAdminLoading) setError(null)
      return
    }

    try {
      setDetail(await loadAdminErrorLogDetail(errorId))
      setError(null)
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load this error log.',
      )
    } finally {
      setLoading(false)
    }
  }, [errorId, isAdmin, isAdminLoading])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- fetch-on-mount idiom; setState occurs after await
    void refresh()
  }, [refresh])

  return { detail, loading, error, refresh }
}
