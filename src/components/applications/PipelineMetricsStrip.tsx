import { Briefcase, AlertCircle, Users, Trophy } from 'lucide-react'
import type { ApplicationSummary } from '@/lib/applicationPipeline'

interface PipelineMetricsStripProps {
  summary: ApplicationSummary
  needsReviewCount?: number
}

export function PipelineMetricsStrip({ summary, needsReviewCount = 0 }: PipelineMetricsStripProps) {
  const metrics = [
    {
      label: 'Active Pipeline',
      value: summary.active,
      subtitle: `${summary.total} total recorded`,
      icon: Briefcase,
      color: 'text-primary',
      bg: 'bg-primary/10 border-primary/20',
      badge: summary.active > 0 ? 'Live' : undefined,
      badgeColor: 'bg-primary/10 text-primary border-primary/25',
    },
    {
      label: 'Review Required',
      value: needsReviewCount,
      subtitle: needsReviewCount === 1 ? '1 application awaits approval' : `${needsReviewCount} awaiting approval`,
      icon: AlertCircle,
      color: needsReviewCount > 0 ? 'text-amber-500' : 'text-muted-foreground',
      bg: needsReviewCount > 0 ? 'bg-amber-500/10 border-amber-500/30' : 'bg-muted/40 border-border/50',
      badge: needsReviewCount > 0 ? 'Action Due' : undefined,
      badgeColor: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 animate-pulse',
    },
    {
      label: 'Interviews & Tech Tests',
      value: summary.interviewing,
      subtitle: `${summary.submitted} submitted applications`,
      icon: Users,
      color: summary.interviewing > 0 ? 'text-purple-500' : 'text-muted-foreground',
      bg: summary.interviewing > 0 ? 'bg-purple-500/10 border-purple-500/30' : 'bg-muted/40 border-border/50',
      badge: summary.interviewing > 0 ? 'Active' : undefined,
      badgeColor: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30',
    },
    {
      label: 'Offers & Final Rounds',
      value: summary.offers,
      subtitle: summary.nextActionsDue > 0 ? `${summary.nextActionsDue} follow-ups pending` : 'Funnel on track',
      icon: Trophy,
      color: summary.offers > 0 ? 'text-emerald-500' : 'text-muted-foreground',
      bg: summary.offers > 0 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-muted/40 border-border/50',
      badge: summary.offers > 0 ? 'Offer In' : undefined,
      badgeColor: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {metrics.map((metric) => {
        const Icon = metric.icon

        return (
          <div
            key={metric.label}
            className="group relative flex flex-col justify-between rounded-2xl border border-border/70 bg-card/70 p-3.5 sm:p-4 shadow-xs backdrop-blur-xs transition-all duration-200 hover:border-border hover:bg-card hover:shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {metric.label}
              </span>
              <span
                className={`flex size-7 shrink-0 items-center justify-center rounded-xl border ${metric.bg} ${metric.color} transition-transform group-hover:scale-105`}
              >
                <Icon className="size-3.5" />
              </span>
            </div>

            <div className="mt-2.5 flex items-baseline justify-between gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                {metric.value}
              </span>
              {metric.badge && (
                <span
                  className={`rounded-full border px-2 py-0.5 font-mono text-[9px] font-semibold ${metric.badgeColor}`}
                >
                  {metric.badge}
                </span>
              )}
            </div>

            <p className="mt-1 text-[11px] text-muted-foreground/80 truncate">
              {metric.subtitle}
            </p>
          </div>
        )
      })}
    </div>
  )
}
