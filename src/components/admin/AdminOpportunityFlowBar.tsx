import { Layers } from 'lucide-react'
import type { AdminOpportunityMetrics } from '@/services/adminOpportunities'

interface AdminOpportunityFlowBarProps {
  metrics: AdminOpportunityMetrics | null
  activeStatus: string
  onSelectStatus: (status: string) => void
}

export function AdminOpportunityFlowBar({
  metrics,
  activeStatus,
  onSelectStatus,
}: AdminOpportunityFlowBarProps) {
  const total = metrics?.total ?? 0
  const qualified = metrics?.qualified ?? 0
  const newCount = metrics?.newCount ?? 0
  const rejected = metrics?.rejected ?? 0
  const archived = metrics?.archived ?? 0

  const segments = [
    {
      id: '',
      label: 'All Opportunities',
      count: total,
      dotColor: 'bg-indigo-500',
      activeBg: 'bg-foreground text-background',
      badgeBg: 'bg-background/20 text-background',
    },
    {
      id: 'qualified',
      label: 'AI Qualified',
      count: qualified,
      dotColor: 'bg-emerald-500',
      activeBg: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 border-emerald-500/40 ring-2 ring-emerald-500/20',
      badgeBg: 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-200',
    },
    {
      id: 'new',
      label: 'New & Unscreened',
      count: newCount,
      dotColor: 'bg-sky-500',
      activeBg: 'bg-sky-500/15 text-sky-800 dark:text-sky-200 border-sky-500/40 ring-2 ring-sky-500/20',
      badgeBg: 'bg-sky-500/20 text-sky-800 dark:text-sky-200',
    },
    {
      id: 'rejected',
      label: 'Rejected / Filtered',
      count: rejected,
      dotColor: 'bg-rose-500',
      activeBg: 'bg-rose-500/15 text-rose-800 dark:text-rose-200 border-rose-500/40 ring-2 ring-rose-500/20',
      badgeBg: 'bg-rose-500/20 text-rose-800 dark:text-rose-200',
    },
    {
      id: 'archived',
      label: 'Archived',
      count: archived,
      dotColor: 'bg-slate-400',
      activeBg: 'bg-slate-500/15 text-slate-800 dark:text-slate-200 border-slate-500/40 ring-2 ring-slate-500/20',
      badgeBg: 'bg-slate-500/20 text-slate-800 dark:text-slate-200',
    },
  ]

  return (
    <div className="relative w-full rounded-2xl border border-border/70 bg-card/60 p-2 shadow-xs backdrop-blur-xs">
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
        {segments.map((segment) => {
          const isSelected = activeStatus === segment.id
          const hasItems = segment.count > 0

          return (
            <button
              key={segment.id}
              type="button"
              onClick={() => onSelectStatus(isSelected && segment.id !== '' ? '' : segment.id)}
              className={`group flex items-center gap-2 shrink-0 rounded-xl px-3 py-1.5 text-xs font-medium transition-all duration-150 ${
                isSelected
                  ? segment.id === ''
                    ? `${segment.activeBg} font-bold shadow-xs`
                    : `${segment.activeBg} font-bold shadow-xs border`
                  : hasItems
                    ? 'bg-background/90 text-foreground hover:bg-muted/80 border border-border/80 shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/40 border border-border/40 bg-background/40'
              }`}
            >
              {segment.id === '' ? (
                <Layers className="size-3" />
              ) : (
                <span className={`size-2 rounded-full ${segment.dotColor} shrink-0`} />
              )}
              <span className="whitespace-nowrap text-[11px] sm:text-xs">
                {segment.label}
              </span>
              <span
                className={`rounded-full px-1.5 py-0.2 font-mono text-[10px] font-bold ${
                  isSelected
                    ? segment.badgeBg
                    : hasItems
                      ? 'bg-muted text-foreground'
                      : 'bg-muted/80 text-muted-foreground/70'
                }`}
              >
                {segment.count}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

