import { Briefcase, Sparkles, Clock, Ban } from 'lucide-react'
import type { AdminOpportunityMetrics } from '@/services/adminOpportunities'

interface AdminOpportunityMetricsStripProps {
  metrics: AdminOpportunityMetrics | null
  loading: boolean
  selectedStatus: string
  onSelectStatus: (status: string) => void
}

export function AdminOpportunityMetricsStrip({
  metrics,
  loading,
  selectedStatus,
  onSelectStatus,
}: AdminOpportunityMetricsStripProps) {
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
  const qualified = metrics?.qualified ?? 0
  const newCount = metrics?.newCount ?? 0
  const rejected = metrics?.rejected ?? 0

  const qualifiedPct = total > 0 ? Math.round((qualified / total) * 100) : 0
  const rejectedPct = total > 0 ? Math.round((rejected / total) * 100) : 0

  const items = [
    {
      id: '',
      label: 'Total Indexed',
      value: total,
      subtitle: 'Cross-user opportunity stream',
      icon: Briefcase,
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-500/10 border-indigo-500/20',
      badge: 'All leads',
      badgeColor: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
      isSelected: selectedStatus === '',
    },
    {
      id: 'qualified',
      label: 'AI Qualified',
      value: qualified,
      subtitle: `${qualifiedPct}% matched user criteria`,
      icon: Sparkles,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
      badge: `${qualifiedPct}% pass`,
      badgeColor: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
      isSelected: selectedStatus === 'qualified',
    },
    {
      id: 'new',
      label: 'New & Unscreened',
      value: newCount,
      subtitle: 'Freshly crawled opportunities',
      icon: Clock,
      color: 'text-sky-600 dark:text-sky-400',
      bg: 'bg-sky-500/10 border-sky-500/20',
      badge: 'Queue',
      badgeColor: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30',
      isSelected: selectedStatus === 'new',
    },
    {
      id: 'rejected',
      label: 'Filtered Out',
      value: rejected,
      subtitle: `${rejectedPct}% below threshold`,
      icon: Ban,
      color: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-500/10 border-rose-500/20',
      badge: 'Rejected',
      badgeColor: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
      isSelected: selectedStatus === 'rejected',
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
            onClick={() => onSelectStatus(item.isSelected && item.id !== '' ? '' : item.id)}
            className={`group relative flex flex-col justify-between text-left rounded-2xl border p-4 shadow-xs backdrop-blur-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              item.isSelected
                ? 'border-indigo-500/60 bg-card ring-2 ring-indigo-500/20 shadow-xs'
                : 'border-border/70 bg-card/70 hover:border-border hover:bg-card'
            }`}
          >
            <div className="flex items-start justify-between gap-2 w-full">
              <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {item.label}
              </span>
              <span
                className={`flex size-7 shrink-0 items-center justify-center rounded-xl border ${item.bg} ${item.color} transition-transform group-hover:scale-105`}
              >
                <Icon className="size-3.5" />
              </span>
            </div>

            <div className="mt-3 flex items-baseline justify-between gap-2 w-full">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-mono">
                {item.value}
              </span>
              <span
                className={`rounded-full border px-2 py-0.5 font-mono text-[9px] font-semibold ${item.badgeColor}`}
              >
                {item.badge}
              </span>
            </div>

            <p className="mt-1 text-[11px] text-muted-foreground/80 truncate w-full">
              {item.subtitle}
            </p>
          </button>
        )
      })}
    </div>
  )
}

