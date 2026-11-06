import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { loadAdminOpportunityDetail } from '@/services/adminOpportunities'
import type { AdminOpportunityDetail } from '@/types/admin'

export interface UseAdminOpportunityDetailResult {
  detail: AdminOpportunityDetail | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useAdminOpportunityDetail(
  jobId?: string,
): UseAdminOpportunityDetailResult {
  const { isAdmin, isAdminLoading } = useAuth()
  const [detail, setDetail] = useState<AdminOpportunityDetail | null>(null)
  const [loading, setLoading] = useState(Boolean(jobId))
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!jobId || isAdminLoading || !isAdmin) {
      setDetail(null)
      setLoading(Boolean(jobId) && isAdminLoading)
      if (!isAdminLoading) setError(null)
      return
    }
    try {
      const data = await loadAdminOpportunityDetail(jobId)
      setDetail(data)
      setError(null)
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load this opportunity.',
      )
    } finally {
      setLoading(false)
    }
  }, [jobId, isAdmin, isAdminLoading])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- fetch-on-mount idiom; setState occurs after await
    void refresh()
  }, [refresh])

  return { detail, loading, error, refresh }
}
