import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { loadAdminAiSummary } from '@/services/adminAiUsage'
import type { AdminAiSummary } from '@/types/admin'

export interface UseAdminAiSummaryResult {
  summary: AdminAiSummary | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useAdminAiSummary(): UseAdminAiSummaryResult {
  const { isAdmin, isAdminLoading } = useAuth()
  const [summary, setSummary] = useState<AdminAiSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (isAdminLoading || !isAdmin) {
      setSummary(null)
      setLoading(isAdminLoading)
      if (!isAdminLoading) setError(null)
      return
    }

    setLoading(true)
    try {
      setSummary(await loadAdminAiSummary())
      setError(null)
    } catch {
      setError('Unable to load AI usage summary.')
    } finally {
      setLoading(false)
    }
  }, [isAdmin, isAdminLoading])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- fetch-on-mount idiom; setState occurs after await
    void refresh()
  }, [refresh])

  return { summary, loading, error, refresh }
}
