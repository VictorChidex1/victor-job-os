import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import {
  loadAdminAiRunsPage,
  type AdminAiRunQuery,
} from '@/services/adminAiUsage'
import type { CursorValue } from '@/lib/cursorPagination'
import type { AdminAiRun } from '@/types/admin'

export interface UseAdminAiRunsPageResult {
  items: AdminAiRun[]
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
      const data = await loadAdminAiRunsPage({
        status,
        operation,
        userId,
        cursor,
        pageSize,
      })
      setItems(data.items)
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

  return { items, hasNext, nextCursor, loading, error, refresh }
}
