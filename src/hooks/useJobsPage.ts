import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import {
  countJobs,
  countSearchJobs,
  listJobsPage,
  searchJobsPage,
} from '@/services/jobs'
import type { CursorValue } from '@/lib/cursorPagination'
import type { Job } from '@/types/jobs'

export interface UseJobsPageOptions {
  source?: string
  status?: string
  companyId?: string
  search?: string
  pageSize?: number
  cursor?: CursorValue | null
}

export interface UseJobsPageResult {
  jobs: Job[]
  loading: boolean
  error: string | null
  isSearch: boolean
  hasNext: boolean
  nextCursor: CursorValue | null
  total: number
  totalPages: number
  refresh: () => Promise<void>
}

export function useJobsPage(options: UseJobsPageOptions = {}): UseJobsPageResult {
  const { user } = useAuth()
  const {
    source,
    status,
    companyId,
    search,
    pageSize = 30,
    cursor = null,
  } = options
  const trimmedSearch = search?.trim() ?? ''

  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasNext, setHasNext] = useState(false)
  const [nextCursor, setNextCursor] = useState<CursorValue | null>(null)
  const [total, setTotal] = useState(0)

  const refresh = useCallback(async () => {
    if (!user) {
      setJobs([])
      setHasNext(false)
      setNextCursor(null)
      setTotal(0)
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const [result, count] = await Promise.all([
        trimmedSearch
          ? searchJobsPage(user.uid, trimmedSearch, {
              pageSize,
              cursorValue: cursor,
            })
          : listJobsPage(user.uid, {
              pageSize,
              cursorValue: cursor,
              source,
              status,
              companyId,
            }),
        trimmedSearch
          ? countSearchJobs(user.uid, trimmedSearch)
          : countJobs(user.uid, { source, status, companyId }),
      ])
      setJobs(result.jobs)
      setHasNext(result.hasMore)
      setNextCursor(result.nextCursor)
      setTotal(count)
      setError(null)
    } catch {
      setError('Unable to load opportunities. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [user, trimmedSearch, pageSize, cursor, source, status, companyId])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- fetch-on-mount idiom; setState occurs after await
    void refresh()
  }, [refresh])

  return {
    jobs,
    loading,
    error,
    isSearch: Boolean(trimmedSearch),
    hasNext,
    nextCursor,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    refresh,
  }
}
