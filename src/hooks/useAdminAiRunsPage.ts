import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import {
  countAdminAiRuns,
  loadAdminAiRunsPage,
  type AdminAiRunQuery,
} from '@/services/adminAiUsage'
import type { CursorValue } from '@/lib/cursorPagination'
import type { AdminAiRun } from '@/types/admin'

export interface UseAdminAiRunsPageResult {
  items: AdminAiRun[]
  total: number
  hasNext: boolean
  nextCursor: CursorValue | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useAdminAiRunsPage(
  input: AdminAiRunQuery,
): UseAdminAiRunsPageResult {
  const { isAdmin, isAdminLoading } = useAuth()
  const { status, operation, userId, cursor, pageSize } = input
  const [items, setItems] = useState<AdminAiRun[]>([])
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
        loadAdminAiRunsPage({
          status,
          operation,
          userId,
          cursor,
          pageSize,
        }),
        countAdminAiRuns({ status, operation, userId }),
      ])
      setItems(data.items)
      setTotal(count)
      setHasNext(data.hasMore)
      setNextCursor(data.nextCursor)
      setError(null)
    } catch {
      setError('Unable to load AI runs. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [isAdmin, isAdminLoading, status, operation, userId, cursor, pageSize])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- fetch-on-mount idiom; setState occurs after await
    void refresh()
  }, [refresh])

  return { items, total, hasNext, nextCursor, loading, error, refresh }
}
