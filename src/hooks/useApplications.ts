import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { listApplications } from '@/services/applications'
import type { Application } from '@/types/applications'

export interface UseApplicationsResult {
  items: Application[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useApplications(): UseApplicationsResult {
  const { user } = useAuth()
  const [items, setItems] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!user) {
      setItems([])
      setLoading(false)
      return
    }
    try {
      const data = await listApplications(user.uid)
      setItems(data)
      setError(null)
    } catch {
      setError('Unable to load applications. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- fetch-on-mount idiom; setState occurs after await
    void refresh()
  }, [refresh])

  return { items, loading, error, refresh }
}
