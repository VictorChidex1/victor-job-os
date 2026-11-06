import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import {
  loadAdminOpportunitiesPage,
  type AdminOpportunityQuery,
} from '@/services/adminOpportunities'
import type { AdminOpportunity } from '@/types/admin'

export interface UseAdminOpportunitiesPageResult {
  items: AdminOpportunity[]
  total: number
  totalPages: number
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useAdminOpportunitiesPage(
  input: AdminOpportunityQuery,
): UseAdminOpportunitiesPageResult {
  const { isAdmin, isAdminLoading } = useAuth()
  const { search, status, source, userId, page, pageSize } = input
  const [items, setItems] = useState<AdminOpportunity[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (isAdminLoading || !isAdmin) {
      setItems([])
      setTotal(0)
      setTotalPages(1)
      setLoading(isAdminLoading)
      if (!isAdminLoading) setError(null)
      return
    }

    try {
      const data = await loadAdminOpportunitiesPage({
        search,
        status,
        source,
        userId,
        page,
        pageSize,
      })
      setItems(data.items)
      setTotal(data.total)
      setTotalPages(data.totalPages)
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
    page,
    pageSize,
  ])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- fetch-on-mount idiom; setState occurs after await
    void refresh()
  }, [refresh])

  return { items, total, totalPages, loading, error, refresh }
}
