import { useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { ArrowLeft, ExternalLink, FileText } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { ApplicationStatusBadge } from '@/components/applications/ApplicationStatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { EmptyState } from '@/components/states/EmptyState'
import { LoadingState } from '@/components/states/LoadingState'
import { useApplication } from '@/hooks/useApplication'
import { useApplicationEvents } from '@/hooks/useApplicationEvents'
import { useAuth } from '@/hooks/useAuth'
import {
  APPLICATION_STATUS_LABELS,
  APPLICATION_TRANSITIONS,
  isTerminalApplicationStatus,
} from '@/lib/applications'
import { formatApplicationDate } from '@/lib/applicationPipeline'
import { SOURCE_LABELS } from '@/lib/job-sources'
import { updateApplicationStatus } from '@/services/applications'
import type {
  Application,
  ApplicationOutcome,
  ApplicationStatus,
} from '@/types/applications'

interface ApplicationDetailProps {
  applicationId: string
  compact?: boolean
  onClose?: () => void
  onChanged?: () => void
  onPrepare?: () => void
}

function preparationActionLabel(status: ApplicationStatus): string {
  switch (status) {
    case 'not-started':
      return 'Start preparation'
    case 'preparing':
      return 'Continue preparing'
    case 'needs-review':
      return 'Review preparation'
    default:
      return 'View preparation'
  }
}

function DetailRow({ label, value }: { label: string; value?: string }) {
  if (!value) {
    return null
  }
  return (
    <div className="flex items-start justify-between gap-4 py-1">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-right text-sm text-foreground">{value}</span>
    </div>
  )
}

export function ApplicationDetail({
  applicationId,
  compact = false,
  onClose,
  onChanged,
  onPrepare,
}: ApplicationDetailProps) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { application, loading, error, refresh } = useApplication(applicationId)
  const {
    events,
    loading: eventsLoading,
    refresh: refreshEvents,
  } = useApplicationEvents(applicationId)

  const [selectedNext, setSelectedNext] = useState<ApplicationStatus | ''>('')
  const [selectedOutcome, setSelectedOutcome] = useState<ApplicationOutcome | ''>('')
  const [note, setNote] = useState('')
  const [updating, setUpdating] = useState(false)

  const validNext = application ? APPLICATION_TRANSITIONS[application.status] : []
  const nextStatus =
    selectedNext && validNext.includes(selectedNext)
      ? selectedNext
      : (validNext[0] ?? '')
  const terminal = application ? isTerminalApplicationStatus(application.status) : false

  const backButton = onClose ? (
    <Button variant="ghost" size="sm" onClick={onClose}>
      <ArrowLeft />
      Applications
    </Button>
  ) : undefined

  async function handleUpdateStatus() {
    if (!user || !application || !nextStatus) {
      return
    }

    setUpdating(true)
    try {
      await updateApplicationStatus(user.uid, application.id, nextStatus, {
        note: note.trim() || undefined,
        outcome:
          application.status === 'offer' && nextStatus === 'closed'
            ? (selectedOutcome || 'closed')
            : undefined,
      })
      setSelectedNext('')
      setSelectedOutcome('')
      setNote('')
      await Promise.all([refresh(), refreshEvents()])
      onChanged?.()
      toast(`Application moved to ${APPLICATION_STATUS_LABELS[nextStatus]}`)
    } catch (updateError) {
      toast('Unable to update the application', {
        description:
          updateError instanceof Error ? updateError.message : 'Please try again.',
      })
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <PageContainer
        title="Application"
        stackHeader={compact}
        actions={backButton}
      >
        <LoadingState label="Loading application…" rows={5} />
      </PageContainer>
    )
  }

  if (error || !application) {
    return (
      <PageContainer
        title="Application"
        stackHeader={compact}
        actions={backButton}
      >
        <EmptyState
          title={error ?? 'Application not found'}
          description="It may have been removed, or the link is incorrect."
        />
      </PageContainer>
    )
  }

  function goToOpportunity() {
    if (!application) {
      return
    }
    navigate(`/app/opportunities?job=${encodeURIComponent(application.jobId)}`)
  }

  return (
    <PageContainer
      title={application.jobTitle}
      description={`${application.companyName || 'Unknown company'} · ${APPLICATION_STATUS_LABELS[application.status]}`}
      stackHeader={compact}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {backButton}
          {onPrepare && (
            <Button variant="outline" size="sm" onClick={onPrepare}>
              <FileText />
              {preparationActionLabel(application.status)}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={goToOpportunity}>
            <ArrowLeft />
            Opportunity
          </Button>
          {application.applicationUrl && (
            <Button
              size="sm"
              render={
                <a href={application.applicationUrl} target="_blank" rel="noreferrer" />
              }
            >
              <ExternalLink />
              Open application
            </Button>
          )}
        </div>
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <ApplicationStatusBadge
          status={application.status}
          outcome={application.outcome}
        />
        <BadgeSource source={application.jobSource} />
        {application.origin === 'opportunity' && (
          <span className="text-xs text-muted-foreground">Started from an opportunity</span>
        )}
      </div>

      <div
        className={
          compact
            ? 'flex flex-col gap-6'
            : 'grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]'
        }
      >
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Pipeline</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {terminal ? (
                <p className="text-sm text-muted-foreground">
                  This application is closed and cannot move to another stage.
                </p>
              ) : (
                <>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="next-status">Move to</Label>
                    <Select
                      value={nextStatus}
                      onValueChange={(value) => {
                        setSelectedNext(value as ApplicationStatus)
                        if (value !== 'closed') {
                          setSelectedOutcome('')
                        }
                      }}
                    >
                      <SelectTrigger id="next-status" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {validNext.map((status) => (
                          <SelectItem key={status} value={status}>
                            {APPLICATION_STATUS_LABELS[status]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {application.status === 'offer' && nextStatus === 'closed' && (
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="offer-outcome">Offer outcome</Label>
                      <Select
                        value={selectedOutcome || 'closed'}
                        onValueChange={(value) =>
                          setSelectedOutcome(value as ApplicationOutcome)
                        }
                      >
                        <SelectTrigger id="offer-outcome" className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="accepted">Accepted</SelectItem>
                          <SelectItem value="declined">Declined</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="status-note">Note (optional)</Label>
                    <Textarea
                      id="status-note"
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      placeholder="e.g. Recruiter asked for availability next week."
                    />
                  </div>

                  <div>
                    <Button
                      size="sm"
                      onClick={() => void handleUpdateStatus()}
                      disabled={updating || !nextStatus}
                    >
                      {updating ? 'Updating…' : 'Update status'}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {eventsLoading ? (
                <LoadingState label="Loading timeline…" rows={3} />
              ) : events.length === 0 ? (
                <p className="text-sm text-muted-foreground">No events yet.</p>
              ) : (
                <ol className="flex flex-col gap-4">
                  {events.map((event) => (
                    <li key={event.id} className="flex gap-3">
                      <div className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-foreground">
                          {event.type === 'created'
                            ? 'Application created'
                            : `${event.fromStatus ? APPLICATION_STATUS_LABELS[event.fromStatus] : 'Previous'} → ${event.toStatus ? APPLICATION_STATUS_LABELS[event.toStatus] : 'Updated'}`}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatApplicationDate(event.createdAt)}
                        </div>
                        {event.note && (
                          <p className="mt-1 text-sm leading-relaxed text-foreground/80">
                            {event.note}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Details</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col">
              <DetailRow label="Company" value={application.companyName} />
              <DetailRow label="Role" value={application.jobTitle} />
              {application.location && (
                <DetailRow label="Location" value={application.location} />
              )}
              {application.resumeUrl && (
                <div className="flex items-start justify-between gap-4 py-1">
                  <span className="text-sm text-muted-foreground">Resume</span>
                  <a
                    href={application.resumeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex max-w-[12rem] items-center gap-1 truncate text-sm text-primary underline underline-offset-4"
                  >
                    Attached resume
                    <ExternalLink className="size-3 shrink-0" />
                  </a>
                </div>
              )}
              <Separator className="my-2" />
              <DetailRow
                label="Created"
                value={formatApplicationDate(application.createdAt)}
              />
              <DetailRow
                label="Approved"
                value={formatApplicationDate(application.approvedAt)}
              />
              <DetailRow
                label="Submitted"
                value={formatApplicationDate(application.submittedAt)}
              />
              <DetailRow
                label="Closed"
                value={formatApplicationDate(application.closedAt)}
              />
              {application.nextAction && (
                <>
                  <Separator className="my-2" />
                  <DetailRow label="Next action" value={application.nextAction} />
                  {application.nextActionAt && (
                    <DetailRow
                      label="Due"
                      value={formatApplicationDate(application.nextActionAt)}
                    />
                  )}
                </>
              )}
              {application.notes && (
                <>
                  <Separator className="my-2" />
                  <div>
                    <div className="text-xs font-medium text-muted-foreground">Notes</div>
                    <p className="mt-1 text-sm leading-relaxed text-foreground">
                      {application.notes}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Source</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <div className="text-sm text-foreground">{application.companyName}</div>
              <div className="text-xs text-muted-foreground">
                {SOURCE_LABELS[application.jobSource] ?? application.jobSource}
              </div>
              {application.applicationUrl && (
                <a
                  href={application.applicationUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="truncate text-xs text-primary underline underline-offset-4"
                >
                  {application.applicationUrl}
                </a>
              )}
              <Button
                variant="outline"
                size="sm"
                className="mt-2 w-fit"
                onClick={goToOpportunity}
              >
                View opportunity
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  )
}

function BadgeSource({ source }: { source: Application['jobSource'] }) {
  return (
    <span className="inline-flex items-center rounded-md border border-border/60 bg-background/80 px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
      {SOURCE_LABELS[source] ?? source}
    </span>
  )
}
