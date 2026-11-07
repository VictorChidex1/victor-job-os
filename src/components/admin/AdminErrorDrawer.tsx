import { useState } from 'react'
import { Link } from 'react-router'
import {
  AlertTriangle,
  ArrowUpRight,
  Check,
  Code2,
  Copy,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LoadingState } from '@/components/states/LoadingState'
import { useAdminErrorLogDetail } from '@/hooks/useAdminErrorLogDetail'

interface AdminErrorDrawerProps {
  errorId: string | null
  open: boolean
  onClose: () => void
}

function formatDateTime(value?: { toDate?: () => Date }): string {
  const date = value?.toDate?.()
  return date
    ? date.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : '—'
}

export function AdminErrorDrawer({
  errorId,
  open,
  onClose,
}: AdminErrorDrawerProps) {
  const { detail, loading, error, refresh } = useAdminErrorLogDetail(errorId ?? undefined)
  const [copiedId, setCopiedId] = useState(false)
  const [copiedStack, setCopiedStack] = useState(false)

  const copyId = async () => {
    if (!errorId) return
    await navigator.clipboard.writeText(errorId)
    setCopiedId(true)
    setTimeout(() => setCopiedId(false), 2000)
  }

  const copyStack = async () => {
    if (!detail?.stack) return
    await navigator.clipboard.writeText(detail.stack)
    setCopiedStack(true)
    setTimeout(() => setCopiedStack(false), 2000)
  }

  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl md:max-w-2xl overflow-y-auto p-0 border-l border-border bg-background"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>{detail?.fn || 'System Error Log'}</SheetTitle>
          <SheetDescription>
            Admin stack trace, function origin, and diagnostic telemetry for this exception.
          </SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="p-8">
            <LoadingState rows={7} />
          </div>
        ) : error || !detail ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <AlertTriangle className="size-10 text-muted-foreground/50 mb-3" />
            <h3 className="text-base font-bold text-foreground">
              {error || 'Error record not found'}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Unable to load error details.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void refresh()}
              className="mt-4"
            >
              Retry
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-5 p-6">
            {/* Top Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-red-500/25 bg-red-500/10 font-mono text-base font-black text-red-700 dark:text-red-300 shadow-2xs">
                  <ShieldAlert className="size-5 text-red-600 dark:text-red-400" />
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">
                    <AlertTriangle className="size-3" />
                    <span>Function Failure</span>
                  </div>
                  <h2 className="mt-1 text-lg sm:text-xl font-extrabold tracking-tight text-foreground leading-snug">
                    {detail.fn}
                  </h2>
                  <div className="mt-1 text-xs text-muted-foreground font-mono">
                    {formatDateTime(detail.createdAt)}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  render={<Link to={`/admin/system/errors/${detail.id}`} />}
                  className="rounded-xl font-semibold gap-1.5 text-xs"
                >
                  <span>Full Log</span>
                  <ArrowUpRight className="size-3.5" />
                </Button>
              </div>
            </div>

            {/* Error Message Box */}
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-red-700 dark:text-red-300">
                Exception Message
              </span>
              <p className="text-xs text-red-950 dark:text-red-200 font-mono leading-relaxed break-words font-semibold">
                {detail.message || 'No explicit error message recorded.'}
              </p>
            </div>

            {/* Tabbed Content */}
            <Tabs defaultValue="stack" className="w-full">
              <TabsList className="grid w-full grid-cols-3 rounded-xl bg-muted/60 p-1 text-xs">
                <TabsTrigger value="stack" className="rounded-lg text-xs gap-1.5">
                  <Code2 className="size-3.5" />
                  <span>Stack Trace</span>
                </TabsTrigger>
                <TabsTrigger value="context" className="rounded-lg text-xs gap-1.5">
                  <ShieldCheck className="size-3.5" />
                  <span>Context Payload</span>
                </TabsTrigger>
                <TabsTrigger value="audit" className="rounded-lg text-xs gap-1.5">
                  <User className="size-3.5" />
                  <span>Audit</span>
                </TabsTrigger>
              </TabsList>

              {/* Tab 1: Stack Trace */}
              <TabsContent value="stack" className="space-y-3 pt-4 text-xs">
                {detail.stack ? (
                  <div className="rounded-xl border border-border bg-slate-950 text-slate-100 p-4 space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-[11px] font-mono text-slate-400">Stack Execution Frame</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => void copyStack()}
                        className="h-6 px-2 text-[10px] gap-1 text-slate-300 hover:text-white hover:bg-slate-800"
                      >
                        {copiedStack ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                        <span>{copiedStack ? 'Copied' : 'Copy Stack'}</span>
                      </Button>
                    </div>
                    <pre className="text-[11px] font-mono leading-relaxed overflow-x-auto whitespace-pre p-1 text-red-300/90 max-h-96">
                      {detail.stack}
                    </pre>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                    No stack trace captured for this error event.
                  </div>
                )}
              </TabsContent>

              {/* Tab 2: Context Payload */}
              <TabsContent value="context" className="space-y-3 pt-4 text-xs">
                {detail.context && Object.keys(detail.context).length > 0 ? (
                  <div className="rounded-xl border border-border bg-slate-950 text-slate-100 p-4 space-y-2">
                    <span className="text-[11px] font-mono text-slate-400">Input / Execution Context</span>
                    <pre className="text-[11px] font-mono leading-relaxed overflow-x-auto whitespace-pre p-1 text-slate-200 max-h-96">
                      {JSON.stringify(detail.context, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                    No additional JSON context payload logged.
                  </div>
                )}
              </TabsContent>

              {/* Tab 3: System Audit */}
              <TabsContent value="audit" className="space-y-3 pt-4 text-xs">
                <div className="rounded-xl border border-border/80 bg-card p-3 space-y-1">
                  <div className="text-muted-foreground text-[11px] font-semibold">
                    System Identifiers
                  </div>
                  <div className="flex items-center justify-between font-mono text-[11px] text-muted-foreground">
                    <span>Error ID: {detail.id}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => void copyId()}
                      className="h-6 px-2 text-[10px] gap-1"
                    >
                      {copiedId ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
                      <span>{copiedId ? 'Copied' : 'Copy'}</span>
                    </Button>
                  </div>
                  {detail.userId && (
                    <div className="font-mono text-[11px] text-muted-foreground">
                      User ID: {detail.userId}
                    </div>
                  )}
                </div>

                {detail.user && (
                  <div className="rounded-xl border border-border/80 bg-card p-3.5 space-y-1">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <User className="size-3.5 text-primary" />
                      <span>Affected User Profile</span>
                    </span>
                    <div className="text-xs text-muted-foreground">
                      {detail.user.displayName || detail.user.email} ({detail.user.id})
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-border/80 pt-4 text-xs">
              <span className="font-mono text-[11px] text-muted-foreground">
                Error ID: {detail.id.slice(0, 14)}…
              </span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={onClose} className="rounded-xl">
                  Close
                </Button>
                <Button
                  size="sm"
                  render={<Link to={`/admin/system/errors/${detail.id}`} />}
                  className="rounded-xl gap-1"
                >
                  <span>Full Log</span>
                  <ExternalLink className="size-3" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
