import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { loadAdminCompanyDetail } from '@/services/adminCompanies'
import type { AdminCompanyDetail } from '@/types/admin'

export interface UseAdminCompanyDetailResult {
  detail: AdminCompanyDetail | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useAdminCompanyDetail(
  companyId?: string,
): UseAdminCompanyDetailResult {
  const { isAdmin, isAdminLoading } = useAuth()
  const [detail, setDetail] = useState<AdminCompanyDetail | null>(null)
  const [loading, setLoading] = useState(Boolean(companyId))
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!companyId || isAdminLoading || !isAdmin) {
      setDetail(null)
      setLoading(Boolean(companyId) && isAdminLoading)
      if (!isAdminLoading) setError(null)
      return
    }
    try {
      const data = await loadAdminCompanyDetail(companyId)
      setDetail(data)
      setError(null)
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load this company.',
      )
    } finally {
      setLoading(false)
    }
  }, [companyId, isAdmin, isAdminLoading])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- fetch-on-mount idiom; setState occurs after await
    void refresh()
  }, [refresh])

  return { detail, loading, error, refresh }
}
