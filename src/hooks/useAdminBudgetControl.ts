import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { loadBudgetControl } from '@/services/adminBudgetControl'
import type { BudgetControlState } from '@/types/admin'

export function useAdminBudgetControl() {
  const { isAdmin, isAdminLoading } = useAuth()
  const [control, setControl] = useState<BudgetControlState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!isAdmin || isAdminLoading) {
      setControl(null)
      setLoading(isAdminLoading)
      return
    }
    setLoading(true)
    try {
      setControl(await loadBudgetControl())
      setError(null)
    } catch {
      setError('Unable to load budget control state.')
    } finally {
      setLoading(false)
    }
  }, [isAdmin, isAdminLoading])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- fetch-on-mount idiom; setState occurs after await
    void refresh()
  }, [refresh])

  return { control, loading, error, refresh }
}
