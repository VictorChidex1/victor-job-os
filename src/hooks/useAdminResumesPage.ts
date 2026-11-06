import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { loadAdminResumesPage, type AdminResumeQuery } from '@/services/adminResumes'
import type { CursorValue } from '@/lib/cursorPagination'
import type { AdminResume } from '@/types/admin'

export interface UseAdminResumesPageResult {
  items: AdminResume[]
  hasNext: boolean
  nextCursor: CursorValue | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useAdminResumesPage(
  input: AdminResumeQuery,
): UseAdminResumesPageResult {
  const { isAdmin, isAdminLoading } = useAuth()
  const { search, defaultFilter, userId, cursor, pageSize } = input
  const [items, setItems] = useState<AdminResume[]>([])
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
      const data = await loadAdminResumesPage({
        search,
        defaultFilter,
        userId,
        cursor,
        pageSize,
      })
      setItems(data.items)
      setHasNext(data.hasMore)
      setNextCursor(data.nextCursor)
      setError(null)
    } catch {
      setError('Unable to load resume variants. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [isAdmin, isAdminLoading, search, defaultFilter, userId, cursor, pageSize])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- fetch-on-mount idiom; setState occurs after await
    void refresh()
  }, [refresh])

  return { items, hasNext, nextCursor, loading, error, refresh }
}
