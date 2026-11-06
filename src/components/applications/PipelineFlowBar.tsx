import { ChevronRight, Layers } from 'lucide-react'
import {
  ACTIVE_APPLICATION_STAGES,
  STAGE_THEMES,
  type ApplicationColumn,
} from '@/lib/applicationPipeline'

interface PipelineFlowBarProps {
  columns: ApplicationColumn[]
  activeStageId?: string
  onSelectStage: (stageId?: string) => void
}

export function PipelineFlowBar({
  columns,
  activeStageId,
  onSelectStage,
}: PipelineFlowBarProps) {
  // Ordered sequence of all 9 stages
  const stageOrder = [...ACTIVE_APPLICATION_STAGES, 'closed']
  const columnMap = new Map(columns.map((c) => [c.id, c]))
  const totalCount = columns.reduce((sum, c) => sum + c.count, 0)

  return (
    <div className="relative w-full rounded-2xl border border-border/70 bg-card/60 p-2 shadow-xs backdrop-blur-xs">
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
        {/* All Stages Reset/Toggle Button */}
        <button
          type="button"
          onClick={() => onSelectStage(undefined)}
          className={`group flex items-center gap-1.5 shrink-0 rounded-xl px-2.5 sm:px-3 py-1.5 text-xs font-medium transition-all duration-150 ${
            !activeStageId
              ? 'bg-foreground text-background font-semibold shadow-xs'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/60 border border-border/60 bg-background/50'
          }`}
          title="Show all stages"
        >
          <Layers className="size-3" />
          <span className="whitespace-nowrap text-[11px] sm:text-xs">All Stages</span>
          <span
            className={`rounded-full px-1.5 py-0.2 font-mono text-[10px] font-bold ${
              !activeStageId
                ? 'bg-background/20 text-background'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {totalCount}
          </span>
        </button>

        <ChevronRight className="size-3 text-muted-foreground/30 mx-0.5 shrink-0" />

        {stageOrder.map((stageId, index) => {
          const col = columnMap.get(stageId)
          if (!col) return null

          const theme = STAGE_THEMES[stageId] ?? STAGE_THEMES['not-started']
          const count = col.count
          const isSelected = activeStageId === stageId
          const hasItems = count > 0

          return (
            <div key={stageId} className="flex items-center shrink-0">
              <button
                type="button"
                onClick={() => onSelectStage(isSelected ? undefined : stageId)}
                title={`${col.label} (${count}) · ${theme.description}${isSelected ? ' (Click to clear filter)' : ''}`}
                className={`group flex items-center gap-2 rounded-xl px-2.5 sm:px-3 py-1.5 text-xs font-medium transition-all duration-150 ${
                  isSelected
                    ? `${theme.badgeBg} ${theme.badgeText} border border-current shadow-xs ring-2 ring-current/20 font-bold`
                    : hasItems
                      ? 'bg-background/90 text-foreground hover:bg-muted/80 border border-border/80 shadow-2xs'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/40 border border-border/40 bg-background/40'
                }`}
              >
                <span className={`size-2 rounded-full ${theme.dotColor} shrink-0`} />
                <span className="font-semibold whitespace-nowrap text-[11px] sm:text-xs">
                  {col.label}
                </span>
                <span
                  className={`rounded-full px-1.5 py-0.2 font-mono text-[10px] font-bold ${
                    isSelected
                      ? 'bg-current/15'
                      : hasItems
                        ? `${theme.badgeBg} ${theme.badgeText}`
                        : 'bg-muted/80 text-muted-foreground/70'
                  }`}
                >
                  {count}
                </span>
              </button>

              {index < stageOrder.length - 1 && (
                <ChevronRight className="size-3 text-muted-foreground/30 mx-0.5 shrink-0" />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
