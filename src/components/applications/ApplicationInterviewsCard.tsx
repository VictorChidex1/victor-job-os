import { useMemo, useState } from 'react'
import {
  CalendarClock,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { InterviewFormDialog } from '@/components/applications/InterviewFormDialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useApplicationInterviews } from '@/hooks/useApplicationInterviews'
import { useAuth } from '@/hooks/useAuth'
import {
  formatDuration,
  formatInterviewDate,
  INTERVIEW_STATUS_LABELS,
  INTERVIEW_TYPE_LABELS,
} from '@/lib/interviews'
import { deleteInterview, updateInterview } from '@/services/interviews'
import type { ApplicationStatus } from '@/types/applications'
import type { Interview } from '@/types/interviews'

function statusVariant(status: Interview['status']): 'secondary' | 'outline' {
  return status === 'completed' ? 'secondary' : 'outline'
}

function InterviewRow({
  interview,
  onEdit,
  onChanged,
}: {
  interview: Interview
  onEdit: () => void
  onChanged: () => Promise<void>
}) {
  const { user } = useAuth()
  const [busy, setBusy] = useState(false)

  async function updateStatus(status: Interview['status']) {
    if (!user) return
    setBusy(true)
    try {
      await updateInterview(user.uid, interview.id, { status })
      toast(`Interview marked ${INTERVIEW_STATUS_LABELS[status].toLowerCase()}`)
      await onChanged()
    } catch (error) {
      toast('Unable to update interview', {
        description: error instanceof Error ? error.message : 'Please try again.',
      })
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    if (!user) return
    if (!window.confirm('Delete this interview record?')) return
    setBusy(true)
    try {
      await deleteInterview(user.uid, interview.id)
      toast('Interview deleted')
      await onChanged()
    } catch (error) {
      toast('Unable to delete interview', {
        description: error instanceof Error ? error.message : 'Please try again.',
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border/60 bg-background/70 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-foreground">
              {INTERVIEW_TYPE_LABELS[interview.type]}
            </span>
            <Badge variant={statusVariant(interview.status)}>
              {INTERVIEW_STATUS_LABELS[interview.status]}
            </Badge>
            {interview.round && (
              <Badge variant="outline" className="font-normal">
                {interview.round}
              </Badge>
            )}
          </div>
          <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarClock className="size-3.5" />
            {formatInterviewDate(interview.scheduledAt, interview.timezone)}
            <span>·</span>
            {formatDuration(interview.durationMinutes)}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {interview.status === 'scheduled' && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1 px-2 text-xs"
                onClick={() => void updateStatus('completed')}
                disabled={busy}
              >
                <CheckCircle2 className="size-3.5" />
                Complete
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 px-2 text-xs"
                onClick={() => void updateStatus('cancelled')}
                disabled={busy}
              >
                <XCircle className="size-3.5" />
                Cancel
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 px-2 text-xs"
            onClick={onEdit}
            disabled={busy}
          >
            <Pencil className="size-3.5" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 px-2 text-xs text-destructive hover:text-destructive"
            onClick={() => void remove()}
            disabled={busy}
          >
            <Trash2 className="size-3.5" />
            Delete
          </Button>
        </div>
      </div>

      {interview.interviewers.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Interviewers: {interview.interviewers.join(', ')}
        </p>
      )}
      {interview.location && (
        <p className="text-xs text-muted-foreground">Location: {interview.location}</p>
      )}
      {interview.meetingUrl && (
        <a
          href={interview.meetingUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex w-fit items-center gap-1 text-xs text-primary underline underline-offset-4"
        >
          Join meeting
          <ExternalLink className="size-3" />
        </a>
      )}
      {interview.preparationNotes && (
        <p className="whitespace-pre-wrap text-xs text-muted-foreground">
          Prepare: {interview.preparationNotes}
        </p>
      )}
      {interview.notes && (
        <p className="whitespace-pre-wrap text-xs text-muted-foreground">
          {interview.notes}
        </p>
      )}
      {interview.outcomeNotes && (
        <p className="whitespace-pre-wrap text-xs text-muted-foreground">
          Outcome: {interview.outcomeNotes}
        </p>
      )}
    </div>
  )
}

export function ApplicationInterviewsCard({
  applicationId,
  applicationStatus,
  onChanged,
}: {
  applicationId: string
  applicationStatus: ApplicationStatus
  onChanged?: () => Promise<void> | void
}) {
  const { interviews, loading, error, refresh } = useApplicationInterviews(applicationId)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Interview | null>(null)

  const { upcoming, past } = useMemo(() => {
    // oxlint-disable-next-line react/purity -- grouping depends on the current time
    const now = Date.now()
    const upcomingItems: Interview[] = []
    const pastItems: Interview[] = []
    for (const interview of interviews) {
      if (
        interview.status === 'scheduled' &&
        interview.scheduledAt.toDate().getTime() >= now
      ) {
        upcomingItems.push(interview)
      } else {
        pastItems.push(interview)
      }
    }
    return { upcoming: upcomingItems, past: pastItems }
  }, [interviews])

  async function refreshAll() {
    await refresh()
    await onChanged?.()
  }

  function openCreate() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(interview: Interview) {
    setEditing(interview)
    setFormOpen(true)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-sm">
              <CalendarClock className="size-4 text-primary" />
              Interviews
            </CardTitle>
            <CardDescription>
              Track schedules, interviewers, preparation, and outcomes for this application.
            </CardDescription>
          </div>
          <Button size="sm" onClick={openCreate}>
            <Plus />
            Add interview
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 text-sm">
        {loading ? (
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading interviews…
          </p>
        ) : error ? (
          <p className="text-xs text-rose-700">{error}</p>
        ) : interviews.length === 0 ? (
          <p className="rounded-lg border border-dashed bg-muted/20 p-4 text-xs text-muted-foreground">
            No interviews scheduled yet.
          </p>
        ) : (
          <>
            {upcoming.length > 0 && (
              <div className="flex flex-col gap-2">
                <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Upcoming
                </div>
                {upcoming.map((interview) => (
                  <InterviewRow
                    key={interview.id}
                    interview={interview}
                    onEdit={() => openEdit(interview)}
                    onChanged={refreshAll}
                  />
                ))}
              </div>
            )}
            {past.length > 0 && (
              <div className="flex flex-col gap-2">
                <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  History
                </div>
                {past.map((interview) => (
                  <InterviewRow
                    key={interview.id}
                    interview={interview}
                    onEdit={() => openEdit(interview)}
                    onChanged={refreshAll}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>

      {formOpen && (
        <InterviewFormDialog
          key={editing?.id ?? 'new'}
          open={formOpen}
          onOpenChange={setFormOpen}
          applicationId={applicationId}
          applicationStatus={applicationStatus}
          interview={editing}
          onSaved={refreshAll}
        />
      )}
    </Card>
  )
}
