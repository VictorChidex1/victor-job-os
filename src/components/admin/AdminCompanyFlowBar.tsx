import { Sparkles, Building2, Clock3 } from 'lucide-react'
import type { AdminCompanyMetrics } from '@/services/adminCompanies'
import type { AdminCompanyResearchFilter } from '@/services/adminCompanies'

interface AdminCompanyFlowBarProps {
  metrics: AdminCompanyMetrics | null
  selectedResearch: AdminCompanyResearchFilter
  onSelectResearch: (research: AdminCompanyResearchFilter) => void
}

export function AdminCompanyFlowBar({
  metrics,
  selectedResearch,
  onSelectResearch,
}: AdminCompanyFlowBarProps) {
  const segments: Array<{
    id: AdminCompanyResearchFilter
    label: string
    count?: number
    icon: typeof Building2
    dotColor: string
    activeClass: string
  }> = [
    {
      id: 'all',
      label: 'All Companies',
      count: metrics?.total,
      icon: Building2,
      dotColor: 'bg-slate-400 dark:bg-slate-500',
      activeClass:
        'border-primary bg-primary/10 text-primary font-bold shadow-xs',
    },
    {
      id: 'researched',
      label: 'Researched Intelligence',
      count: metrics?.researched,
      icon: Sparkles,
      dotColor: 'bg-emerald-500',
      activeClass:
        'border-emerald-500 bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 font-bold shadow-xs',
    },
    {
      id: 'unresearched',
      label: 'Unresearched Backlog',
      count: metrics?.unresearched,
      icon: Clock3,
      dotColor: 'bg-amber-500',
      activeClass:
        'border-amber-500 bg-amber-500/15 text-amber-800 dark:text-amber-300 font-bold shadow-xs',
    },
  ]

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border/70 bg-card/60 p-2 text-xs">
      <span className="px-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        Directory View:
      </span>
      {segments.map((segment) => {
        const isSelected = selectedResearch === segment.id
        return (
          <button
            key={segment.id}
            type="button"
            onClick={() => onSelectResearch(segment.id)}
            className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 transition-all ${
              isSelected
                ? segment.activeClass
                : 'border-transparent text-muted-foreground hover:border-border hover:bg-muted/50 hover:text-foreground'
            }`}
          >
            <span
              className={`size-2 shrink-0 rounded-full ${segment.dotColor}`}
            />
            <span>{segment.label}</span>
            {segment.count !== undefined && (
              <span
                className={`rounded-full px-1.5 py-0.2 font-mono text-[10px] font-bold ${
                  isSelected
                    ? 'bg-background/80 text-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {segment.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

