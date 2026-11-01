import { useCallback, useEffect, useState } from 'react'
import { getApplication } from '@/services/applications'
import type { Application } from '@/types/applications'

export interface UseApplicationResult {
  application: Application | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useApplication(id?: string): UseApplicationResult {
  const [application, setApplication] = useState<Application | null>(null)
  const [loading, setLoading] = useState(Boolean(id))
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!id) {
      setApplication(null)
      setLoading(false)
      return
    }
    try {
      const data = await getApplication(id)
      setApplication(data)
      setError(null)
    } catch {
      setError('Unable to load this application. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- fetch-on-mount idiom; setState occurs after await
    void refresh()
  }, [refresh])

  return { application, loading, error, refresh }
}
