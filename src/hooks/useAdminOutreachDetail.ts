import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { loadAdminOutreachDetail } from '@/services/adminOutreach'
import type { AdminOutreachDetail } from '@/types/admin'

export interface UseAdminOutreachDetailResult {
  detail: AdminOutreachDetail | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useAdminOutreachDetail(
  outreachId?: string,
): UseAdminOutreachDetailResult {
  const { isAdmin, isAdminLoading } = useAuth()
  const [detail, setDetail] = useState<AdminOutreachDetail | null>(null)
  const [loading, setLoading] = useState(Boolean(outreachId))
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!outreachId || isAdminLoading || !isAdmin) {
      setDetail(null)
      setLoading(Boolean(outreachId) && isAdminLoading)
      if (!isAdminLoading) setError(null)
      return
    }
    try {
      const data = await loadAdminOutreachDetail(outreachId)
      setDetail(data)
      setError(null)
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load this outreach.',
      )
    } finally {
      setLoading(false)
    }
  }, [outreachId, isAdmin, isAdminLoading])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- fetch-on-mount idiom; setState occurs after await
    void refresh()
  }, [refresh])

  return { detail, loading, error, refresh }
}
