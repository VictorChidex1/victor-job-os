import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { getApplicationForJob } from '@/services/applications'
import type { Application } from '@/types/applications'

export interface UseJobApplicationResult {
  application: Application | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

/** Finds the application created from a specific opportunity. */
export function useJobApplication(jobId?: string): UseJobApplicationResult {
  const { user } = useAuth()
  const [application, setApplication] = useState<Application | null>(null)
  const [loading, setLoading] = useState(Boolean(jobId))
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!user || !jobId) {
      setApplication(null)
      setLoading(false)
      return
    }
    try {
      const data = await getApplicationForJob(user.uid, jobId)
      setApplication(data)
      setError(null)
    } catch {
      setError('Unable to check the application status.')
    } finally {
      setLoading(false)
    }
  }, [user, jobId])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- fetch-on-mount idiom; setState occurs after await
    void refresh()
  }, [refresh])

  return { application, loading, error, refresh }
}
