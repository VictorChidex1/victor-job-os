import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import {
  countAdminOpportunities,
  loadAdminOpportunitiesPage,
  type AdminOpportunityQuery,
} from '@/services/adminOpportunities'
import type { CursorValue } from '@/lib/cursorPagination'
import type { AdminOpportunity } from '@/types/admin'

export interface UseAdminOpportunitiesPageResult {
  items: AdminOpportunity[]
  total: number
  hasNext: boolean
  nextCursor: CursorValue | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useAdminOpportunitiesPage(
  input: AdminOpportunityQuery,
): UseAdminOpportunitiesPageResult {
  const { isAdmin, isAdminLoading } = useAuth()
  const { search, status, source, userId, cursor, pageSize } = input
  const [items, setItems] = useState<AdminOpportunity[]>([])
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
        loadAdminOpportunitiesPage({
          search,
          status,
          source,
          userId,
          cursor,
          pageSize,
        }),
        countAdminOpportunities({ search, status, source, userId }),
      ])
      setItems(data.items)
      setTotal(count)
      setHasNext(data.hasMore)
      setNextCursor(data.nextCursor)
      setError(null)
    } catch {
      setError('Unable to load opportunities. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [
    isAdmin,
    isAdminLoading,
    search,
    status,
    source,
    userId,
    cursor,
    pageSize,
  ])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- fetch-on-mount idiom; setState occurs after await
    void refresh()
  }, [refresh])

  return { items, total, hasNext, nextCursor, loading, error, refresh }
}
