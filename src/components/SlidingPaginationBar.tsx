import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { paginationWindow } from '@/lib/paginationWindow'
import { cn } from '@/lib/utils'

export function SlidingPaginationBar({
  page,
  totalPages,
  loading,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
  className,
}: {
  page: number
  totalPages: number
  loading: boolean
  hasPrev: boolean
  hasNext: boolean
  onPrev: () => void
  onNext: () => void
  className?: string
}) {
  const window = paginationWindow(page, totalPages)
  const safeTotal = window.totalPages
  const safePage = window.page
  const windowStart = window.start
  const windowEnd = window.end
  const [pendingPage, setPendingPage] = useState<number | null>(null)
  const navigationStepRef = useRef<number | null>(null)

  // oxlint-disable-next-line react/set-state-in-effect -- sequential page navigation depends on the parent page changing
  useEffect(() => {
    if (pendingPage === null) {
      navigationStepRef.current = null
      return
    }
    if (safePage === pendingPage) {
      navigationStepRef.current = null
      // oxlint-disable-next-line react/set-state-in-effect -- the requested page has been reached
      setPendingPage(null)
      return
    }
    if (loading) return
    if (navigationStepRef.current === safePage) return

    navigationStepRef.current = safePage
    if (safePage < pendingPage && hasNext) {
      onNext()
      return
    }
    if (safePage > pendingPage && hasPrev) {
      onPrev()
      return
    }
    navigationStepRef.current = null
    // oxlint-disable-next-line react/set-state-in-effect -- the requested page cannot be reached
    setPendingPage(null)
  }, [pendingPage, safePage, loading, hasPrev, hasNext, onNext, onPrev])

  const navigating = pendingPage !== null || loading
  const pages = window.pages

  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-background px-3 py-2',
        className,
      )}
    >
      <div className="text-xs text-muted-foreground">
        Page {safePage} of {safeTotal}
      </div>

      <div className="flex flex-wrap items-center gap-1">
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => {
            navigationStepRef.current = null
            setPendingPage(null)
            onPrev()
          }}
          disabled={!hasPrev || navigating}
          aria-label="Previous page"
        >
          <ChevronLeft />
        </Button>

        {windowStart > 1 && (
          <span className="px-1 text-xs text-muted-foreground" aria-hidden="true">
            …
          </span>
        )}

        {pages.map((pageNumber) => {
          const active = pageNumber === safePage
          const pending = pageNumber === pendingPage
          return (
            <Button
              key={pageNumber}
              variant={active ? 'default' : 'ghost'}
              size="icon-sm"
              className={cn(
                'min-w-8 font-mono text-xs',
                active && 'pointer-events-none font-bold',
                pending && 'ring-2 ring-primary/30',
              )}
              aria-current={active ? 'page' : undefined}
              aria-label={
                active ? `Current page, page ${pageNumber}` : `Go to page ${pageNumber}`
              }
              onClick={() => {
                navigationStepRef.current = null
                setPendingPage(pageNumber)
              }}
              disabled={navigating && !pending}
            >
              {pageNumber}
            </Button>
          )
        })}

        {windowEnd < safeTotal && (
          <span className="px-1 text-xs text-muted-foreground" aria-hidden="true">
            …
          </span>
        )}

        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => {
            navigationStepRef.current = null
            setPendingPage(null)
            onNext()
          }}
          disabled={!hasNext || navigating}
          aria-label="Next page"
        >
          {loading ? <Loader2 className="animate-spin" /> : <ChevronRight />}
        </Button>
      </div>
    </div>
  )
}
