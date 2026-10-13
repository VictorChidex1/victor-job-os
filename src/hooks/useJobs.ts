import { useEffect, useState } from 'react'
import { listJobs } from '@/services/jobs'
import { useAuth } from '@/hooks/useAuth'
import type { Job } from '@/types/jobs'

export interface UseJobsResult {
  jobs: Job[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useJobs(): UseJobsResult {
  const { user } = useAuth()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function refresh() {
    if (!user) {
      setJobs([])
      setLoading(false)
      return
    }
    try {
      const data = await listJobs(user.uid)
      setJobs(data)
    } catch {
      setError('Unable to load opportunities. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- fetch-on-mount idiom; setState occurs after await
    void refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  return { jobs, loading, error, refresh }
}
