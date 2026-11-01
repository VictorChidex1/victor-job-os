import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { Badge } from '@/components/ui/badge'
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
import { usePageMeta } from '@/hooks/usePageMeta'
import {
  APPLICATION_STATUS_LABELS,
  APPLICATION_TRANSITIONS,
  isTerminalApplicationStatus,
} from '@/lib/applications'
import { SOURCE_LABELS } from '@/lib/job-sources'
import { updateApplicationStatus } from '@/services/applications'
import type {
  ApplicationOutcome,
  ApplicationStatus,
} from '@/types/applications'

function formatDate(value?: { toDate?: () => Date }): string {
  const date = value?.toDate?.()
  return date
    ? date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '—'
}

function statusVariant(status: ApplicationStatus) {
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

export function ApplicationViewPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { application, loading, error, refresh } = useApplication(id)
  const { events, loading: eventsLoading, refresh: refreshEvents } = useApplicationEvents(id)

  usePageMeta({
    title: application
      ? `${application.jobTitle} — Application — Victor Job OS`
      : 'Application — Victor Job OS',
    description: 'Track one job application through its lifecycle.',
    noindex: true,
    path: `/app/applications/${id ?? ''}`,
  })

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
      <PageContainer title="Application">
        <LoadingState label="Loading application…" rows={5} />
      </PageContainer>
    )
  }

  if (error || !application) {
    return (
      <PageContainer title="Application">
        <EmptyState
          title={error ?? 'Application not found'}
          description="It may have been removed, or the link is incorrect."
        />
      </PageContainer>
    )
  }

  return (
    <PageContainer
      title={application.jobTitle}
      description={`${application.companyName || 'Unknown company'} · ${APPLICATION_STATUS_LABELS[application.status]}`}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/app/opportunities/${application.jobId}`)}
          >
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
        <Badge variant={statusVariant(application.status)}>
          {APPLICATION_STATUS_LABELS[application.status]}
        </Badge>
        {application.outcome && (
          <Badge variant="outline" className="capitalize">
            {application.outcome}
          </Badge>
        )}
        <Badge variant="outline">{SOURCE_LABELS[application.jobSource] ?? application.jobSource}</Badge>
        {application.origin === 'opportunity' && (
          <span className="text-xs text-muted-foreground">Started from an opportunity</span>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
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
                          {formatDate(event.createdAt)}
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
              <Separator className="my-2" />
              <DetailRow label="Created" value={formatDate(application.createdAt)} />
              <DetailRow label="Approved" value={formatDate(application.approvedAt)} />
              <DetailRow label="Submitted" value={formatDate(application.submittedAt)} />
              <DetailRow label="Closed" value={formatDate(application.closedAt)} />
              {application.nextAction && (
                <>
                  <Separator className="my-2" />
                  <DetailRow label="Next action" value={application.nextAction} />
                  {application.nextActionAt && (
                    <DetailRow label="Due" value={formatDate(application.nextActionAt)} />
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
                onClick={() => navigate(`/app/opportunities/${application.jobId}`)}
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
