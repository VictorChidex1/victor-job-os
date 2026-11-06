import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import {
  ArrowUpRight,
  FileText,
  Clock,
  ChevronRight,
  ChevronLeft,
  Columns,
  Maximize2,
  Minimize2,
} from 'lucide-react'
import { ApplicationStatusBadge } from '@/components/applications/ApplicationStatusBadge'
import {
  formatApplicationDate,
  groupApplications,
  isApplicationOverdue,
  STAGE_THEMES,
} from '@/lib/applicationPipeline'
import { SOURCE_LABELS } from '@/lib/job-sources'
import type { Application } from '@/types/applications'

interface ApplicationBoardProps {
  applications: Application[]
  applicationHref: (id: string) => string
  targetStageId?: string
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

  const companyInitials = (application.companyName || 'JB')
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('')

  return (
    <Link
      to={href}
      className="group relative block rounded-2xl border border-border/70 bg-card p-3.5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      {/* Top Header with Monogram */}
      <div className="flex items-start gap-2.5">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-muted/50 font-mono text-[10px] font-bold text-foreground transition-colors group-hover:border-primary/40 group-hover:bg-primary/10 group-hover:text-primary">
          {companyInitials}
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {application.companyName || 'Unknown company'}
          </div>
          <div className="mt-0.5 line-clamp-2 text-xs sm:text-sm font-bold leading-snug text-foreground transition-colors group-hover:text-primary">
            {application.jobTitle}
          </div>
        </div>
        <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground/60 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
      </div>

      {/* Badges Row */}
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <span className="rounded-md border border-border/60 bg-background/80 px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">
          {SOURCE_LABELS[application.jobSource] ?? application.jobSource}
        </span>
        <span className="inline-flex items-center rounded-md border border-border/50 bg-secondary/40 px-1.5 py-0.5 text-[10px] text-muted-foreground">
          {application.remote ? 'Remote' : application.location || 'Location unknown'}
        </span>
        {application.resumeUrl && (
          <span
            className="inline-flex items-center gap-1 rounded-md border border-emerald-500/25 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-300"
            title={
              application.resumeVariantName
                ? `${application.resumeVariantName} resume attached`
                : 'Resume attached'
            }
          >
            <FileText className="size-2.5" />
            Resume
          </span>
        )}
      </div>

      {/* Next Action Box */}
      {application.nextAction && (
        <div
          className={`mt-2.5 flex items-start gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] ${
            overdue
              ? 'border-destructive/30 bg-destructive/5 text-destructive'
              : 'border-border/60 bg-muted/30 text-foreground/80'
          }`}
        >
          <Clock className="size-3 shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1 leading-snug">
            <span className="font-semibold">Next:</span> {application.nextAction}
            {application.nextActionAt && (
              <span className="ml-1 text-[10px] opacity-80 block sm:inline">
                · due {formatApplicationDate(application.nextActionAt)}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-border/40 pt-2 text-[10px] text-muted-foreground">
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
  targetStageId,
}: ApplicationBoardProps) {
  const columns = groupApplications(applications)
  const now = new Date()

  // Track collapsed stage IDs (default to collapsing empty columns so all 9 stages fit on screen!)
  const [collapsedStages, setCollapsedStages] = useState<Set<string>>(() => {
    const initial = new Set<string>()
    for (const col of columns) {
      if (col.count === 0) {
        initial.add(col.id)
      }
    }
    return initial
  })

  // Synchronize when target stage is selected from flow bar
  useEffect(() => {
    if (!targetStageId) return

    setCollapsedStages((prev) => {
      const next = new Set(prev)
      next.delete(targetStageId)
      return next
    })

    const el = document.getElementById(`board-col-${targetStageId}`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }, [targetStageId])

  const toggleCollapse = (id: string) => {
    setCollapsedStages((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const expandAll = () => setCollapsedStages(new Set())
  const collapseEmpty = () => {
    const next = new Set<string>()
    for (const col of columns) {
      if (col.count === 0) next.add(col.id)
    }
    setCollapsedStages(next)
  }

  const allExpanded = collapsedStages.size === 0

  return (
    <div className="space-y-3">
      {/* Board Controls Toolbar */}
      <div className="flex items-center justify-between px-1 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Columns className="size-3.5 text-primary" />
          <span className="font-semibold text-foreground text-[11px] sm:text-xs">
            Pipeline Board (9 Stages)
          </span>
          <span className="hidden sm:inline text-muted-foreground/60">·</span>
          <span className="hidden sm:inline text-[11px]">
            {collapsedStages.size > 0
              ? `${collapsedStages.size} empty stage${collapsedStages.size === 1 ? '' : 's'} collapsed into ribbons`
              : 'All stages expanded'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {allExpanded ? (
            <button
              type="button"
              onClick={collapseEmpty}
              className="flex items-center gap-1 rounded-lg border border-border/70 bg-card/60 px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-all shadow-2xs"
            >
              <Minimize2 className="size-3" />
              <span>Collapse Empty</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={expandAll}
              className="flex items-center gap-1 rounded-lg border border-border/70 bg-card/60 px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-all shadow-2xs"
            >
              <Maximize2 className="size-3" />
              <span>Expand All</span>
            </button>
          )}
        </div>
      </div>

      {/* Kanban Board with Collapsing Accordion Ribbons */}
      <div className="flex w-full items-start gap-3 overflow-x-auto pb-4 scrollbar-none">
        {columns.map((column) => {
          const isCollapsed = collapsedStages.has(column.id)
          const theme = STAGE_THEMES[column.id] ?? STAGE_THEMES['not-started']
          const hasItems = column.count > 0

          // Collapsed Ribbon Mode (Ultra-compact 46px column)
          if (isCollapsed) {
            return (
              <button
                key={column.id}
                id={`board-col-${column.id}`}
                type="button"
                onClick={() => toggleCollapse(column.id)}
                title={`Click to expand ${column.label} (${column.count})`}
                className="group relative flex h-[380px] w-[46px] min-w-[46px] max-w-[46px] shrink-0 flex-col items-center justify-between rounded-2xl border border-border/70 bg-muted/20 py-4 transition-all duration-200 hover:border-primary/50 hover:bg-muted/40 hover:shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {/* Top: Status Dot */}
                <div className="flex flex-col items-center gap-1.5">
                  <span className={`size-2 rounded-full ${theme.dotColor}`} />
                  <ChevronRight className="size-3 text-muted-foreground opacity-60 group-hover:opacity-100 group-hover:text-primary transition-opacity" />
                </div>

                {/* Middle: Vertical Rotated Label */}
                <span
                  className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors whitespace-nowrap"
                  style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                >
                  {column.label}
                </span>

                {/* Bottom: Count Pill */}
                <span
                  className={`rounded-full px-1.5 py-0.5 font-mono text-[9px] font-bold ${
                    hasItems ? `${theme.badgeBg} ${theme.badgeText}` : 'bg-muted text-muted-foreground/70'
                  }`}
                >
                  {column.count}
                </span>
              </button>
            )
          }

          // Full Expanded Column Mode
          return (
            <section
              key={column.id}
              id={`board-col-${column.id}`}
              className="flex w-[290px] min-w-[280px] max-w-[320px] shrink-0 flex-col gap-3 rounded-2xl border border-border/70 bg-muted/20 p-3.5 shadow-2xs transition-all"
              aria-label={`${column.label}: ${column.count} application${column.count === 1 ? '' : 's'}`}
            >
              <header className="flex items-center justify-between gap-2 px-1">
                <div className="flex min-w-0 items-center gap-2">
                  <span className={`size-2 rounded-full ${theme.dotColor} shrink-0`} />
                  <h2 className="truncate text-xs font-bold uppercase tracking-wider text-foreground">
                    {column.label}
                  </h2>
                </div>

                <div className="flex items-center gap-1.5">
                  <span
                    className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-bold ${
                      hasItems
                        ? `${theme.badgeBg} ${theme.badgeText} shadow-2xs`
                        : 'bg-background/80 text-muted-foreground ring-1 ring-border/50'
                    }`}
                  >
                    {column.count}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleCollapse(column.id)}
                    className="p-1 text-muted-foreground/60 hover:text-foreground hover:bg-muted/60 rounded-md transition-colors"
                    title={`Collapse ${column.label}`}
                    aria-label={`Collapse ${column.label}`}
                  >
                    <ChevronLeft className="size-3.5" />
                  </button>
                </div>
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
                  <div className="rounded-xl border border-dashed border-border/70 bg-background/40 p-5 text-center text-xs text-muted-foreground">
                    <p>No applications in {column.label.toLowerCase()}</p>
                    <button
                      type="button"
                      onClick={() => toggleCollapse(column.id)}
                      className="mt-1.5 text-[11px] font-medium text-primary hover:underline inline-block"
                    >
                      Collapse into ribbon
                    </button>
                  </div>
                )}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
