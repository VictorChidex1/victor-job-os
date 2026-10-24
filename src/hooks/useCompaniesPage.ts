import { useCallback, useEffect, useRef, useState } from 'react'
import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore'
import { useAuth } from '@/hooks/useAuth'
import {
  countCompanies,
  listCompaniesPage,
  type CompanyResearchFilter,
} from '@/services/companies'
import type { Company } from '@/types/companies'

export interface UseCompaniesPageOptions {
  search?: string
  research?: CompanyResearchFilter
  pageSize?: number
}

export interface UseCompaniesPageResult {
  companies: Company[]
  loading: boolean
  error: string | null
  page: number
  totalPages: number
  total: number
  hasNext: boolean
  hasPrev: boolean
  nextPage: () => Promise<void>
  prevPage: () => Promise<void>
  refresh: () => Promise<void>
}

export function useCompaniesPage(options: UseCompaniesPageOptions = {}): UseCompaniesPageResult {
  const { user } = useAuth()
  const { search, research = 'all', pageSize = 30 } = options
  const trimmedSearch = search?.trim() ?? ''

  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)

  const cursorsRef = useRef<Map<number, QueryDocumentSnapshot<DocumentData> | null>>(
    new Map([[1, null]]),
  )
  const requestRef = useRef(0)

  const loadPage = useCallback(
    async (pageNumber: number, cursor: QueryDocumentSnapshot<DocumentData> | null) => {
      if (!user) {
        setCompanies([])
        setTotal(0)
        setHasMore(false)
        setLoading(false)
        return
      }
      const requestId = ++requestRef.current
      setLoading(true)
      try {
        const [result, count] = await Promise.all([
          listCompaniesPage(user.uid, {
            pageSize,
            cursor,
            search: trimmedSearch,
            research,
          }),
          countCompanies(user.uid, { search: trimmedSearch, research }),
        ])
        if (requestId !== requestRef.current) {
          return
        }
        setCompanies(result.companies)
        setHasMore(result.hasMore)
        setTotal(count)
        setPage(pageNumber)
        cursorsRef.current.set(pageNumber + 1, result.cursor)
        setError(null)
      } catch {
        if (requestId === requestRef.current) {
          setError('Unable to load companies. Please try again.')
        }
      } finally {
        if (requestId === requestRef.current) {
          setLoading(false)
        }
      }
    },
    [user, trimmedSearch, research, pageSize],
  )

  useEffect(() => {
    cursorsRef.current = new Map([[1, null]])
    // oxlint-disable-next-line react/set-state-in-effect -- fetch-on-mount idiom; setState occurs after await
    void loadPage(1, null)
  }, [loadPage])

  const nextPage = useCallback(async () => {
    if (!hasMore) {
      return
    }
    await loadPage(page + 1, cursorsRef.current.get(page + 1) ?? null)
  }, [hasMore, page, loadPage])

  const prevPage = useCallback(async () => {
    if (page <= 1) {
      return
    }
    await loadPage(page - 1, cursorsRef.current.get(page - 1) ?? null)
  }, [page, loadPage])

  const refresh = useCallback(async () => {
    cursorsRef.current = new Map([[1, null]])
    await loadPage(1, null)
  }, [loadPage])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return {
    companies,
    loading,
    error,
    page,
    totalPages,
    total,
    hasNext: hasMore,
    hasPrev: page > 1,
    nextPage,
    prevPage,
    refresh,
  }
}
