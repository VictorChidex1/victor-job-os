import { AlertCircle, Briefcase, Building2, Sparkles } from 'lucide-react'
import type { AdminCompanyMetrics } from '@/services/adminCompanies'

interface AdminCompanyMetricsStripProps {
  metrics: AdminCompanyMetrics | null
  loading: boolean
  selectedResearch: string
  onSelectResearch: (research: string) => void
}

export function AdminCompanyMetricsStrip({
  metrics,
  loading,
  selectedResearch,
  onSelectResearch,
}: AdminCompanyMetricsStripProps) {
  if (loading && !metrics) {
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-2xl border border-border/70 bg-card/60 p-4"
          />
        ))}
      </div>
    )
  }

  const total = metrics?.total ?? 0
  const researched = metrics?.researched ?? 0
  const unresearched = metrics?.unresearched ?? 0
  const withJobs = metrics?.withJobs ?? 0
  const researchPct = total > 0 ? Math.round((researched / total) * 100) : 0

  const items = [
    {
      id: 'all',
      label: 'Tracked Directory',
      value: total,
      subtitle: 'Total enterprise profiles',
      icon: Building2,
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-500/10 border-indigo-500/20',
      badge: 'Live',
      badgeColor: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
      isSelected: selectedResearch === 'all',
    },
    {
      id: 'researched',
      label: 'Enriched Intelligence',
      value: researched,
      subtitle: `${researchPct}% intelligence coverage`,
      icon: Sparkles,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
      badge: 'Enriched',
      badgeColor: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
      isSelected: selectedResearch === 'researched',
    },
    {
      id: 'unresearched',
      label: 'Research Backlog',
      value: unresearched,
      subtitle: unresearched === 1 ? '1 company awaits AI research' : `${unresearched} awaiting AI research`,
      icon: AlertCircle,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20',
      badge: 'Queue',
      badgeColor: unresearched > 0
        ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40 animate-pulse'
        : 'bg-muted text-muted-foreground border-border',
      isSelected: selectedResearch === 'unresearched',
    },
    {
      id: 'hiring-hubs',
      label: 'Active Hiring Hubs',
      value: withJobs,
      subtitle: 'Profiles with active roles',
      icon: Briefcase,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-500/10 border-blue-500/20',
      badge: 'Active',
      badgeColor: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30',
      isSelected: false,
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelectResearch(item.id === 'hiring-hubs' ? 'all' : item.id)}
            className={`group relative flex flex-col justify-between rounded-2xl border p-4 text-left transition-all hover:shadow-md ${
              item.isSelected
                ? 'border-primary ring-2 ring-primary/20 bg-card shadow-sm'
                : 'border-border/70 bg-card hover:border-border'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div
                  className={`flex size-8 shrink-0 items-center justify-center rounded-xl border ${item.bg}`}
                >
                  <Icon className={`size-4 ${item.color}`} />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {item.label}
                </span>
              </div>
              <span
                className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${item.badgeColor}`}
              >
                {item.badge}
              </span>
            </div>

            <div className="mt-4 flex items-baseline justify-between gap-2">
              <span className="font-mono text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                {item.value.toLocaleString()}
              </span>
              <span className="text-[11px] text-muted-foreground text-right truncate">
                {item.subtitle}
              </span>
            </div>
          </button>
        )
      })}
    </div>
  )
}

