import { Layers } from 'lucide-react'

interface AdminOutreachFlowBarProps {
  activeStatus: string
  onSelectStatus: (status: string) => void
}

const OUTREACH_STAGES = [
  { id: 'draft', label: 'Draft', dotColor: 'bg-slate-400' },
  { id: 'needs-review', label: 'Needs Review', dotColor: 'bg-amber-500' },
  { id: 'approved', label: 'Approved', dotColor: 'bg-teal-500' },
  { id: 'scheduled', label: 'Scheduled', dotColor: 'bg-sky-500' },
  { id: 'sent', label: 'Sent', dotColor: 'bg-blue-500' },
  { id: 'replied', label: 'Replied', dotColor: 'bg-emerald-500' },
  { id: 'follow-up-due', label: 'Follow-up Due', dotColor: 'bg-rose-500' },
  { id: 'closed', label: 'Closed', dotColor: 'bg-zinc-400' },
]

export function AdminOutreachFlowBar({
  activeStatus,
  onSelectStatus,
}: AdminOutreachFlowBarProps) {
  return (
    <div className="relative w-full rounded-2xl border border-border/70 bg-card/60 p-2 shadow-xs backdrop-blur-xs">
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
        {/* All Outreach Toggle */}
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
          <span className="whitespace-nowrap text-[11px] sm:text-xs">All Outreach</span>
        </button>

        {OUTREACH_STAGES.map((stage) => {
          const isSelected = activeStatus === stage.id

          return (
            <button
              key={stage.id}
              type="button"
              onClick={() => onSelectStatus(isSelected ? '' : stage.id)}
              className={`group flex items-center gap-1.5 shrink-0 rounded-xl px-2.5 sm:px-3 py-1.5 text-xs font-medium transition-all duration-150 ${
                isSelected
                  ? 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/40 font-bold ring-2 ring-indigo-500/20 shadow-xs'
                  : 'bg-background/90 text-foreground hover:bg-muted/80 border border-border/70 shadow-2xs'
              }`}
            >
              <span className={`size-1.5 rounded-full ${stage.dotColor} shrink-0`} />
              <span className="whitespace-nowrap text-[11px] sm:text-xs font-medium">
                {stage.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

