import { useCallback, useEffect, useState } from 'react'
import {
  ChevronDown,
  CircleAlert,
  Info,
  Loader2,
  RefreshCw,
  ScrollText,
  TriangleAlert,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getAutomationLog } from '@/services/automation'
import type {
  AutomationLogEntry,
  AutomationLogLevel,
  AutomationRunLog,
} from '@/types/automation'
import { cn } from '@/lib/utils'

function formatLogTime(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function levelClass(level: AutomationLogLevel): string {
  if (level === 'error') return 'text-rose-600 dark:text-rose-400'
  if (level === 'warn') return 'text-amber-600 dark:text-amber-400'
  return 'text-muted-foreground'
}

function LogRow({ entry }: { entry: AutomationLogEntry }) {
  return (
    <div className="flex gap-2 border-t border-border/40 px-3 py-2 first:border-t-0">
      <span className="w-16 shrink-0 pt-0.5 font-mono text-[10px] text-muted-foreground">
        {formatLogTime(entry.createdAt)}
      </span>
      {entry.level === 'error' ? (
        <CircleAlert className={cn('mt-0.5 size-3.5 shrink-0', levelClass(entry.level))} />
      ) : entry.level === 'warn' ? (
        <TriangleAlert className={cn('mt-0.5 size-3.5 shrink-0', levelClass(entry.level))} />
      ) : (
        <Info className={cn('mt-0.5 size-3.5 shrink-0', levelClass(entry.level))} />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="font-mono text-[10px]">
            {entry.step}
          </Badge>
          <span className="text-xs text-foreground">{entry.message}</span>
        </div>
        {entry.detail && (
          <p className="mt-1 whitespace-pre-wrap break-words text-xs text-muted-foreground">
            {entry.detail}
          </p>
        )}
      </div>
    </div>
  )
}

export function AutomationExecutionLog({
  runId,
  defaultOpen = false,
  className,
}: {
  runId: string
  defaultOpen?: boolean
  className?: string
}) {
  const [open, setOpen] = useState(defaultOpen)
  const [log, setLog] = useState<AutomationRunLog | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setLog(await getAutomationLog(runId))
      setError(null)
    } catch {
      setError('Unable to load the execution log.')
    } finally {
      setLoading(false)
      setLoaded(true)
    }
  }, [runId])

  useEffect(() => {
    if (!open || loaded) return
    // oxlint-disable-next-line react/set-state-in-effect -- lazy fetch when the log panel opens; state updates occur after await
    void load()
  }, [open, loaded, load])

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-border/60 bg-background',
        className,
      )}
    >
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 text-sm font-medium text-foreground">
          <ScrollText className="size-4 text-primary" />
          Execution log
        </span>
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          {loaded && `${log?.entries.length ?? 0} entries`}
          <ChevronDown
            className={cn(
              'size-4 transition-transform',
              open && 'rotate-180',
            )}
          />
        </span>
      </button>

      {open && (
        <div className="border-t border-border/60">
          <div className="flex items-center justify-between gap-2 px-3 py-2">
            <span className="text-xs text-muted-foreground">
              Detailed automation timeline. Field values are not logged.
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 px-2 text-xs"
              onClick={() => void load()}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <RefreshCw className="size-3.5" />
              )}
              Refresh
            </Button>
          </div>

          {error ? (
            <p className="border-t border-rose-500/20 bg-rose-500/5 px-3 py-3 text-xs text-rose-800 dark:text-rose-200">
              {error}
            </p>
          ) : loading && !loaded ? (
            <p className="flex items-center gap-2 border-t border-border/40 px-3 py-4 text-xs text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading execution log…
            </p>
          ) : log?.truncated ? (
            <p className="border-t border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
              Older informational entries were trimmed. Warnings and errors are retained.
            </p>
          ) : null}

          {!error && log?.entries.length ? (
            <div className="max-h-96 overflow-y-auto">
              {log.entries.map((entry) => (
                <LogRow key={`${entry.createdAt}-${entry.sequence}`} entry={entry} />
              ))}
            </div>
          ) : !error && loaded && !log?.entries.length ? (
            <p className="border-t border-border/40 px-3 py-4 text-xs text-muted-foreground">
              No execution log entries were recorded for this run.
            </p>
          ) : null}
        </div>
      )}
    </div>
  )
}
