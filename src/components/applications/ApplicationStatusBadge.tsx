import { Badge } from '@/components/ui/badge'
import { APPLICATION_STATUS_LABELS } from '@/lib/applications'
import { cn } from '@/lib/utils'
import type { ApplicationOutcome, ApplicationStatus } from '@/types/applications'

function applicationStatusVariant(status: ApplicationStatus) {
  if (status === 'offer') return 'default' as const
  if (status === 'rejected' || status === 'withdrawn') return 'destructive' as const
  if (
    status === 'submitted' ||
    status === 'assessment' ||
    status === 'interview' ||
    status === 'approved'
  ) {
    return 'secondary' as const
  }
  return 'outline' as const
}

interface ApplicationStatusBadgeProps {
  status: ApplicationStatus
  outcome?: ApplicationOutcome
  className?: string
}

export function ApplicationStatusBadge({
  status,
  outcome,
  className,
}: ApplicationStatusBadgeProps) {
  return (
    <span className={cn('inline-flex flex-wrap items-center gap-1', className)}>
      <Badge variant={applicationStatusVariant(status)}>
        {APPLICATION_STATUS_LABELS[status]}
      </Badge>
      {outcome && (
        <Badge variant="outline" className="capitalize">
          {outcome}
        </Badge>
      )}
    </span>
  )
}
