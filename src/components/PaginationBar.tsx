import { Button } from '@/components/ui/button'

interface PaginationBarProps {
  page: number
  totalPages: number
  total: number
  itemLabel: string
  loading: boolean
  hasPrev: boolean
  hasNext: boolean
  onPrev: () => void
  onNext: () => void
}

export function PaginationBar({
  page,
  totalPages,
  total,
  itemLabel,
  loading,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
}: PaginationBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-background px-4 py-2">
      <div className="text-xs text-muted-foreground">
        {total} {itemLabel} · Page {page} of {totalPages}
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onPrev} disabled={!hasPrev || loading}>
          Previous
        </Button>
        <span className="min-w-[100px] text-center text-sm font-medium">
          Page {page} of {totalPages}
        </span>
        <Button variant="outline" size="sm" onClick={onNext} disabled={!hasNext || loading}>
          Next
        </Button>
      </div>
    </div>
  )
}
