import { Button } from '@/components/ui/button'

export function CursorPaginationBar({
  page,
  loading,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
  className,
}: {
  page: number
  loading: boolean
  hasPrev: boolean
  hasNext: boolean
  onPrev: () => void
  onNext: () => void
  className?: string
}) {
  return (
    <div
      className={
        className ??
        'flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-background px-4 py-2'
      }
    >
      <div className="text-xs text-muted-foreground">
        Page {page} · {hasNext ? 'More available' : 'End of results'}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onPrev}
          disabled={!hasPrev || loading}
        >
          Previous
        </Button>
        <span className="min-w-[72px] text-center text-sm font-medium">
          Page {page}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={onNext}
          disabled={!hasNext || loading}
        >
          Next
        </Button>
      </div>
    </div>
  )
}
