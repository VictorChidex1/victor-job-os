import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { loadAdminApplicationDetail } from '@/services/adminApplications'
import type { AdminApplicationDetail } from '@/types/admin'

export interface UseAdminApplicationDetailResult {
  detail: AdminApplicationDetail | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useAdminApplicationDetail(
  applicationId?: string,
): UseAdminApplicationDetailResult {
  const { isAdmin, isAdminLoading } = useAuth()
  const [detail, setDetail] = useState<AdminApplicationDetail | null>(null)
  const [loading, setLoading] = useState(Boolean(applicationId))
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!applicationId || isAdminLoading || !isAdmin) {
      setDetail(null)
      setLoading(Boolean(applicationId) && isAdminLoading)
      if (!isAdminLoading) setError(null)
      return
    }
    try {
      const data = await loadAdminApplicationDetail(applicationId)
      setDetail(data)
      setError(null)
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load this application.',
      )
    } finally {
      setLoading(false)
    }
  }, [applicationId, isAdmin, isAdminLoading])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- fetch-on-mount idiom; setState occurs after await
    void refresh()
  }, [refresh])

  return { detail, loading, error, refresh }
}
