import { Link } from 'react-router'
import { ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  formatDuration,
  formatInterviewDate,
  INTERVIEW_STATUS_LABELS,
  INTERVIEW_TYPE_LABELS,
} from '@/lib/interviews'
import type { Interview } from '@/types/interviews'

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
        {label}
      </div>
      <div className="text-sm text-slate-700">{value || '—'}</div>
    </div>
  )
}

export function AdminInterviewDrawer({
  interview,
  open,
  onOpenChange,
  userName,
}: {
  interview: Interview | null
  open: boolean
  onOpenChange: (open: boolean) => void
  userName?: string
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{interview?.companyName || 'Interview'}</SheetTitle>
          <SheetDescription>
            Read-only cross-user interview detail.
          </SheetDescription>
        </SheetHeader>

        {interview && (
          <div className="flex flex-col gap-4 px-4 pb-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">
                {INTERVIEW_TYPE_LABELS[interview.type]}
              </Badge>
              <Badge variant="secondary">
                {INTERVIEW_STATUS_LABELS[interview.status]}
              </Badge>
              {interview.round && (
                <Badge variant="outline">{interview.round}</Badge>
              )}
            </div>

            <div className="grid gap-3 rounded-xl border bg-slate-50 p-3 sm:grid-cols-2">
              <Row label="Application" value={interview.jobTitle} />
              <Row label="User" value={userName || interview.userId} />
              <Row label="Scheduled" value={formatInterviewDate(interview.scheduledAt, interview.timezone)} />
              <Row label="Timezone" value={interview.timezone} />
              <Row label="Duration" value={formatDuration(interview.durationMinutes)} />
              <Row label="Location" value={interview.location} />
              <Row
                label="Interviewers"
                value={interview.interviewers.join(', ')}
              />
            </div>

            {interview.meetingUrl && (
              <a
                href={interview.meetingUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-fit items-center gap-1 text-sm text-indigo-600 underline underline-offset-4"
              >
                Open meeting link
                <ExternalLink className="size-3.5" />
              </a>
            )}

            <Row label="Notes" value={interview.notes} />
            <Row label="Preparation notes" value={interview.preparationNotes} />
            <Row label="Outcome notes" value={interview.outcomeNotes} />

            <div className="flex flex-wrap gap-2 border-t pt-3">
              <Button
                variant="outline"
                size="sm"
                render={
                  <Link
                    to={`/admin/applications/${encodeURIComponent(interview.applicationId)}`}
                  />
                }
              >
                <ExternalLink />
                Open application
              </Button>
              <Button
                variant="outline"
                size="sm"
                render={
                  <Link to={`/admin/users/${encodeURIComponent(interview.userId)}`} />
                }
              >
                Open user
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
