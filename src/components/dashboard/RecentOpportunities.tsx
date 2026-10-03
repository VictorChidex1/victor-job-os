import { Link } from 'react-router'
import { Badge } from '@/components/ui/badge'
import { LoadingState } from '@/components/states/LoadingState'
import { EmptyState } from '@/components/states/EmptyState'
import type { Job } from '@/types/jobs'

interface RecentOpportunitiesProps {
  jobs: Job[]
  loading: boolean
}

export function RecentOpportunities({ jobs, loading }: RecentOpportunitiesProps) {
  if (loading) {
    return <LoadingState label="Loading recent opportunities…" rows={3} />
  }

  if (jobs.length === 0) {
    return (
      <EmptyState
        title="No opportunities yet"
        description="Run discovery from the actions above, then roles appear here."
      />
    )
  }

  return (
    <div className="flex flex-col divide-y divide-border/50 overflow-hidden rounded-2xl border border-border/60 bg-background shadow-sm">
      {jobs.slice(0, 5).map((job) => (
        <Link
          key={job.id}
          to={`/app/opportunities/${job.id}`}
          className="flex items-center gap-4 p-4 transition-colors hover:bg-muted/40"
        >
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="truncate text-sm font-medium text-foreground">{job.title}</span>
            <span className="truncate text-xs text-muted-foreground">
              {job.companyName || 'Unknown'} · {job.remote ? 'Remote' : job.location || '—'}
            </span>
          </div>
          <Badge variant={job.status === 'qualified' ? 'secondary' : 'outline'} className="shrink-0">
            {job.status}
          </Badge>
        </Link>
      ))}
    </div>
  )
}