import { Link } from 'react-router'
import {
  ArrowUpRight,
  FileText,
  Clock,
  FileEdit,
  SendHorizontal,
  Users,
  Archive,
  Filter,
  X,
} from 'lucide-react'
import { ApplicationStatusBadge } from '@/components/applications/ApplicationStatusBadge'
import {
  formatApplicationDate,
  groupApplicationsByPhase,
  isApplicationOverdue,
  STAGE_THEMES,
  type PhaseId,
} from '@/lib/applicationPipeline'
import { APPLICATION_STATUS_LABELS } from '@/lib/applications'
import { SOURCE_LABELS } from '@/lib/job-sources'
import type { Application, ApplicationStatus } from '@/types/applications'

interface ApplicationBoardProps {
  applications: Application[]
  applicationHref: (id: string) => string
  targetStageId?: string
  onSelectStage?: (stageId?: string) => void
}

const PHASE_ICONS: Record<PhaseId, typeof FileEdit> = {
  prep: FileEdit,
  applied: SendHorizontal,
  interviewing: Users,
  concluded: Archive,
}

const PHASE_COLORS: Record<PhaseId, { badge: string; icon: string; border: string }> = {
  prep: {
    badge: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
    icon: 'text-indigo-500',
    border: 'border-indigo-500/20',
  },
  applied: {
    badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    icon: 'text-blue-500',
    border: 'border-blue-500/20',
  },
  interviewing: {
    badge: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    icon: 'text-purple-500',
    border: 'border-purple-500/20',
  },
  concluded: {
    badge: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20',
    icon: 'text-zinc-500',
    border: 'border-zinc-500/20',
  },
}

const PHASE_EMPTY_MESSAGES: Record<PhaseId, { title: string; subtitle: string }> = {
  prep: {
    title: 'No applications in prep',
    subtitle: 'Add roles from Opportunities to begin drafting and reviewing application materials.',
  },
  applied: {
    title: 'No in-flight applications',
    subtitle: 'When applications are submitted to employers, track progress and assessments here.',
  },
  interviewing: {
    title: 'No active interviews',
    subtitle: 'Upcoming screening calls, technical evaluations, and job offers will appear here.',
  },
  concluded: {
    title: 'No concluded applications',
    subtitle: 'Accepted, withdrawn, and archived roles will be recorded here for reference.',
  },
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

  const stageTheme = STAGE_THEMES[application.status] ?? STAGE_THEMES['not-started']

  return (
    <Link
      to={href}
      className="group relative block rounded-2xl border border-border/70 bg-card p-3.5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      {/* Top Header with Monogram and Stage Badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-muted/50 font-mono text-[10px] font-bold text-foreground transition-colors group-hover:border-primary/40 group-hover:bg-primary/10 group-hover:text-primary">
            {companyInitials}
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {application.companyName || 'Unknown company'}
            </div>
          </div>
        </div>

        {/* Stage Badge */}
        <span
          className={`inline-flex items-center gap-1 shrink-0 rounded-md px-1.5 py-0.5 font-mono text-[9px] font-bold ${stageTheme.badgeBg} ${stageTheme.badgeText}`}
        >
          <span className={`size-1.5 rounded-full ${stageTheme.dotColor}`} />
          {APPLICATION_STATUS_LABELS[application.status]}
        </span>
      </div>

      {/* Role Title */}
      <div className="mt-2 flex items-start justify-between gap-1.5">
        <div className="line-clamp-2 text-xs sm:text-sm font-bold leading-snug text-foreground transition-colors group-hover:text-primary">
          {application.jobTitle}
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
  onSelectStage,
}: ApplicationBoardProps) {
  const phases = groupApplicationsByPhase(applications)
  const now = new Date()

  const matchingFilterCount = targetStageId
    ? applications.filter((app) => app.status === targetStageId).length
    : applications.length

  return (
    <div className="space-y-3">
      {/* Active Filter Strip when filtering by specific sub-stage */}
      {targetStageId && (
        <div className="flex items-center justify-between rounded-xl border border-primary/25 bg-primary/5 px-3.5 py-2 text-xs">
          <div className="flex items-center gap-2">
            <Filter className="size-3.5 text-primary" />
            <span className="text-muted-foreground">Filtered by stage:</span>
            <span className="font-semibold text-foreground">
              {APPLICATION_STATUS_LABELS[targetStageId as ApplicationStatus] ?? targetStageId}
            </span>
            <span className="font-mono text-[11px] text-muted-foreground">
              ({matchingFilterCount} application{matchingFilterCount === 1 ? '' : 's'})
            </span>
          </div>
          <button
            type="button"
            onClick={() => onSelectStage?.(undefined)}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-primary hover:bg-primary/10 transition-colors"
          >
            <X className="size-3" />
            Clear filter
          </button>
        </div>
      )}

      {/* 4 Balanced Macro Phase Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 w-full items-start">
        {phases.map((phase) => {
          const Icon = PHASE_ICONS[phase.id]
          const colors = PHASE_COLORS[phase.id]
          const emptyInfo = PHASE_EMPTY_MESSAGES[phase.id]

          // Filter within this phase if targetStageId is set
          const visibleApplications = targetStageId
            ? phase.applications.filter((app) => app.status === targetStageId)
            : phase.applications

          const isPhaseActiveForFilter = targetStageId
            ? phase.statuses.includes(targetStageId as ApplicationStatus)
            : false

          return (
            <section
              key={phase.id}
              id={`phase-col-${phase.id}`}
              className={`flex flex-col gap-3 rounded-2xl border bg-muted/20 p-3.5 shadow-2xs transition-all ${
                isPhaseActiveForFilter
                  ? 'border-primary/40 ring-1 ring-primary/20 bg-muted/30'
                  : 'border-border/70'
              }`}
              aria-label={`${phase.label}: ${visibleApplications.length} application${visibleApplications.length === 1 ? '' : 's'}`}
            >
              {/* Phase Header */}
              <header className="flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`flex size-6 shrink-0 items-center justify-center rounded-lg border ${colors.badge}`}
                    >
                      <Icon className={`size-3.5 ${colors.icon}`} />
                    </span>
                    <div className="min-w-0">
                      <h2 className="truncate text-xs font-bold uppercase tracking-wider text-foreground">
                        {phase.label}
                      </h2>
                    </div>
                  </div>

                  <span
                    className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-bold ${
                      visibleApplications.length > 0
                        ? `${colors.badge} shadow-2xs`
                        : 'bg-background/80 text-muted-foreground ring-1 ring-border/50'
                    }`}
                  >
                    {visibleApplications.length}
                  </span>
                </div>

                <p className="text-[11px] text-muted-foreground/80 line-clamp-1">
                  {phase.description}
                </p>

                {/* Sub-Stage Filter Chips */}
                <div className="flex flex-wrap items-center gap-1 pt-2 border-t border-border/40">
                  {phase.statuses.map((status) => {
                    const stageTheme = STAGE_THEMES[status] ?? STAGE_THEMES['not-started']
                    const count = phase.subStageCounts[status] ?? 0
                    const isSelected = targetStageId === status

                    return (
                      <button
                        key={status}
                        type="button"
                        onClick={() => onSelectStage?.(isSelected ? undefined : status)}
                        title={`Filter by ${APPLICATION_STATUS_LABELS[status]} (${count})`}
                        className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium transition-all ${
                          isSelected
                            ? `${stageTheme.badgeBg} ${stageTheme.badgeText} border border-current font-bold ring-1 ring-current/20 shadow-2xs`
                            : count > 0
                              ? 'bg-background/80 text-foreground border border-border/60 hover:bg-muted/80'
                              : 'text-muted-foreground/60 hover:text-muted-foreground hover:bg-muted/40 border border-transparent'
                        }`}
                      >
                        <span className={`size-1.5 rounded-full ${stageTheme.dotColor}`} />
                        <span className="whitespace-nowrap">{APPLICATION_STATUS_LABELS[status]}</span>
                        <span className="font-mono text-[9px] opacity-80">{count}</span>
                      </button>
                    )
                  })}
                </div>
              </header>

              {/* Column Applications List */}
              <div className="flex flex-col gap-2.5 min-h-[140px]">
                {visibleApplications.map((application) => (
                  <ApplicationCard
                    key={application.id}
                    application={application}
                    href={applicationHref(application.id)}
                    closed={phase.id === 'concluded'}
                    now={now}
                  />
                ))}

                {visibleApplications.length === 0 && (
                  <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-border/70 bg-background/40 p-5 text-center text-xs text-muted-foreground">
                    {targetStageId ? (
                      <>
                        <p className="font-medium text-foreground/80">
                          No applications in {APPLICATION_STATUS_LABELS[targetStageId as ApplicationStatus] ?? targetStageId}
                        </p>
                        <button
                          type="button"
                          onClick={() => onSelectStage?.(undefined)}
                          className="mt-1.5 text-[11px] font-medium text-primary hover:underline inline-block"
                        >
                          Clear stage filter
                        </button>
                      </>
                    ) : (
                      <>
                        <p className="font-medium text-foreground/80">{emptyInfo.title}</p>
                        <p className="mt-1 text-[11px] text-muted-foreground/80 leading-relaxed max-w-[220px]">
                          {emptyInfo.subtitle}
                        </p>
                      </>
                    )}
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
