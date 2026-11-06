import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import {
  loadAdminApplicationsPage,
  type AdminApplicationQuery,
} from '@/services/adminApplications'
import type { CursorValue } from '@/lib/cursorPagination'
import type { AdminApplication } from '@/types/admin'

export interface UseAdminApplicationsPageResult {
  items: AdminApplication[]
  hasNext: boolean
  nextCursor: CursorValue | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useAdminApplicationsPage(
  input: AdminApplicationQuery,
): UseAdminApplicationsPageResult {
  const { isAdmin, isAdminLoading } = useAuth()
  const { search, status, userId, cursor, pageSize } = input
  const [items, setItems] = useState<AdminApplication[]>([])
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
      const data = await loadAdminApplicationsPage({
        search,
        status,
        userId,
        cursor,
        pageSize,
      })
      setItems(data.items)
      setHasNext(data.hasMore)
      setNextCursor(data.nextCursor)
      setError(null)
    } catch {
      setError('Unable to load applications. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [isAdmin, isAdminLoading, search, status, userId, cursor, pageSize])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- fetch-on-mount idiom; setState occurs after await
    void refresh()
  }, [refresh])

  return { items, hasNext, nextCursor, loading, error, refresh }
}
