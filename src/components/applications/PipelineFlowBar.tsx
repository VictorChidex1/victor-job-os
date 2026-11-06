import { ChevronRight } from 'lucide-react'
import {
  ACTIVE_APPLICATION_STAGES,
  STAGE_THEMES,
  type ApplicationColumn,
} from '@/lib/applicationPipeline'

interface PipelineFlowBarProps {
  columns: ApplicationColumn[]
  activeStageId?: string
  onSelectStage: (stageId: string) => void
}

export function PipelineFlowBar({
  columns,
  activeStageId,
  onSelectStage,
}: PipelineFlowBarProps) {
  // Ordered sequence of all 9 stages
  const stageOrder = [...ACTIVE_APPLICATION_STAGES, 'closed']
  const columnMap = new Map(columns.map((c) => [c.id, c]))

  return (
    <div className="relative w-full rounded-2xl border border-border/70 bg-card/50 p-2 shadow-xs backdrop-blur-xs">
      <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
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
                onClick={() => onSelectStage(stageId)}
                title={`${col.label} (${count}) · ${theme.description}`}
                className={`group flex items-center gap-2 rounded-xl px-2.5 sm:px-3 py-1.5 text-xs font-medium transition-all duration-150 ${
                  isSelected
                    ? 'bg-primary/10 text-primary border border-primary/30 shadow-2xs'
                    : hasItems
                      ? 'bg-background/80 text-foreground hover:bg-muted/80 border border-border/70 shadow-2xs'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/40 border border-transparent'
                }`}
              >
                <span className={`size-2 rounded-full ${theme.dotColor} shrink-0`} />
                <span className="font-semibold whitespace-nowrap text-[11px] sm:text-xs">
                  {col.label}
                </span>
                <span
                  className={`rounded-full px-1.5 py-0.2 font-mono text-[10px] font-bold ${
                    hasItems
                      ? `${theme.badgeBg} ${theme.badgeText}`
                      : 'bg-muted/80 text-muted-foreground/70'
                  }`}
                >
                  {count}
                </span>
              </button>

              {index < stageOrder.length - 1 && (
                <ChevronRight className="size-3 text-muted-foreground/40 mx-0.5 shrink-0" />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

