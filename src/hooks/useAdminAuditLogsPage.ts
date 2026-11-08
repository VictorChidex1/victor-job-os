import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import {
  countAdminAuditLogs,
  loadAdminAuditLogsPage,
  type AdminAuditLogQuery,
} from '@/services/adminAuditLogs'
import type { CursorValue } from '@/lib/cursorPagination'
import type { AdminAuditLog } from '@/types/admin'

export interface UseAdminAuditLogsPageResult {
  items: AdminAuditLog[]
  total: number
  hasNext: boolean
  nextCursor: CursorValue | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useAdminAuditLogsPage(
  input: AdminAuditLogQuery,
): UseAdminAuditLogsPageResult {
  const { isAdmin, isAdminLoading } = useAuth()
  const { action, actorUid, targetUid, cursor, pageSize } = input
  const [items, setItems] = useState<AdminAuditLog[]>([])
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
        loadAdminAuditLogsPage({
          action,
          actorUid,
          targetUid,
          cursor,
          pageSize,
        }),
        countAdminAuditLogs({ action, actorUid, targetUid }),
      ])
      setItems(data.items)
      setTotal(count)
      setHasNext(data.hasMore)
      setNextCursor(data.nextCursor)
      setError(null)
    } catch {
      setError('Unable to load admin audit logs. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [isAdmin, isAdminLoading, action, actorUid, targetUid, cursor, pageSize])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- fetch-on-mount idiom; setState occurs after await
    void refresh()
  }, [refresh])

  return { items, total, hasNext, nextCursor, loading, error, refresh }
}
