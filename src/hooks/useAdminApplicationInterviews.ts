import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { loadAdminApplicationInterviews } from '@/services/adminInterviews'
import type { Interview } from '@/types/interviews'

export function useAdminApplicationInterviews(applicationId?: string) {
  const { isAdmin, isAdminLoading } = useAuth()
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [loading, setLoading] = useState(Boolean(applicationId))
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!isAdmin || !applicationId) {
      setInterviews([])
      setLoading(isAdminLoading)
      return
    }
    try {
      setInterviews(await loadAdminApplicationInterviews(applicationId))
      setError(null)
    } catch {
      setError('Unable to load interviews.')
    } finally {
      setLoading(false)
    }
  }, [isAdmin, isAdminLoading, applicationId])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- fetch-on-mount idiom; setState occurs after await
    void refresh()
  }, [refresh])

  return { interviews, loading, error, refresh }
}
