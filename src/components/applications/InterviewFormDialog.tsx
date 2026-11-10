import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/hooks/useAuth'
import {
  INTERVIEW_STATUS_LABELS,
  INTERVIEW_STATUS_OPTIONS,
  INTERVIEW_TYPE_LABELS,
  INTERVIEW_TYPE_OPTIONS,
  localTimezone,
  toDateTimeLocalValue,
} from '@/lib/interviews'
import {
  createInterview,
  updateInterview,
} from '@/services/interviews'
import type { ApplicationStatus } from '@/types/applications'
import type {
  Interview,
  InterviewStatus,
  InterviewType,
} from '@/types/interviews'

function defaultScheduledAt(): Date {
  const date = new Date()
  date.setDate(date.getDate() + 1)
  date.setHours(10, 0, 0, 0)
  return date
}

export function InterviewFormDialog({
  open,
  onOpenChange,
  applicationId,
  applicationStatus,
  interview,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  applicationId: string
  applicationStatus: ApplicationStatus
  interview?: Interview | null
  onSaved: () => Promise<void> | void
}) {
  const { user } = useAuth()
  const [type, setType] = useState<InterviewType>(interview?.type ?? 'video')
  const [status, setStatus] = useState<InterviewStatus>(
    interview?.status ?? 'scheduled',
  )
  const [round, setRound] = useState(interview?.round ?? '')
  const [scheduledAt, setScheduledAt] = useState(
    toDateTimeLocalValue(interview?.scheduledAt.toDate() ?? defaultScheduledAt()),
  )
  const [durationMinutes, setDurationMinutes] = useState(
    String(interview?.durationMinutes ?? 60),
  )
  const [timezone, setTimezone] = useState(interview?.timezone ?? localTimezone())
  const [location, setLocation] = useState(interview?.location ?? '')
  const [meetingUrl, setMeetingUrl] = useState(interview?.meetingUrl ?? '')
  const [interviewers, setInterviewers] = useState(
    (interview?.interviewers ?? []).join(', '),
  )
  const [notes, setNotes] = useState(interview?.notes ?? '')
  const [preparationNotes, setPreparationNotes] = useState(
    interview?.preparationNotes ?? '',
  )
  const [outcomeNotes, setOutcomeNotes] = useState(interview?.outcomeNotes ?? '')
  const [moveToInterviewing, setMoveToInterviewing] = useState(
    applicationStatus === 'submitted' || applicationStatus === 'assessment',
  )
  const [busy, setBusy] = useState(false)

  async function handleSave() {
    if (!user) return
    setBusy(true)
    try {
      const payload = {
        applicationId,
        type,
        status,
        round: round.trim() || undefined,
        scheduledAt: new Date(scheduledAt),
        durationMinutes: Number(durationMinutes),
        timezone,
        location: location.trim() || undefined,
        meetingUrl: meetingUrl.trim() || undefined,
        interviewers: interviewers
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean),
        notes: notes.trim() || undefined,
        preparationNotes: preparationNotes.trim() || undefined,
        outcomeNotes: outcomeNotes.trim() || undefined,
      }

      if (interview) {
        await updateInterview(user.uid, interview.id, payload)
        toast('Interview updated')
      } else {
        await createInterview(user.uid, payload, {
          moveApplicationToInterviewing: moveToInterviewing,
        })
        toast('Interview scheduled')
      }
      await onSaved()
      onOpenChange(false)
    } catch (error) {
      toast(interview ? 'Unable to update interview' : 'Unable to schedule interview', {
        description: error instanceof Error ? error.message : 'Please try again.',
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{interview ? 'Edit interview' : 'Schedule interview'}</DialogTitle>
          <DialogDescription>
            Track the schedule, interviewers, notes, and outcome for this application.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-xs font-medium text-foreground">
            Interview type
            <select
              value={type}
              onChange={(event) => setType(event.target.value as InterviewType)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              disabled={busy}
            >
              {INTERVIEW_TYPE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {INTERVIEW_TYPE_LABELS[option]}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5 text-xs font-medium text-foreground">
            Status
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as InterviewStatus)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              disabled={busy}
            >
              {INTERVIEW_STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {INTERVIEW_STATUS_LABELS[option]}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5 text-xs font-medium text-foreground sm:col-span-2">
            Round or stage
            <Input
              value={round}
              onChange={(event) => setRound(event.target.value)}
              placeholder="e.g. Recruiter screen, Technical round 1, Final"
              disabled={busy}
            />
          </label>

          <label className="flex flex-col gap-1.5 text-xs font-medium text-foreground">
            Date and time
            <Input
              type="datetime-local"
              value={scheduledAt}
              onChange={(event) => setScheduledAt(event.target.value)}
              disabled={busy}
            />
          </label>

          <label className="flex flex-col gap-1.5 text-xs font-medium text-foreground">
            Duration (minutes)
            <Input
              type="number"
              min={15}
              max={480}
              step={15}
              value={durationMinutes}
              onChange={(event) => setDurationMinutes(event.target.value)}
              disabled={busy}
            />
          </label>

          <label className="flex flex-col gap-1.5 text-xs font-medium text-foreground">
            Timezone
            <Input
              value={timezone}
              onChange={(event) => setTimezone(event.target.value)}
              placeholder="e.g. Europe/London"
              disabled={busy}
            />
          </label>

          <label className="flex flex-col gap-1.5 text-xs font-medium text-foreground">
            Location
            <Input
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="Office, address, or Remote"
              disabled={busy}
            />
          </label>

          <label className="flex flex-col gap-1.5 text-xs font-medium text-foreground sm:col-span-2">
            Meeting URL
            <Input
              value={meetingUrl}
              onChange={(event) => setMeetingUrl(event.target.value)}
              placeholder="https://..."
              disabled={busy}
            />
          </label>

          <label className="flex flex-col gap-1.5 text-xs font-medium text-foreground sm:col-span-2">
            Interviewers
            <Input
              value={interviewers}
              onChange={(event) => setInterviewers(event.target.value)}
              placeholder="Comma-separated names or roles"
              disabled={busy}
            />
          </label>

          <label className="flex flex-col gap-1.5 text-xs font-medium text-foreground sm:col-span-2">
            Notes
            <Textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={2}
              placeholder="Preparation notes, topics, logistics…"
              disabled={busy}
            />
          </label>

          <label className="flex flex-col gap-1.5 text-xs font-medium text-foreground sm:col-span-2">
            Preparation notes
            <Textarea
              value={preparationNotes}
              onChange={(event) => setPreparationNotes(event.target.value)}
              rows={2}
              placeholder="What to review or prepare before the interview."
              disabled={busy}
            />
          </label>

          <label className="flex flex-col gap-1.5 text-xs font-medium text-foreground sm:col-span-2">
            Outcome notes
            <Textarea
              value={outcomeNotes}
              onChange={(event) => setOutcomeNotes(event.target.value)}
              rows={2}
              placeholder="What happened and what comes next."
              disabled={busy}
            />
          </label>

          {!interview &&
            (applicationStatus === 'submitted' || applicationStatus === 'assessment') && (
              <label className="flex items-start gap-2 text-xs text-foreground sm:col-span-2">
                <input
                  type="checkbox"
                  className="mt-0.5 size-4 accent-primary"
                  checked={moveToInterviewing}
                  onChange={(event) => setMoveToInterviewing(event.target.checked)}
                  disabled={busy}
                />
                Move application to Interviewing when this interview is saved.
              </label>
            )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={() => void handleSave()} disabled={busy}>
            {busy ? <Loader2 className="animate-spin" /> : null}
            {interview ? 'Save interview' : 'Schedule interview'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
