import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { getJobCounts, type JobCounts } from '@/services/jobs'

const emptyCounts: JobCounts = { total: 0, new: 0, qualified: 0, rejected: 0 }

export interface UseJobCountsResult {
  counts: JobCounts
  loading: boolean
  refresh: () => Promise<void>
}

export function useJobCounts(): UseJobCountsResult {
  const { user } = useAuth()
  const [counts, setCounts] = useState<JobCounts>(emptyCounts)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!user) {
      setCounts(emptyCounts)
      setLoading(false)
      return
    }
    try {
      setCounts(await getJobCounts(user.uid))
    } catch {
      // Keep the previous counts on transient failure.
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- fetch-on-mount idiom; setState occurs after await
    void refresh()
  }, [refresh])

  return { counts, loading, refresh }
}
