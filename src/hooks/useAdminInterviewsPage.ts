import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import {
  countAdminInterviews,
  loadAdminInterviewsPage,
  type AdminInterviewQuery,
} from '@/services/adminInterviews'
import type { CursorValue } from '@/lib/cursorPagination'
import type { Interview } from '@/types/interviews'

export interface UseAdminInterviewsPageResult {
  items: Interview[]
  total: number
  hasNext: boolean
  nextCursor: CursorValue | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useAdminInterviewsPage(
  input: AdminInterviewQuery,
): UseAdminInterviewsPageResult {
  const { isAdmin, isAdminLoading } = useAuth()
  const { search, status, type, userId, applicationId, from, to, cursor, pageSize } =
    input
  const [items, setItems] = useState<Interview[]>([])
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
        loadAdminInterviewsPage({
          search,
          status,
          type,
          userId,
          applicationId,
          from,
          to,
          cursor,
          pageSize,
        }),
        countAdminInterviews({
          search,
          status,
          type,
          userId,
          applicationId,
          from,
          to,
        }),
      ])
      setItems(data.items)
      setTotal(count)
      setHasNext(data.hasMore)
      setNextCursor(data.nextCursor)
      setError(null)
    } catch {
      setError('Unable to load interviews. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [
    isAdmin,
    isAdminLoading,
    search,
    status,
    type,
    userId,
    applicationId,
    from,
    to,
    cursor,
    pageSize,
  ])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- fetch-on-mount idiom; setState occurs after await
    void refresh()
  }, [refresh])

  return { items, total, hasNext, nextCursor, loading, error, refresh }
}
