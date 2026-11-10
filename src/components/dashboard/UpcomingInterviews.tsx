import { Link } from 'react-router'
import { CalendarClock, ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useUpcomingInterviews } from '@/hooks/useUpcomingInterviews'
import {
  formatInterviewDate,
  INTERVIEW_TYPE_LABELS,
} from '@/lib/interviews'

export function UpcomingInterviews() {
  const { interviews, loading, error } = useUpcomingInterviews(5)

  return (
    <Card className="border-border/60">
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-bold">
          <CalendarClock className="size-4 text-primary" />
          Next interviews
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
          render={<Link to="/app/applications" />}
        >
          Applications
          <ExternalLink className="size-3" />
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {loading ? (
          <p className="text-xs text-muted-foreground">Loading interviews…</p>
        ) : error ? (
          <p className="text-xs text-rose-700">{error}</p>
        ) : interviews.length === 0 ? (
          <p className="rounded-lg border border-dashed bg-muted/20 p-3 text-xs text-muted-foreground">
            No upcoming interviews scheduled.
          </p>
        ) : (
          interviews.map((interview) => (
            <Link
              key={interview.id}
              to={`/app/applications?application=${encodeURIComponent(interview.applicationId)}`}
              className="flex flex-col gap-1 rounded-lg border border-border/50 bg-background/70 p-3 transition-colors hover:bg-muted/40"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-medium text-foreground">
                  {interview.companyName || 'Unknown company'}
                </span>
                <Badge variant="outline" className="font-normal">
                  {INTERVIEW_TYPE_LABELS[interview.type]}
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground">
                {interview.jobTitle || 'Interview'}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatInterviewDate(interview.scheduledAt, interview.timezone)}
              </span>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  )
}
