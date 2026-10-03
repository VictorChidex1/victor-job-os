import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { PageContainer } from '@/components/layout/PageContainer'
import { EmptyState } from '@/components/states/EmptyState'
import { LoadingState } from '@/components/states/LoadingState'
import { useJobs } from '@/hooks/useJobs'
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
        <div className="text-sm text-muted-foreground">
          {job.remote ? 'Remote' : job.location || 'Location unknown'}
          {job.employmentType ? ` · ${job.employmentType}` : ''}
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

export function OpportunitiesPage() {
  const { jobs, loading, error } = useJobs()
  const [search, setSearch] = useState('')
  const [sourceFilter, setSourceFilter] = useState<string>('all')

  const sources = useMemo(() => {
    const values = jobs.map((job) => job.source)
    return ['all', ...Array.from(new Set(values))]
  }, [jobs])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return jobs.filter((job) => {
      if (sourceFilter !== 'all' && job.source !== sourceFilter) return false
      if (!term) return true
      return (
        job.title.toLowerCase().includes(term) ||
        (job.companyName ?? '').toLowerCase().includes(term) ||
        (job.location ?? '').toLowerCase().includes(term)
      )
    })
  }, [jobs, search, sourceFilter])

  return (
    <PageContainer
      title="Opportunities"
      description="Discover the roles worth pursuing."
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search roles, companies, locations…"
          className="max-w-sm"
        />
        <div className="flex flex-wrap gap-1">
          {sources.map((source) => (
            <Button
              key={source}
              size="sm"
              variant={sourceFilter === source ? 'default' : 'outline'}
              onClick={() => setSourceFilter(source)}
            >
              {source === 'all' ? 'All' : source}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingState label="Loading opportunities…" rows={5} />
      ) : error ? (
        <EmptyState title="Something went wrong" description={error} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={jobs.length === 0 ? 'No opportunities yet' : 'No matches found'}
          description={
            jobs.length === 0
              ? 'Run discovery from the dashboard, then opportunities will appear here.'
              : 'Try a different search or clear the filters.'
          }
        />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {filtered.map((job) => (
            <OpportunityCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </PageContainer>
  )
}