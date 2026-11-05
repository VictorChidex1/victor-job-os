import { Link } from 'react-router'
import { ArrowUpRight } from 'lucide-react'
import { ApplicationStatusBadge } from '@/components/applications/ApplicationStatusBadge'
import {
  formatApplicationDate,
  groupApplications,
  isApplicationOverdue,
} from '@/lib/applicationPipeline'
import { SOURCE_LABELS } from '@/lib/job-sources'
import type { Application } from '@/types/applications'

interface ApplicationBoardProps {
  applications: Application[]
  applicationHref: (id: string) => string
}

function ApplicationCard({
  application,
  href,
  closed,
  now,
}: {
  application: Application
  href: string
  closed: boolean
  now: Date
}) {
  const overdue = isApplicationOverdue(application.nextActionAt, now)
  const dateLabel = application.submittedAt
    ? `Applied ${formatApplicationDate(application.submittedAt)}`
    : `Updated ${formatApplicationDate(application.updatedAt)}`

  return (
    <Link
      to={href}
      className="group block rounded-xl border border-border/60 bg-card p-3 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-border hover:shadow-md focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {application.companyName || 'Unknown company'}
          </div>
          <div className="mt-0.5 line-clamp-2 text-sm font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
            {application.jobTitle}
          </div>
        </div>
        <ArrowUpRight className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/60 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span className="rounded-md border border-border/60 bg-background/80 px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">
          {SOURCE_LABELS[application.jobSource] ?? application.jobSource}
        </span>
        <span className="inline-flex items-center rounded-md border border-border/50 bg-secondary/40 px-1.5 py-0.5 text-[10px] text-muted-foreground">
          {application.remote ? 'Remote' : application.location || 'Location unknown'}
        </span>
      </div>

      {application.nextAction && (
        <div
          className={`mt-2.5 rounded-md border px-2 py-1 text-[11px] ${
            overdue
              ? 'border-destructive/30 bg-destructive/5 text-destructive'
              : 'border-border/50 bg-muted/30 text-foreground/80'
          }`}
        >
          <span className="font-medium">Next:</span> {application.nextAction}
          {application.nextActionAt && (
            <span className="ml-1 text-[10px] opacity-80">
              · due {formatApplicationDate(application.nextActionAt)}
            </span>
          )}
        </div>
      )}

      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-[10px] text-muted-foreground">
        <span>{dateLabel}</span>
        {closed && (
          <ApplicationStatusBadge
            status={application.status}
            outcome={application.outcome}
          />
        )}
      </div>
    </Link>
  )
}

export function ApplicationBoard({
  applications,
  applicationHref,
}: ApplicationBoardProps) {
  const columns = groupApplications(applications)
  const now = new Date()

  return (
    <div className="flex w-full gap-4 overflow-x-auto pb-3">
      {columns.map((column) => (
        <section
          key={column.id}
          className="flex w-[280px] min-w-[270px] shrink-0 flex-col gap-3 rounded-2xl border border-border/60 bg-muted/20 p-3"
          aria-label={`${column.label}: ${column.count} application${column.count === 1 ? '' : 's'}`}
        >
          <header className="flex items-center justify-between gap-2 px-0.5">
            <div className="flex min-w-0 items-center gap-2">
              <span
                className={
                  column.id === 'closed'
                    ? 'size-1.5 rounded-full bg-muted-foreground'
                    : 'size-1.5 rounded-full bg-primary'
                }
              />
              <h2 className="truncate text-[11px] font-bold uppercase tracking-wider text-foreground/80">
                {column.label}
              </h2>
            </div>
            <span className="rounded-full bg-background/80 px-2 py-0.5 font-mono text-[10px] text-muted-foreground ring-1 ring-border/50">
              {column.count}
            </span>
          </header>

          <div className="flex flex-col gap-2.5">
            {column.applications.map((application) => (
              <ApplicationCard
                key={application.id}
                application={application}
                href={applicationHref(application.id)}
                closed={column.id === 'closed'}
                now={now}
              />
            ))}
            {column.count === 0 && (
              <div className="rounded-xl border border-dashed border-border/60 p-4 text-center text-[11px] text-muted-foreground">
                No applications
              </div>
            )}
          </div>
        </section>
      ))}
    </div>
  )
}
