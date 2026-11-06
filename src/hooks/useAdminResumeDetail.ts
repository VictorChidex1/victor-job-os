import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { loadAdminResumeDetail } from '@/services/adminResumes'
import type { AdminResumeDetail } from '@/types/admin'

export interface UseAdminResumeDetailResult {
  detail: AdminResumeDetail | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useAdminResumeDetail(
  resumeId?: string,
): UseAdminResumeDetailResult {
  const { isAdmin, isAdminLoading } = useAuth()
  const [detail, setDetail] = useState<AdminResumeDetail | null>(null)
  const [loading, setLoading] = useState(Boolean(resumeId))
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!resumeId || isAdminLoading || !isAdmin) {
      setDetail(null)
      setLoading(Boolean(resumeId) && isAdminLoading)
      if (!isAdminLoading) setError(null)
      return
    }
    try {
      const data = await loadAdminResumeDetail(resumeId)
      setDetail(data)
      setError(null)
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load this resume variant.',
      )
    } finally {
      setLoading(false)
    }
  }, [resumeId, isAdmin, isAdminLoading])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- fetch-on-mount idiom; setState occurs after await
    void refresh()
  }, [refresh])

  return { detail, loading, error, refresh }
}
