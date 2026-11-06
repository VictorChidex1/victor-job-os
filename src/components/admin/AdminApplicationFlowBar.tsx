import { Layers } from 'lucide-react'
import {
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUS_ORDER,
} from '@/lib/applications'
import { STAGE_THEMES } from '@/lib/applicationPipeline'

interface AdminApplicationFlowBarProps {
  activeStatus: string
  onSelectStatus: (status: string) => void
}

export function AdminApplicationFlowBar({
  activeStatus,
  onSelectStatus,
}: AdminApplicationFlowBarProps) {
  return (
    <div className="relative w-full rounded-2xl border border-border/70 bg-card/60 p-2 shadow-xs backdrop-blur-xs">
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
        {/* All Stages Toggle */}
        <button
          type="button"
          onClick={() => onSelectStatus('')}
          className={`group flex items-center gap-1.5 shrink-0 rounded-xl px-3 py-1.5 text-xs font-medium transition-all duration-150 ${
            activeStatus === ''
              ? 'bg-foreground text-background font-bold shadow-xs'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/40 border border-border/40 bg-background/40'
          }`}
        >
          <Layers className="size-3" />
          <span className="whitespace-nowrap text-[11px] sm:text-xs">All Applications</span>
        </button>

        {APPLICATION_STATUS_ORDER.map((stageId) => {
          const isSelected = activeStatus === stageId
          const theme = STAGE_THEMES[stageId] ?? STAGE_THEMES['not-started']

          return (
            <button
              key={stageId}
              type="button"
              onClick={() => onSelectStatus(isSelected ? '' : stageId)}
              className={`group flex items-center gap-1.5 shrink-0 rounded-xl px-2.5 sm:px-3 py-1.5 text-xs font-medium transition-all duration-150 ${
                isSelected
                  ? `${theme.badgeBg} ${theme.badgeText} border border-current font-bold ring-2 ring-current/20 shadow-xs`
                  : 'bg-background/90 text-foreground hover:bg-muted/80 border border-border/70 shadow-2xs'
              }`}
            >
              <span className={`size-1.5 rounded-full ${theme.dotColor} shrink-0`} />
              <span className="whitespace-nowrap text-[11px] sm:text-xs font-medium">
                {APPLICATION_STATUS_LABELS[stageId]}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

