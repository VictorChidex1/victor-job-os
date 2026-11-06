import { FileText, LayoutGrid, Layers, List, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { AdminResumeMetrics } from '@/services/adminResumes'
import type { AdminResumeDefaultFilter } from '@/services/adminResumes'

interface AdminResumeFlowBarProps {
  metrics: AdminResumeMetrics | null
  selectedFilter: AdminResumeDefaultFilter
  onSelectFilter: (filter: AdminResumeDefaultFilter) => void
  viewMode: 'grid' | 'table'
  onViewModeChange: (mode: 'grid' | 'table') => void
}

export function AdminResumeFlowBar({
  metrics,
  selectedFilter,
  onSelectFilter,
  viewMode,
  onViewModeChange,
}: AdminResumeFlowBarProps) {
  const segments: Array<{
    id: AdminResumeDefaultFilter
    label: string
    count?: number
    icon: typeof FileText
    activeClass: string
  }> = [
    {
      id: 'all',
      label: 'All Variants',
      count: metrics?.total,
      icon: FileText,
      activeClass:
        'border-primary bg-primary/10 text-primary font-bold shadow-xs',
    },
    {
      id: 'default',
      label: 'Default Baselines',
      count: metrics?.defaultBaselines,
      icon: Star,
      activeClass:
        'border-amber-500 bg-amber-500/15 text-amber-800 dark:text-amber-300 font-bold shadow-xs',
    },
    {
      id: 'non-default',
      label: 'Tailored Variants',
      count: metrics?.tailoredVariants,
      icon: Layers,
      activeClass:
        'border-purple-500 bg-purple-500/15 text-purple-800 dark:text-purple-300 font-bold shadow-xs',
    },
  ]

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card/60 p-2 text-xs">
      {/* Filter segments */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="px-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Filter:
        </span>
        {segments.map((segment) => {
          const isSelected = selectedFilter === segment.id
          const Icon = segment.icon
          return (
            <button
              key={segment.id}
              type="button"
              onClick={() => onSelectFilter(segment.id)}
              className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 transition-all ${
                isSelected
                  ? segment.activeClass
                  : 'border-transparent text-muted-foreground hover:border-border hover:bg-muted/50 hover:text-foreground'
              }`}
            >
              <Icon className="size-3.5 shrink-0" />
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

      {/* View Toggle */}
      <div className="flex items-center rounded-xl border border-border/80 bg-background/80 p-0.5">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onViewModeChange('grid')}
          className={`h-7 px-2.5 rounded-lg text-xs gap-1.5 ${
            viewMode === 'grid'
              ? 'bg-muted text-foreground font-bold shadow-2xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <LayoutGrid className="size-3.5" />
          <span>Cards</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onViewModeChange('table')}
          className={`h-7 px-2.5 rounded-lg text-xs gap-1.5 ${
            viewMode === 'table'
              ? 'bg-muted text-foreground font-bold shadow-2xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <List className="size-3.5" />
          <span>Table</span>
        </Button>
      </div>
    </div>
  )
}

