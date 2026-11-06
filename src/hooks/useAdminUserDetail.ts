import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { loadAdminUserDetail } from '@/services/admin'
import type { AdminUserDetail } from '@/types/admin'

export interface UseAdminUserDetailResult {
  detail: AdminUserDetail | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useAdminUserDetail(uid?: string): UseAdminUserDetailResult {
  const { isAdmin, isAdminLoading } = useAuth()
  const [detail, setDetail] = useState<AdminUserDetail | null>(null)
  const [loading, setLoading] = useState(Boolean(uid))
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!uid || isAdminLoading || !isAdmin) {
      setDetail(null)
      setLoading(Boolean(uid) && isAdminLoading)
      if (!isAdminLoading) setError(null)
      return
    }
    try {
      const data = await loadAdminUserDetail(uid)
      setDetail(data)
      setError(null)
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : 'Unable to load this user.',
      )
    } finally {
      setLoading(false)
    }
  }, [uid, isAdmin, isAdminLoading])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- fetch-on-mount idiom; setState occurs after await
    void refresh()
  }, [refresh])

  return { detail, loading, error, refresh }
}
