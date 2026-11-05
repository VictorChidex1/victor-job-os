import { useEffect, useState } from 'react'
import { getJob } from '@/services/jobs'
import type { Job } from '@/types/jobs'

export interface UseJobResult {
  job: Job | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useJob(jobId: string | undefined): UseJobResult {
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(Boolean(jobId))
  const [error, setError] = useState<string | null>(null)

  async function refresh() {
    if (!jobId) {
      setJob(null)
      setLoading(false)
      return
    }
    try {
      const data = await getJob(jobId)
      setJob(data)
      setError(null)
    } catch {
      setError('Unable to load the opportunity context.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!jobId) {
      // oxlint-disable-next-line react/set-state-in-effect -- clear state when no id
      setJob(null)
      // oxlint-disable-next-line react/set-state-in-effect -- clear state when no id
      setLoading(false)
      return
    }
    let active = true
    getJob(jobId)
      .then((data) => {
        if (active) {
          setJob(data)
          setError(null)
        }
      })
      .catch(() => {
        if (active) setError('Unable to load the opportunity context.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [jobId])

  return { job, loading, error, refresh }
}
