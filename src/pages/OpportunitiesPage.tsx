import { useCallback, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { OpportunitiesList } from '@/components/opportunities/OpportunitiesList'
import { OpportunityDetail } from '@/components/opportunities/OpportunityDetail'
import { usePageMeta } from '@/hooks/usePageMeta'
import { cn } from '@/lib/utils'
import type { JobStatus } from '@/types/jobs'

/**
 * Upwork-style master-detail workspace.
 *
 * The list is always mounted. Selecting a job only adds `?job=<id>`, so going
 * back never reloads the list, never re-fetches page 1, and never loses the
 * list's scroll position.
 */
export function OpportunitiesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const jobId = searchParams.get('job')
  const isFullPage = searchParams.get('view') === 'full'
  const [jobPatches, setJobPatches] = useState<Record<string, { status?: JobStatus }>>({})
  const [countsRefreshToken, setCountsRefreshToken] = useState(0)
  const listPaneRef = useRef<HTMLElement | null>(null)

  const scrollListToTop = useCallback(() => {
    listPaneRef.current?.scrollTo({ top: 0, behavior: 'auto' })
  }, [])

  usePageMeta({
    title: jobId ? 'Opportunity — Victor Job OS' : 'Opportunities — Victor Job OS',
    description: jobId
      ? 'Review an opportunity fit analysis and company research.'
      : 'Discover the roles worth pursuing.',
    noindex: true,
    path: '/app/opportunities',
  })

  function jobHref(id: string): string {
    const next = new URLSearchParams(searchParams)
    next.set('job', id)
    next.delete('view')
    return `/app/opportunities?${next.toString()}`
  }

  function closeJob(): void {
    const next = new URLSearchParams(searchParams)
    next.delete('job')
    next.delete('view')
    setSearchParams(next, { replace: true })
  }

  function toggleFullPage(): void {
    const next = new URLSearchParams(searchParams)
    if (isFullPage) {
      next.delete('view')
    } else {
      next.set('view', 'full')
    }
    setSearchParams(next, { replace: true })
  }

  function handleJobUpdated(update: { id: string; status: JobStatus }): void {
    setJobPatches((previous) => ({
      ...previous,
      [update.id]: { ...previous[update.id], status: update.status },
    }))
    setCountsRefreshToken((value) => value + 1)
  }

  return (
    <div className="relative flex h-full min-h-0 w-full overflow-hidden">
      <aside
        ref={listPaneRef}
        className={cn(
          'w-full shrink-0 overflow-y-auto bg-background',
          jobId && 'xl:w-[420px] xl:border-r',
        )}
      >
        <OpportunitiesList
          compact={Boolean(jobId)}
          selectedJobId={jobId}
          jobHref={jobHref}
          jobPatches={jobPatches}
          countsRefreshToken={countsRefreshToken}
          onListTop={scrollListToTop}
        />
      </aside>

      {jobId && (
        <section
          key={jobId}
          className={cn(
            'min-w-0 bg-background',
            'absolute inset-0 z-20 overflow-y-auto',
            !isFullPage && 'xl:static xl:z-auto xl:flex-1 xl:border-l',
          )}
        >
          <OpportunityDetail
            jobId={jobId}
            isFullPage={isFullPage}
            onClose={closeJob}
            onToggleFullPage={toggleFullPage}
            onJobUpdated={handleJobUpdated}
          />
        </section>
      )}
    </div>
  )
}
