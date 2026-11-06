import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import {
  loadAdminOpportunityMetrics,
  type AdminOpportunityMetrics,
} from '@/services/adminOpportunities'

export function useAdminOpportunityMetrics() {
  const { isAdmin, isAdminLoading } = useAuth()
  const [metrics, setMetrics] = useState<AdminOpportunityMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (isAdminLoading || !isAdmin) {
      setMetrics(null)
      setLoading(isAdminLoading)
      return
    }

    setLoading(true)
    try {
      const data = await loadAdminOpportunityMetrics()
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

