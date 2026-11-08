import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import {
  countAdminErrorLogs,
  loadAdminErrorLogsPage,
  type AdminErrorLogQuery,
} from '@/services/adminErrors'
import type { CursorValue } from '@/lib/cursorPagination'
import type { AdminErrorLog } from '@/types/admin'

export interface UseAdminErrorLogsPageResult {
  items: AdminErrorLog[]
  total: number
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
  const [total, setTotal] = useState(0)
  const [hasNext, setHasNext] = useState(false)
  const [nextCursor, setNextCursor] = useState<CursorValue | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (isAdminLoading || !isAdmin) {
      setItems([])
      setTotal(0)
      setHasNext(false)
      setNextCursor(null)
      setLoading(isAdminLoading)
      if (!isAdminLoading) setError(null)
      return
    }

    setLoading(true)
    try {
      const [data, count] = await Promise.all([
        loadAdminErrorLogsPage({
          fn,
          userId,
          cursor,
          pageSize,
        }),
        countAdminErrorLogs({ fn, userId }),
      ])
      setItems(data.items)
      setTotal(count)
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

  return { items, total, hasNext, nextCursor, loading, error, refresh }
}
