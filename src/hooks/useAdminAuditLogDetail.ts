import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { loadAdminAuditLogDetail } from '@/services/adminAuditLogs'
import type { AdminAuditLogDetail } from '@/types/admin'

export interface UseAdminAuditLogDetailResult {
  detail: AdminAuditLogDetail | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useAdminAuditLogDetail(
  auditId?: string,
): UseAdminAuditLogDetailResult {
  const { isAdmin, isAdminLoading } = useAuth()
  const [detail, setDetail] = useState<AdminAuditLogDetail | null>(null)
  const [loading, setLoading] = useState(Boolean(auditId))
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!auditId || isAdminLoading || !isAdmin) {
      setDetail(null)
      setLoading(Boolean(auditId) && isAdminLoading)
      if (!isAdminLoading) setError(null)
      return
    }

    try {
      setDetail(await loadAdminAuditLogDetail(auditId))
      setError(null)
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load this audit entry.',
      )
    } finally {
      setLoading(false)
    }
  }, [auditId, isAdmin, isAdminLoading])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- fetch-on-mount idiom; setState occurs after await
    void refresh()
  }, [refresh])

  return { detail, loading, error, refresh }
}
