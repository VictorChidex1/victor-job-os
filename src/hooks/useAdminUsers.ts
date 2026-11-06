import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { loadAdminUsers } from '@/services/admin'
import type { AdminUserSummary } from '@/types/admin'

export interface UseAdminUsersResult {
  users: AdminUserSummary[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useAdminUsers(): UseAdminUsersResult {
  const { isAdmin, isAdminLoading } = useAuth()
  const [users, setUsers] = useState<AdminUserSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (isAdminLoading || !isAdmin) {
      setUsers([])
      setLoading(isAdminLoading)
      if (!isAdminLoading) setError(null)
      return
    }

    try {
      const data = await loadAdminUsers()
      setUsers(data)
      setError(null)
    } catch {
      setError('Unable to load users. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [isAdmin, isAdminLoading])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- fetch-on-mount idiom; setState occurs after await
    void refresh()
  }, [refresh])

  return { users, loading, error, refresh }
}
