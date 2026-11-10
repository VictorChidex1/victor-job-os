import { CalendarClock, ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAdminApplicationInterviews } from '@/hooks/useAdminApplicationInterviews'
import {
  formatDuration,
  formatInterviewDate,
  INTERVIEW_STATUS_LABELS,
  INTERVIEW_TYPE_LABELS,
} from '@/lib/interviews'

export function AdminApplicationInterviewsCard({
  applicationId,
}: {
  applicationId: string
}) {
  const { interviews, loading, error } = useAdminApplicationInterviews(applicationId)

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-sm text-slate-950">Interviews</CardTitle>
        <CardDescription>
          Read-only interview schedule and history for this application.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {loading ? (
          <p className="text-sm text-slate-500">Loading interviews…</p>
        ) : error ? (
          <p className="text-xs text-rose-700">{error}</p>
        ) : interviews.length === 0 ? (
          <p className="text-sm text-slate-500">No interviews recorded.</p>
        ) : (
          interviews.map((interview) => (
            <div
              key={interview.id}
              className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-slate-900">
                    {INTERVIEW_TYPE_LABELS[interview.type]}
                  </span>
                  <Badge variant="outline">
                    {INTERVIEW_STATUS_LABELS[interview.status]}
                  </Badge>
                  {interview.round && (
                    <Badge variant="outline" className="font-normal">
                      {interview.round}
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-slate-500">
                  {formatDuration(interview.durationMinutes)}
                </span>
              </div>
              <p className="flex items-center gap-1.5 text-xs text-slate-500">
                <CalendarClock className="size-3.5" />
                {formatInterviewDate(interview.scheduledAt, interview.timezone)}
              </p>
              {interview.interviewers.length > 0 && (
                <p className="text-xs text-slate-600">
                  Interviewers: {interview.interviewers.join(', ')}
                </p>
              )}
              {interview.location && (
                <p className="text-xs text-slate-600">Location: {interview.location}</p>
              )}
              {interview.meetingUrl && (
                <a
                  href={interview.meetingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex w-fit items-center gap-1 text-xs text-indigo-600 underline underline-offset-4"
                >
                  Open meeting link
                  <ExternalLink className="size-3" />
                </a>
              )}
              {interview.notes && (
                <p className="whitespace-pre-wrap text-xs text-slate-600">
                  {interview.notes}
                </p>
              )}
              {interview.preparationNotes && (
                <p className="whitespace-pre-wrap text-xs text-slate-600">
                  Preparation: {interview.preparationNotes}
                </p>
              )}
              {interview.outcomeNotes && (
                <p className="whitespace-pre-wrap text-xs text-slate-600">
                  Outcome: {interview.outcomeNotes}
                </p>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
