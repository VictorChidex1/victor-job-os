import { useState } from 'react'
import type { ReactNode } from 'react'
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  LockKeyhole,
  TriangleAlert,
} from 'lucide-react'
import { toast } from 'sonner'
import { ApplicationStatusBadge } from '@/components/applications/ApplicationStatusBadge'
import { PreparationStatusBadge } from '@/components/applications/preparation/PreparationStatusBadge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import {
  isPreparationReadOnly,
  preparationAnswerCount,
  preparationApprovedAnswerCount,
  preparationPendingItems,
} from '@/lib/applicationPreparation'
import { APPLICATION_STATUS_LABELS } from '@/lib/applications'
import { updateApplicationStatus } from '@/services/applications'
import type { Application, ApplicationStatus } from '@/types/applications'
import type { ApplicationPreparation } from '@/types/applicationPreparation'

export function PreparationReview({
  application,
  preparation,
  onChanged,
}: {
  application: Application
  preparation: ApplicationPreparation
  onChanged: () => Promise<void>
}) {
  const { user } = useAuth()
  const [updating, setUpdating] = useState(false)
  const readOnly = isPreparationReadOnly(application.status)
  const pending = preparationPendingItems(preparation)
  const answerCount = preparationAnswerCount(preparation)
  const approvedAnswers = preparationApprovedAnswerCount(preparation)
  const canApprove = pending.length === 0

  async function move(next: ApplicationStatus) {
    if (!user) return
    setUpdating(true)
    try {
      await updateApplicationStatus(user.uid, application.id, next)
      await onChanged()
      toast(`Application moved to ${APPLICATION_STATUS_LABELS[next]}`)
    } catch (error) {
      toast('Unable to update the application stage', {
        description:
          error instanceof Error ? error.message : 'Please try again.',
      })
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-sm">Preparation review</CardTitle>
              <CardDescription>
                Check the content, then move the application through the review gates.
              </CardDescription>
            </div>
            <ApplicationStatusBadge
              status={application.status}
              outcome={application.outcome}
            />
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-2 sm:grid-cols-2">
            <ReviewRow
              label="Resume reviewed"
              complete={preparation.resumeReviewed}
              detail={
                preparation.resumeReviewed
                  ? 'Marked reviewed'
                  : 'Review the resume step when ready'
              }
            />
            <ReviewRow
              label="Cover letter"
              complete={
                !preparation.coverLetter.body.trim() ||
                preparation.coverLetter.status === 'approved'
              }
              detail={
                preparation.coverLetter.body.trim()
                  ? 'Draft saved'
                  : 'Not provided (optional)'
              }
              badge={<PreparationStatusBadge status={preparation.coverLetter.status} />}
            />
            <ReviewRow
              label="Application answers"
              complete={answerCount === 0 || approvedAnswers === answerCount}
              detail={
                answerCount === 0
                  ? 'No questions added'
                  : `${approvedAnswers} of ${answerCount} approved`
              }
            />
            <ReviewRow
              label="Pending items"
              complete={pending.length === 0}
              detail={
                pending.length === 0
                  ? 'Nothing waiting for review'
                  : `${pending.length} item${pending.length === 1 ? '' : 's'} need review`
              }
              warning={pending.length > 0}
            />
          </div>

          {pending.length > 0 && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-sm text-muted-foreground">
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-300" />
              <div>
                <span className="font-medium text-foreground">Before approval:</span>{' '}
                approve or remove these preparation items: {pending.join(', ')}.
              </div>
            </div>
          )}

          {readOnly ? (
            <div className="flex items-start gap-2 rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
              <LockKeyhole className="mt-0.5 size-4 shrink-0" />
              <div>
                <span className="font-medium text-foreground">Preparation is locked.</span>{' '}
                This application is already{' '}
                {APPLICATION_STATUS_LABELS[application.status].toLowerCase()}. The approved
                content cannot be edited from this workspace.
              </div>
            </div>
          ) : (
            <div className="rounded-xl border bg-muted/20 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-foreground">
                    Current stage: {APPLICATION_STATUS_LABELS[application.status]}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Preparation changes do not move the application automatically.
                  </p>
                </div>
                {application.status === 'not-started' && (
                  <Button
                    size="sm"
                    onClick={() => void move('preparing')}
                    disabled={updating}
                  >
                    Start preparation
                    <ArrowRight />
                  </Button>
                )}
                {application.status === 'preparing' && (
                  <Button
                    size="sm"
                    onClick={() => void move('needs-review')}
                    disabled={updating}
                  >
                    Mark ready for review
                    <ArrowRight />
                  </Button>
                )}
                {application.status === 'needs-review' && (
                  <Button
                    size="sm"
                    onClick={() => void move('approved')}
                    disabled={updating || !canApprove}
                  >
                    Approve application
                    <ArrowRight />
                  </Button>
                )}
              </div>
              {application.status === 'needs-review' && !canApprove && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Approve or remove the pending preparation items before approving the
                  application.
                </p>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline">Stage tracking is explicit</Badge>
            <span>
              The existing status control on the application overview remains available.
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ReviewRow({
  label,
  complete,
  detail,
  warning = false,
  badge,
}: {
  label: string
  complete: boolean
  detail: string
  warning?: boolean
  badge?: ReactNode
}) {
  const Icon = complete ? CheckCircle2 : warning ? TriangleAlert : Circle
  const iconClass = complete
    ? 'text-emerald-600 dark:text-emerald-400'
    : warning
      ? 'text-amber-600 dark:text-amber-300'
      : 'text-muted-foreground'

  return (
    <div className="flex items-start gap-2 rounded-lg border bg-card p-3">
      <Icon className={`mt-0.5 size-4 shrink-0 ${iconClass}`} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-foreground">{label}</span>
          {badge}
        </div>
        <div className="mt-1 text-xs text-muted-foreground">{detail}</div>
      </div>
    </div>
  )
}
