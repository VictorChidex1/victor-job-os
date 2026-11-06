import { FileText, Layers, Sparkles, Star } from 'lucide-react'
import type { AdminResumeMetrics } from '@/services/adminResumes'
import type { AdminResumeDefaultFilter } from '@/services/adminResumes'

type ResumeMetricFilter = AdminResumeDefaultFilter | 'diversity'

interface AdminResumeMetricsStripProps {
  metrics: AdminResumeMetrics | null
  loading: boolean
  selectedFilter: AdminResumeDefaultFilter
  onSelectFilter: (filter: AdminResumeDefaultFilter) => void
}

export function AdminResumeMetricsStrip({
  metrics,
  loading,
  selectedFilter,
  onSelectFilter,
}: AdminResumeMetricsStripProps) {
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
  const defaultBaselines = metrics?.defaultBaselines ?? 0
  const tailoredVariants = metrics?.tailoredVariants ?? 0
  const tailoredPct = total > 0 ? Math.round((tailoredVariants / total) * 100) : 0

  const items = [
    {
      id: 'all' as AdminResumeDefaultFilter,
      label: 'Resume Portfolio',
      value: total,
      subtitle: 'Total cross-user assets',
      icon: FileText,
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-500/10 border-indigo-500/20',
      badge: 'Portfolio',
      badgeColor: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
      isSelected: selectedFilter === 'all',
    },
    {
      id: 'default' as AdminResumeDefaultFilter,
      label: 'Primary Baselines',
      value: defaultBaselines,
      subtitle: 'Core root templates',
      icon: Star,
      color: 'text-amber-500 dark:text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20',
      badge: 'Base',
      badgeColor: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
      isSelected: selectedFilter === 'default',
    },
    {
      id: 'non-default' as AdminResumeDefaultFilter,
      label: 'Tailored Variants',
      value: tailoredVariants,
      subtitle: 'Role & job customizations',
      icon: Layers,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-500/10 border-purple-500/20',
      badge: 'Tailored',
      badgeColor: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30',
      isSelected: selectedFilter === 'non-default',
    },
    {
      id: 'diversity' as ResumeMetricFilter,
      label: 'Tailoring Ratio',
      value: `${tailoredPct}%`,
      subtitle: `${tailoredVariants} of ${total} customized`,
      icon: Sparkles,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
      badge: 'Optimization',
      badgeColor: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
      isSelected: false,
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon
        return (
          <button
            key={item.label}
            type="button"
            onClick={() => {
              if (item.id !== 'diversity') onSelectFilter(item.id)
            }}
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
                {typeof item.value === 'number'
                  ? item.value.toLocaleString()
                  : item.value}
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
