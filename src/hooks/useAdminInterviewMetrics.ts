import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { loadAdminInterviewMetrics } from '@/services/adminInterviews'
import type { AdminInterviewMetrics } from '@/services/adminInterviews'

export function useAdminInterviewMetrics() {
  const { isAdmin, isAdminLoading } = useAuth()
  const [metrics, setMetrics] = useState<AdminInterviewMetrics>({
    total: 0,
    upcoming: 0,
    completed: 0,
    cancelled: 0,
    noShow: 0,
  })
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (isAdminLoading || !isAdmin) {
      setLoading(isAdminLoading)
      return
    }
    setLoading(true)
    try {
      setMetrics(await loadAdminInterviewMetrics())
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
