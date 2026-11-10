import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { listUpcomingInterviews } from '@/services/interviews'
import type { Interview } from '@/types/interviews'

export function useUpcomingInterviews(limitCount = 5) {
  const { user } = useAuth()
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!user) {
      setInterviews([])
      setLoading(false)
      return
    }
    try {
      setInterviews(await listUpcomingInterviews(user.uid, limitCount))
      setError(null)
    } catch {
      setError('Unable to load upcoming interviews.')
    } finally {
      setLoading(false)
    }
  }, [user, limitCount])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- fetch-on-mount idiom; setState occurs after await
    void refresh()
  }, [refresh])

  return { interviews, loading, error, refresh }
}
