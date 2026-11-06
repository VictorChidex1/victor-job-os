import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import {
  loadAdminErrorLogsPage,
  type AdminErrorLogQuery,
} from '@/services/adminErrors'
import type { CursorValue } from '@/lib/cursorPagination'
import type { AdminErrorLog } from '@/types/admin'

export interface UseAdminErrorLogsPageResult {
  items: AdminErrorLog[]
  hasNext: boolean
  nextCursor: CursorValue | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useAdminErrorLogsPage(
  input: AdminErrorLogQuery,
): UseAdminErrorLogsPageResult {
  const { isAdmin, isAdminLoading } = useAuth()
  const { fn, userId, cursor, pageSize } = input
  const [items, setItems] = useState<AdminErrorLog[]>([])
  const [hasNext, setHasNext] = useState(false)
  const [nextCursor, setNextCursor] = useState<CursorValue | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (isAdminLoading || !isAdmin) {
      setItems([])
      setHasNext(false)
      setNextCursor(null)
      setLoading(isAdminLoading)
      if (!isAdminLoading) setError(null)
      return
    }

    setLoading(true)
    try {
      const data = await loadAdminErrorLogsPage({
        fn,
        userId,
        cursor,
        pageSize,
      })
      setItems(data.items)
      setHasNext(data.hasMore)
      setNextCursor(data.nextCursor)
      setError(null)
    } catch {
      setError('Unable to load error logs. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [isAdmin, isAdminLoading, fn, userId, cursor, pageSize])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- fetch-on-mount idiom; setState occurs after await
    void refresh()
  }, [refresh])

  return { items, hasNext, nextCursor, loading, error, refresh }
}
