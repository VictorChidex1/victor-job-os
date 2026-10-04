import { useEffect, useState } from 'react'
import { getAnalysisForJob } from '@/services/jobAnalyses'
import type { JobAnalysis } from '@/types/jobs'

export interface UseJobAnalysisResult {
  analysis: JobAnalysis | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useJobAnalysis(jobId: string | undefined): UseJobAnalysisResult {
  const [analysis, setAnalysis] = useState<JobAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function refresh() {
    if (!jobId) {
      setAnalysis(null)
      setLoading(false)
      return
    }
    try {
      const data = await getAnalysisForJob(jobId)
      setAnalysis(data)
      setError(null)
    } catch {
      setError('Unable to load the fit analysis.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!jobId) {
      // oxlint-disable-next-line react/set-state-in-effect -- no-id branch clears loading synchronously
      setLoading(false)
      return
    }
    let active = true
    getAnalysisForJob(jobId)
      .then((data) => {
        if (active) setAnalysis(data)
      })
      .catch(() => {
        if (active) setError('Unable to load the fit analysis.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [jobId])

  return { analysis, loading, error, refresh }
}