import { useCallback, useEffect, useRef, useState } from 'react'
import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore'
import { useAuth } from '@/hooks/useAuth'
import { countJobs, countSearchJobs, listJobsPage, searchJobsPage } from '@/services/jobs'
import type { Job } from '@/types/jobs'

export interface UseJobsPageOptions {
  source?: string
  status?: string
  companyId?: string
  search?: string
  pageSize?: number
  /** Skip the total-count query (e.g. for a small "recent" list). */
  skipCount?: boolean
}

export interface UseJobsPageResult {
  jobs: Job[]
  loading: boolean
  error: string | null
  isSearch: boolean
  page: number
  totalPages: number
  total: number
  hasNext: boolean
  hasPrev: boolean
  nextPage: () => Promise<void>
  prevPage: () => Promise<void>
  refresh: () => Promise<void>
}

export function useJobsPage(options: UseJobsPageOptions = {}): UseJobsPageResult {
  const { user } = useAuth()
  const { source, status, companyId, search, pageSize = 50, skipCount = false } = options
  const trimmedSearch = search?.trim() ?? ''

  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)

  // Cursor for the first document of each visited page (page 1 = null).
  const cursorsRef = useRef<Map<number, QueryDocumentSnapshot<DocumentData> | null>>(
    new Map([[1, null]]),
  )
  const requestRef = useRef(0)

  const loadPage = useCallback(
    async (pageNumber: number, cursor: QueryDocumentSnapshot<DocumentData> | null) => {
      if (!user) {
        setJobs([])
        setTotal(0)
        setHasMore(false)
        setLoading(false)
        return
      }
      const requestId = ++requestRef.current
      setLoading(true)
      try {
        const pagePromise = trimmedSearch
          ? searchJobsPage(user.uid, trimmedSearch, { pageSize, cursor })
          : listJobsPage(user.uid, { pageSize, cursor, source, status, companyId })
        const countPromise = skipCount
          ? Promise.resolve(0)
          : trimmedSearch
            ? countSearchJobs(user.uid, trimmedSearch)
            : countJobs(user.uid, { source, status, companyId })

        const [result, count] = await Promise.all([pagePromise, countPromise])
        if (requestId !== requestRef.current) {
          return
        }
        setJobs(result.jobs)
        setHasMore(result.hasMore)
        setTotal(count)
        setPage(pageNumber)
        cursorsRef.current.set(pageNumber + 1, result.cursor)
        setError(null)
      } catch {
        if (requestId === requestRef.current) {
          setError('Unable to load opportunities. Please try again.')
        }
      } finally {
        if (requestId === requestRef.current) {
          setLoading(false)
        }
      }
    },
    [user, trimmedSearch, pageSize, source, status, companyId, skipCount],
  )

  // Reset to page 1 whenever the filters/search (or user) change.
  useEffect(() => {
    cursorsRef.current = new Map([[1, null]])
    // oxlint-disable-next-line react/set-state-in-effect -- fetch-on-mount idiom; setState occurs after await
    void loadPage(1, null)
  }, [loadPage])

  const nextPage = useCallback(async () => {
    if (!hasMore) {
      return
    }
    const cursor = cursorsRef.current.get(page + 1) ?? null
    await loadPage(page + 1, cursor)
  }, [hasMore, page, loadPage])

  const prevPage = useCallback(async () => {
    if (page <= 1) {
      return
    }
    const cursor = cursorsRef.current.get(page - 1) ?? null
    await loadPage(page - 1, cursor)
  }, [page, loadPage])

  const refresh = useCallback(async () => {
    cursorsRef.current = new Map([[1, null]])
    await loadPage(1, null)
  }, [loadPage])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return {
    jobs,
    loading,
    error,
    isSearch: Boolean(trimmedSearch),
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
