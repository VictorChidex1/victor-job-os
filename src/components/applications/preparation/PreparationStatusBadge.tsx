import { Badge } from '@/components/ui/badge'
import { PREPARATION_STATUS_LABELS } from '@/lib/applicationPreparation'
import type { PreparationItemStatus } from '@/types/applicationPreparation'

export function PreparationStatusBadge({
  status,
}: {
  status: PreparationItemStatus
}) {
  const variant =
    status === 'approved'
      ? 'secondary'
      : status === 'needs-review'
        ? 'default'
        : 'outline'

  return (
    <Badge variant={variant} className="shrink-0">
      {PREPARATION_STATUS_LABELS[status]}
    </Badge>
  )
}
