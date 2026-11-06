import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import {
  loadAdminResumeMetrics,
  type AdminResumeMetrics,
} from '@/services/adminResumes'

export function useAdminResumeMetrics() {
  const { isAdmin, isAdminLoading } = useAuth()
  const [metrics, setMetrics] = useState<AdminResumeMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (isAdminLoading || !isAdmin) {
      setMetrics(null)
      setLoading(isAdminLoading)
      return
    }

    setLoading(true)
    try {
      const data = await loadAdminResumeMetrics()
      setMetrics(data)
    } finally {
      setLoading(false)
    }
  }, [isAdmin, isAdminLoading])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- fetch-on-mount idiom; setState occurs after await
    void refresh()
  }, [refresh])

  return { metrics, loading, refresh }
}

