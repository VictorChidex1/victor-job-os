import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { listOutreach } from '@/services/outreach'
import type { Outreach } from '@/types/outreach'

export interface UseOutreachResult {
  items: Outreach[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useOutreach(): UseOutreachResult {
  const { user } = useAuth()
  const [items, setItems] = useState<Outreach[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!user) {
      setItems([])
      setLoading(false)
      return
    }
    try {
      const data = await listOutreach(user.uid)
      setItems(data)
      setError(null)
    } catch {
      setError('Unable to load outreach. Please try again.')
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
