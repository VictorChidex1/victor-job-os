import { AlertCircle, CheckCircle2, MessageSquareQuote, Send } from 'lucide-react'
import type { AdminOutreachMetrics } from '@/services/adminOutreach'

interface AdminOutreachMetricsStripProps {
  metrics: AdminOutreachMetrics | null
  loading: boolean
  selectedStatus: string
  onSelectStatus: (status: string) => void
}

export function AdminOutreachMetricsStrip({
  metrics,
  loading,
  selectedStatus,
  onSelectStatus,
}: AdminOutreachMetricsStripProps) {
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
  const sent = metrics?.sent ?? 0
  const needsReview = metrics?.needsReview ?? 0
  const replied = metrics?.replied ?? 0
  const followUpDue = metrics?.followUpDue ?? 0
  const conversations = replied + followUpDue

  const items = [
    {
      id: '',
      label: 'Total Outreach',
      value: total,
      subtitle: `${metrics?.draft ?? 0} drafts across workspace`,
      icon: Send,
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-500/10 border-indigo-500/20',
      badge: 'All messages',
      badgeColor: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
      isSelected: selectedStatus === '',
    },
    {
      id: 'needs-review',
      label: 'Review Required',
      value: needsReview,
      subtitle: needsReview === 1 ? '1 pitch awaits sign-off' : `${needsReview} pitches await sign-off`,
      icon: AlertCircle,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20',
      badge: 'Action Due',
      badgeColor: needsReview > 0
        ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40 animate-pulse'
        : 'bg-muted text-muted-foreground border-border',
      isSelected: selectedStatus === 'needs-review',
    },
    {
      id: 'sent',
      label: 'Delivered & In-Flight',
      value: sent,
      subtitle: 'Dispatched to target recruiters',
      icon: CheckCircle2,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-500/10 border-blue-500/20',
      badge: 'Delivered',
      badgeColor: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30',
      isSelected: selectedStatus === 'sent',
    },
    {
      id: 'replied',
      label: 'Replies & Follow-ups',
      value: conversations,
      subtitle: `${replied} replied · ${followUpDue} due now`,
      icon: MessageSquareQuote,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
      badge: conversations > 0 ? 'Active' : 'Cadence',
      badgeColor: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
      isSelected: selectedStatus === 'replied' || selectedStatus === 'follow-up-due',
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

