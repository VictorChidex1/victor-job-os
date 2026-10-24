import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { PageContainer } from '@/components/layout/PageContainer'
import { EmptyState } from '@/components/states/EmptyState'
import { LoadingState } from '@/components/states/LoadingState'
import { QualifyNewButton } from '@/components/dashboard/QualifyNewButton'
import { useJobCounts } from '@/hooks/useJobCounts'
import { useJobsPage } from '@/hooks/useJobsPage'
import { usePageMeta } from '@/hooks/usePageMeta'
import { SELECTABLE_SOURCE_IDS, SOURCE_LABELS } from '@/lib/job-sources'
import type { Job } from '@/types/jobs'

const statusLabels: Record<string, string> = {
  new: 'New',
  qualified: 'Qualified',
  rejected: 'Rejected',
  archived: 'Archived',
}

function statusVariant(status: string): 'secondary' | 'outline' {
  return status === 'qualified' ? 'secondary' : 'outline'
}

function OpportunityCard({ job }: { job: Job }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-medium text-muted-foreground">
              {job.companyName || job.companyId || 'Unknown company'}
            </div>
            <h3 className="truncate text-base font-semibold text-foreground">{job.title}</h3>
          </div>
          <Badge variant={statusVariant(job.status)} className="shrink-0">
            {statusLabels[job.status] ?? job.status}
          </Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span>
            {job.remote ? 'Remote' : job.location || 'Location unknown'}
            {job.employmentType ? ` · ${job.employmentType}` : ''}
          </span>
          <Badge variant="outline" className="text-[0.6rem]">
            {SOURCE_LABELS[job.source] ?? job.source}
          </Badge>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1">
            {job.skills.slice(0, 4).map((skill) => (
              <Badge key={skill} variant="outline" className="text-[0.65rem]">
                {skill}
              </Badge>
            ))}
          </div>
          <Link
            to={`/app/opportunities/${job.id}`}
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
          >
            Review
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

function PaginationBar({
  page,
  totalPages,
  total,
  isSearch,
  hasPrev,
  hasNext,
  loading,
  onPrev,
  onNext,
}: {
  page: number
  totalPages: number
  total: number
  isSearch: boolean
  hasPrev: boolean
  hasNext: boolean
  loading: boolean
  onPrev: () => void
  onNext: () => void
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-background px-4 py-2">
      <div className="text-xs text-muted-foreground">
        {total} {isSearch ? 'matching ' : ''}
        {total === 1 ? 'job' : 'jobs'} · Page {page} of {totalPages}
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onPrev} disabled={!hasPrev || loading}>
          Previous
        </Button>
        <span className="min-w-[100px] text-center text-sm font-medium">
          Page {page} of {totalPages}
        </span>
        <Button variant="outline" size="sm" onClick={onNext} disabled={!hasNext || loading}>
          Next
        </Button>
      </div>
    </div>
  )
}

export function OpportunitiesPage() {
  usePageMeta({
    title: 'Opportunities — Victor Job OS',
    description: 'Discover the roles worth pursuing.',
    noindex: true,
    path: '/app/opportunities',
  })

  const [searchParams, setSearchParams] = useSearchParams()
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [sourceFilter, setSourceFilter] = useState<string>('all')

  const statusFilter = searchParams.get('status') ?? ''
  const activeStatus = statusFilter && statusLabels[statusFilter] ? statusFilter : ''

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput.trim()), 350)
    return () => clearTimeout(timer)
  }, [searchInput])

  const {
    jobs,
    loading,
    error,
    isSearch,
    page,
    totalPages,
    total,
    hasNext,
    hasPrev,
    nextPage,
    prevPage,
    refresh,
  } = useJobsPage({
    source: sourceFilter !== 'all' ? sourceFilter : undefined,
    status: activeStatus || undefined,
    search: debouncedSearch,
  })
  const { counts } = useJobCounts()

  const title = isSearch
    ? `Search: ${debouncedSearch}`
    : activeStatus
      ? statusLabels[activeStatus] === 'New'
        ? 'New opportunities'
        : `${statusLabels[activeStatus]} opportunities`
      : 'Opportunities'

  function clearStatus() {
    const next = new URLSearchParams(searchParams)
    next.delete('status')
    setSearchParams(next)
  }

  return (
    <PageContainer
      title={title}
      description={
        isSearch
          ? 'Searching all sources. Clear the search to use source filters.'
          : activeStatus
            ? `Showing ${statusLabels[activeStatus].toLowerCase()} roles only.`
            : 'Discover the roles worth pursuing.'
      }
      actions={
        <QualifyNewButton pendingCount={counts.new} onComplete={() => void refresh()} />
      }
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Search roles, companies, locations…"
          className="max-w-sm"
        />
        <div className="flex flex-wrap items-center gap-1">
          {activeStatus && (
            <Button size="sm" variant="ghost" onClick={clearStatus}>
              Clear {statusLabels[activeStatus]} filter
            </Button>
          )}
          {!isSearch && (
            <>
              <Button
                size="sm"
                variant={sourceFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setSourceFilter('all')}
              >
                All sources
              </Button>
              {SELECTABLE_SOURCE_IDS.map((source) => (
                <Button
                  key={source}
                  size="sm"
                  variant={sourceFilter === source ? 'default' : 'outline'}
                  onClick={() => setSourceFilter(source)}
                >
                  {SOURCE_LABELS[source] ?? source}
                </Button>
              ))}
            </>
          )}
        </div>
      </div>

      {loading ? (
        <LoadingState label="Loading opportunities…" rows={5} />
      ) : error ? (
        <EmptyState title="Something went wrong" description={error} />
      ) : jobs.length === 0 ? (
        <EmptyState
          title={isSearch ? 'No matches found' : 'No opportunities found'}
          description={
            isSearch
              ? 'Try a different search term.'
              : 'Try a different source or status, or run discovery from the dashboard.'
          }
        />
      ) : (
        <div className="flex flex-col gap-4">
          <PaginationBar
            page={page}
            totalPages={totalPages}
            total={total}
            isSearch={isSearch}
            hasPrev={hasPrev}
            hasNext={hasNext}
            loading={loading}
            onPrev={() => void prevPage()}
            onNext={() => void nextPage()}
          />
          <div className="grid gap-3 lg:grid-cols-2">
            {jobs.map((job) => (
              <OpportunityCard key={job.id} job={job} />
            ))}
          </div>
          <PaginationBar
            page={page}
            totalPages={totalPages}
            total={total}
            isSearch={isSearch}
            hasPrev={hasPrev}
            hasNext={hasNext}
            loading={loading}
            onPrev={() => void prevPage()}
            onNext={() => void nextPage()}
          />
        </div>
      )}
    </PageContainer>
  )
}
