import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { listFollowUps } from '@/services/followUps'
import type { FollowUp } from '@/types/outreach'

export interface UseFollowUpsResult {
  items: FollowUp[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useFollowUps(): UseFollowUpsResult {
  const { user } = useAuth()
  const [items, setItems] = useState<FollowUp[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!user) {
      setItems([])
      setLoading(false)
      return
    }
    try {
      const data = await listFollowUps(user.uid)
      setItems(data)
      setError(null)
    } catch {
      setError('Unable to load follow-ups. Please try again.')
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
