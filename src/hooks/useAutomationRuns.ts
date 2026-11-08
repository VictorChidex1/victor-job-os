import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { listAutomationRuns } from '@/services/automation'
import type { AutomationRun } from '@/types/automation'

export function useAutomationRuns() {
  const { user } = useAuth()
  const [runs, setRuns] = useState<AutomationRun[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!user) {
      setRuns([])
      setLoading(false)
      return
    }
    try {
      setRuns(await listAutomationRuns(user.uid))
      setError(null)
    } catch {
      setError('Unable to load automation activity.')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- fetch-on-mount idiom; setState occurs after await
    void refresh()
  }, [refresh])

  return { runs, loading, error, refresh }
}
