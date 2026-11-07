import { useState } from 'react'
import { Link } from 'react-router'
import {
  AlertCircle,
  ArrowUpRight,
  BrainCircuit,
  Briefcase,
  Building2,
  Check,
  Clock,
  Coins,
  Copy,
  ExternalLink,
  ShieldCheck,
  Sparkles,
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
import { useAdminAiRunDetail } from '@/hooks/useAdminAiRunDetail'

interface AdminAiRunDrawerProps {
  runId: string | null
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

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms} ms`
  return `${(ms / 1000).toFixed(2)} s`
}

function formatCost(value: number): string {
  return `$${value.toFixed(4)}`
}

export function AdminAiRunDrawer({
  runId,
  open,
  onClose,
}: AdminAiRunDrawerProps) {
  const { detail, loading, error, refresh } = useAdminAiRunDetail(runId ?? undefined)
  const [copiedId, setCopiedId] = useState(false)

  const copyId = async () => {
    if (!runId) return
    await navigator.clipboard.writeText(runId)
    setCopiedId(true)
    setTimeout(() => setCopiedId(false), 2000)
  }

  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl md:max-w-2xl overflow-y-auto p-0 border-l border-border bg-background"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>{detail?.operation || 'AI Execution Call'}</SheetTitle>
          <SheetDescription>
            Admin telemetry, cost breakdown, and context for this generative model execution.
          </SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="p-8">
            <LoadingState rows={7} />
          </div>
        ) : error || !detail ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <BrainCircuit className="size-10 text-muted-foreground/50 mb-3" />
            <h3 className="text-base font-bold text-foreground">
              {error || 'AI Run not found'}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Unable to load execution log.
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
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-indigo-500/25 bg-indigo-500/10 font-mono text-base font-black text-indigo-700 dark:text-indigo-300 shadow-2xs">
                  <BrainCircuit className="size-5 text-indigo-600 dark:text-indigo-400" />
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <Sparkles className="size-3 text-indigo-500" />
                    <span>AI Engine Execution</span>
                  </div>
                  <h2 className="mt-1 text-lg sm:text-xl font-extrabold tracking-tight text-foreground leading-snug">
                    {detail.operation}
                  </h2>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-mono">{detail.provider}</span>
                    <span>·</span>
                    <span className="font-mono text-foreground font-medium">{detail.model}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  render={<Link to={`/admin/system/ai-usage/${detail.id}`} />}
                  className="rounded-xl font-semibold gap-1.5 text-xs"
                >
                  <span>Full Log</span>
                  <ArrowUpRight className="size-3.5" />
                </Button>
              </div>
            </div>

            {/* Quick Status Bar */}
            <div className="grid grid-cols-3 gap-2.5 rounded-2xl border border-border/80 bg-muted/30 p-3 text-xs">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Status
                </span>
                <span
                  className={`inline-flex items-center gap-1 font-semibold text-xs ${
                    detail.status === 'success'
                      ? 'text-emerald-700 dark:text-emerald-300'
                      : 'text-red-700 dark:text-red-300'
                  }`}
                >
                  {detail.status === 'success' ? (
                    <Check className="size-3.5 text-emerald-600" />
                  ) : (
                    <AlertCircle className="size-3.5 text-red-600" />
                  )}
                  <span className="capitalize">{detail.status}</span>
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Duration
                </span>
                <span className="font-mono font-bold text-xs text-foreground inline-flex items-center gap-1">
                  <Clock className="size-3 text-muted-foreground" />
                  {formatDuration(detail.durationMs)}
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Est. Cost
                </span>
                <span className="font-mono font-bold text-xs text-foreground inline-flex items-center gap-1">
                  <Coins className="size-3 text-muted-foreground" />
                  {formatCost(detail.estimatedCostUsd)}
                </span>
              </div>
            </div>

            {/* Error banner if failed */}
            {detail.error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-red-700 dark:text-red-300 text-xs">
                  <AlertCircle className="size-4 text-red-600 shrink-0" />
                  <span>Execution Error</span>
                </div>
                <p className="text-xs text-red-800 dark:text-red-200 font-mono leading-relaxed break-words">
                  {detail.error}
                </p>
              </div>
            )}

            {/* Tabbed Content */}
            <Tabs defaultValue="exec" className="w-full">
              <TabsList className="grid w-full grid-cols-3 rounded-xl bg-muted/60 p-1 text-xs">
                <TabsTrigger value="exec" className="rounded-lg text-xs gap-1.5">
                  <Clock className="size-3.5" />
                  <span>Telemetry</span>
                </TabsTrigger>
                <TabsTrigger value="context" className="rounded-lg text-xs gap-1.5">
                  <Briefcase className="size-3.5" />
                  <span>Job Context</span>
                </TabsTrigger>
                <TabsTrigger value="audit" className="rounded-lg text-xs gap-1.5">
                  <ShieldCheck className="size-3.5" />
                  <span>Audit</span>
                </TabsTrigger>
              </TabsList>

              {/* Tab 1: Telemetry */}
              <TabsContent value="exec" className="space-y-3 pt-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-border/80 bg-card p-3 space-y-1">
                    <span className="text-[11px] font-semibold text-muted-foreground">Model Provider</span>
                    <div className="font-mono font-bold text-xs">{detail.provider}</div>
                  </div>
                  <div className="rounded-xl border border-border/80 bg-card p-3 space-y-1">
                    <span className="text-[11px] font-semibold text-muted-foreground">Model Name</span>
                    <div className="font-mono font-bold text-xs text-primary">{detail.model}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-border/80 bg-card p-3 space-y-1">
                    <span className="text-[11px] font-semibold text-muted-foreground">Execution Latency</span>
                    <div className="font-mono text-sm font-bold">{formatDuration(detail.durationMs)}</div>
                  </div>
                  <div className="rounded-xl border border-border/80 bg-card p-3 space-y-1">
                    <span className="text-[11px] font-semibold text-muted-foreground">Compute Cost</span>
                    <div className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCost(detail.estimatedCostUsd)} USD
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-border/80 bg-card p-3 space-y-1">
                  <span className="text-[11px] font-semibold text-muted-foreground">Execution Timestamp</span>
                  <div className="font-mono text-xs">{formatDateTime(detail.createdAt)}</div>
                </div>
              </TabsContent>

              {/* Tab 2: Job Context */}
              <TabsContent value="context" className="space-y-3 pt-4 text-xs">
                {detail.job ? (
                  <div className="rounded-xl border border-border/80 bg-card p-4 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase font-semibold">
                      <Building2 className="size-3" />
                      <span>{detail.job.companyName || 'Target Company'}</span>
                    </div>
                    <div className="text-sm font-bold text-foreground">
                      {detail.job.title}
                    </div>
                    <div className="flex items-center gap-2 pt-1 text-[11px] text-muted-foreground">
                      <span>Source: {detail.job.source}</span>
                      <span>·</span>
                      <span className="capitalize">Status: {detail.job.status}</span>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                    <Briefcase className="size-6 text-muted-foreground/40 mx-auto mb-2" />
                    No target opportunity linked to this AI execution.
                  </div>
                )}

                {detail.user && (
                  <div className="rounded-xl border border-border/80 bg-card p-3.5 space-y-1.5">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <User className="size-3.5 text-primary" />
                      <span>Requesting Candidate</span>
                    </span>
                    <div className="text-xs text-muted-foreground">
                      {detail.user.displayName || detail.user.email} ({detail.user.id})
                    </div>
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
                    <span>Run ID: {detail.id}</span>
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
                  {detail.jobId && (
                    <div className="font-mono text-[11px] text-muted-foreground">
                      Job ID: {detail.jobId}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-border/80 pt-4 text-xs">
              <span className="font-mono text-[11px] text-muted-foreground">
                Run ID: {detail.id.slice(0, 14)}…
              </span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={onClose} className="rounded-xl">
                  Close
                </Button>
                <Button
                  size="sm"
                  render={<Link to={`/admin/system/ai-usage/${detail.id}`} />}
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
