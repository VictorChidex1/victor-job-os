import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { listApplicationEvents } from '@/services/applications'
import type { ApplicationEvent } from '@/types/applications'

export interface UseApplicationEventsResult {
  events: ApplicationEvent[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useApplicationEvents(
  applicationId?: string,
): UseApplicationEventsResult {
  const { user } = useAuth()
  const [events, setEvents] = useState<ApplicationEvent[]>([])
  const [loading, setLoading] = useState(Boolean(applicationId))
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!user || !applicationId) {
      setEvents([])
      setLoading(false)
      return
    }
    try {
      const data = await listApplicationEvents(user.uid, applicationId)
      setEvents(data)
      setError(null)
    } catch {
      setError('Unable to load the application timeline.')
    } finally {
      setLoading(false)
    }
  }, [user, applicationId])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- fetch-on-mount idiom; setState occurs after await
    void refresh()
  }, [refresh])

  return { events, loading, error, refresh }
}
