import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { listInterviewsForApplication } from '@/services/interviews'
import type { Interview } from '@/types/interviews'

export function useApplicationInterviews(applicationId?: string) {
  const { user } = useAuth()
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [loading, setLoading] = useState(Boolean(applicationId))
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!user || !applicationId) {
      setInterviews([])
      setLoading(false)
      return
    }
    try {
      setInterviews(await listInterviewsForApplication(user.uid, applicationId))
      setError(null)
    } catch {
      setError('Unable to load interviews.')
    } finally {
      setLoading(false)
    }
  }, [user, applicationId])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- fetch-on-mount idiom; setState occurs after await
    void refresh()
  }, [refresh])

  return { interviews, loading, error, refresh }
}
