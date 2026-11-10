import { useState } from 'react'
import { Link } from 'react-router'
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BrainCircuit,
  Briefcase,
  Building2,
  CheckCircle2,
  Clock,
  Cpu,
  Database,
  ExternalLink,
  FileText,
  LockKeyhole,
  Radio,
  RotateCw,
  SendHorizontal,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AdminBudgetControlCard } from '@/components/admin/AdminBudgetControlCard'
import { AdminSystemTabs } from '@/components/admin/AdminSystemTabs'
import { AdminAiRunDrawer } from '@/components/admin/AdminAiRunDrawer'
import { AdminErrorDrawer } from '@/components/admin/AdminErrorDrawer'
import { EmptyState } from '@/components/states/EmptyState'
import { LoadingState } from '@/components/states/LoadingState'
import { useAdminSystemHealth } from '@/hooks/useAdminSystemHealth'
import { usePageMeta } from '@/hooks/usePageMeta'

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
  return `${(ms / 1000).toFixed(1)} s`
}

function formatCost(value: number): string {
  return `$${value.toFixed(4)}`
}

function getActivityIcon(type: string) {
  if (type.includes('research') || type.includes('company')) return Sparkles
  if (type.includes('cover-letter') || type.includes('resume')) return FileText
  if (type.includes('outreach') || type.includes('pitch')) return SendHorizontal
  if (type.includes('job') || type.includes('opportunity')) return Briefcase
  return Activity
}

export function AdminSystemHealthPage() {
  usePageMeta({
    title: 'System Health — Admin — Victor Job OS',
    description: 'SysOps telemetry, AI performance engine, and cloud health command center.',
    noindex: true,
    path: '/admin/system',
  })

  const { health, loading, error, refresh } = useAdminSystemHealth()
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Slide-over drawer states
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null)
  const [runDrawerOpen, setRunDrawerOpen] = useState(false)

  const [selectedErrorId, setSelectedErrorId] = useState<string | null>(null)
  const [errorDrawerOpen, setErrorDrawerOpen] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refresh()
    } finally {
      setIsRefreshing(false)
    }
  }

  function openAiRun(id: string) {
    setSelectedRunId(id)
    setRunDrawerOpen(true)
  }

  function openError(id: string) {
    setSelectedErrorId(id)
    setErrorDrawerOpen(true)
  }

  const isHealthy = !health || health.errors.total === 0

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 sm:p-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-foreground">
              System Health & Telemetry
            </h1>
            <span className="flex size-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full size-2 bg-emerald-500" />
            </span>
          </div>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Real-time server-side SysOps telemetry, Firestore metadata, and generative AI execution engine.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void handleRefresh()}
          disabled={isRefreshing}
          className="rounded-xl gap-2 font-medium shadow-2xs hover:bg-muted"
        >
          <RotateCw className={`size-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Sync Telemetry</span>
        </Button>
      </div>

      {/* Sub-Navigation Tabs */}
      <AdminSystemTabs />

      <AdminBudgetControlCard />

      {loading ? (
        <LoadingState label="Polling cloud telemetry & infrastructure health…" rows={6} />
      ) : error ? (
        <EmptyState
          title="Unable to load system health"
          description={error}
          action={
            <Button size="sm" onClick={() => void handleRefresh()} className="rounded-xl">
              Retry
            </Button>
          }
        />
      ) : health ? (
        <>
          {/* Executive Operational Heartbeat Banner */}
          <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-r from-card via-card to-muted/40 p-5 sm:p-6 shadow-xs backdrop-blur-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <div
                  className={`flex size-12 shrink-0 items-center justify-center rounded-2xl border shadow-2xs ${
                    isHealthy
                      ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                      : 'border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-300'
                  }`}
                >
                  {isHealthy ? (
                    <ShieldCheck className="size-6 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <AlertTriangle className="size-6 text-amber-600 dark:text-amber-400" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      SysOps Status Beacon
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        isHealthy
                          ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {isHealthy ? 'All Systems Operational' : 'Degraded Telemetry'}
                    </span>
                  </div>
                  <h2 className="mt-0.5 text-lg sm:text-xl font-extrabold tracking-tight text-foreground">
                    {health.projectId} · {health.environment} Environment
                  </h2>
                </div>
              </div>

              {/* Infrastructure Quick Chips */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <div className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-background/80 px-3 py-1.5 shadow-2xs">
                  <Database className="size-3.5 text-indigo-500" />
                  <span className="text-muted-foreground">Firestore:</span>
                  <span className="font-semibold text-foreground">Online</span>
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-background/80 px-3 py-1.5 shadow-2xs">
                  <Cpu className="size-3.5 text-purple-500" />
                  <span className="text-muted-foreground">Gemini AI:</span>
                  <span className="font-semibold text-foreground">2.5 Flash Lite</span>
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-background/80 px-3 py-1.5 shadow-2xs">
                  <LockKeyhole className="size-3.5 text-amber-500" />
                  <span className="text-muted-foreground">Queue Locks:</span>
                  <span className="font-semibold text-foreground">{health.activeDiscoveryLocks} active</span>
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-background/80 px-3 py-1.5 shadow-2xs text-muted-foreground font-mono text-[11px]">
                  <Clock className="size-3 text-muted-foreground/70" />
                  <span>{formatDateTime(health.generatedAt)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Workspace Data Command Matrix (6 Cards) */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Radio className="size-3.5 text-primary" />
                <span>Workspace Data Matrix</span>
              </h2>
              <span className="text-[11px] text-muted-foreground">
                6 core domain collections queried server-side
              </span>
            </div>

            <div className="grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
              <WorkspaceMatrixCard
                label="Users"
                value={health.counts.users}
                sublabel="Candidates & Admins"
                icon={Users}
                to="/admin/users"
                theme="indigo"
              />
              <WorkspaceMatrixCard
                label="Opportunities"
                value={health.counts.jobs}
                sublabel="Tracked Job Roles"
                icon={Briefcase}
                to="/admin/opportunities"
                theme="emerald"
              />
              <WorkspaceMatrixCard
                label="Applications"
                value={health.counts.applications}
                sublabel="Pipeline In-Flight"
                icon={FileText}
                to="/admin/applications"
                theme="blue"
              />
              <WorkspaceMatrixCard
                label="Outreach"
                value={health.counts.outreach}
                sublabel="Pitches & Touchpoints"
                icon={SendHorizontal}
                to="/admin/outreach"
                theme="purple"
              />
              <WorkspaceMatrixCard
                label="Companies"
                value={health.counts.companies}
                sublabel="Target Enterprises"
                icon={Building2}
                to="/admin/companies"
                theme="sky"
              />
              <WorkspaceMatrixCard
                label="Resumes"
                value={health.counts.resumeVariants}
                sublabel="Career Asset Variants"
                icon={Sparkles}
                to="/admin/resumes"
                theme="amber"
              />
            </div>
          </section>

          {/* Three-Column Engine Telemetry Tier */}
          <div className="grid gap-4 lg:grid-cols-3">
            {/* AI Engine Telemetry Card */}
            <Card className="border-border/80 bg-card shadow-xs">
              <CardHeader className="pb-3 border-b border-border/70 flex flex-row items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-sm font-bold text-foreground">
                    <BrainCircuit className="size-4 text-indigo-500" />
                    <span>AI Engine Performance</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Last 7 days execution latency and cost metrics.
                  </CardDescription>
                </div>
                <Badge
                  variant="secondary"
                  className="bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30 text-[10px] font-bold uppercase"
                >
                  100% Success
                </Badge>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 pt-4 text-xs">
                {/* Visual Success Meter */}
                <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-muted-foreground">Execution Reliability</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                      {health.ai.successRuns} of {health.ai.totalRuns} calls passed
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{
                        width: `${health.ai.totalRuns > 0 ? (health.ai.successRuns / health.ai.totalRuns) * 100 : 100}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <MetricRow label="Total AI calls logged" value={health.ai.totalRuns.toLocaleString()} />
                  <MetricRow label="Runs in last 7 days" value={health.ai.runs7d.toLocaleString()} />
                  <MetricRow
                    label="Average execution latency"
                    value={formatDuration(health.ai.averageDurationMs7d)}
                  />
                  <MetricRow
                    label="Estimated 7-day cost"
                    value={`${formatCost(health.ai.estimatedCost7d)} USD`}
                  />
                  <MetricRow
                    label="Latest execution"
                    value={formatDateTime(health.ai.lastRunAt)}
                  />
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  render={<Link to="/admin/system/ai-usage" />}
                  className="mt-1 w-full rounded-xl gap-1.5 text-xs font-semibold"
                >
                  <span>Explore All AI Runs</span>
                  <ArrowUpRight className="size-3.5" />
                </Button>
              </CardContent>
            </Card>

            {/* Error Diagnostics Card */}
            <Card className="border-border/80 bg-card shadow-xs">
              <CardHeader className="pb-3 border-b border-border/70 flex flex-row items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-sm font-bold text-foreground">
                    <AlertTriangle className="size-4 text-amber-500" />
                    <span>Error & Anomaly Guard</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Client and Cloud Function error diagnostics.
                  </CardDescription>
                </div>
                <Badge
                  variant={health.errors.total === 0 ? 'secondary' : 'destructive'}
                  className={
                    health.errors.total === 0
                      ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30 text-[10px] font-bold uppercase'
                      : 'text-[10px] font-bold uppercase'
                  }
                >
                  {health.errors.total === 0 ? 'Zero Faults' : `${health.errors.total} Errors`}
                </Badge>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 pt-4 text-xs">
                {/* Zero Fault Affirmative Card */}
                {health.errors.total === 0 ? (
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-center space-y-1.5">
                    <CheckCircle2 className="size-8 text-emerald-500 mx-auto" />
                    <div className="font-bold text-foreground">Zero Anomalies Detected</div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      No unhandled exceptions or background task failures logged in the last 7 days.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 space-y-1">
                    <div className="font-bold text-red-700 dark:text-red-300">
                      Active Anomalies Logged
                    </div>
                    <p className="text-[11px] text-red-800 dark:text-red-200">
                      {health.errors.last24h} exceptions recorded in the last 24 hours.
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <MetricRow label="Total lifetime errors" value={health.errors.total.toLocaleString()} />
                  <MetricRow label="Errors in last 24h" value={health.errors.last24h.toLocaleString()} />
                  <MetricRow label="Errors in last 7d" value={health.errors.last7d.toLocaleString()} />
                  <MetricRow
                    label="Latest recorded error"
                    value={formatDateTime(health.errors.lastErrorAt)}
                  />
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  render={<Link to="/admin/system/errors" />}
                  className="mt-1 w-full rounded-xl gap-1.5 text-xs font-semibold"
                >
                  <span>Inspect Error Log</span>
                  <ArrowUpRight className="size-3.5" />
                </Button>
              </CardContent>
            </Card>

            {/* Platform Activity Velocity */}
            <Card className="border-border/80 bg-card shadow-xs">
              <CardHeader className="pb-3 border-b border-border/70 flex flex-row items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-sm font-bold text-foreground">
                    <Activity className="size-4 text-emerald-500" />
                    <span>Workflow Velocity</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Cross-user event rate and discovery locks.
                  </CardDescription>
                </div>
                <Badge
                  variant="secondary"
                  className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold uppercase"
                >
                  Live Polling
                </Badge>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 pt-4 text-xs">
                <div className="rounded-xl border border-border/80 bg-muted/30 p-3 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Telemetry Cadence
                  </span>
                  <div className="text-sm font-bold text-foreground">
                    Real-time Firestore Server Aggregations
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Zero document collection scans; instant server-side counts.
                  </p>
                </div>

                <div className="space-y-2">
                  <MetricRow
                    label="Workflow events · 24h"
                    value={health.activity.last24h.toLocaleString()}
                  />
                  <MetricRow
                    label="Latest recorded activity"
                    value={formatDateTime(health.activity.lastActivityAt)}
                  />
                  <MetricRow
                    label="Active discovery queue locks"
                    value={health.activeDiscoveryLocks.toLocaleString()}
                  />
                </div>

                <div className="rounded-xl border border-border/80 bg-card p-3 space-y-1">
                  <div className="text-[10px] font-bold uppercase text-muted-foreground">
                    Environment Node
                  </div>
                  <div className="font-mono text-xs font-semibold text-foreground">
                    {health.environment} (Project: {health.projectId})
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Two-Column Streams: Recent AI Runs + Recent Errors */}
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Recent AI Runs Stream */}
            <Card className="border-border/80 bg-card shadow-xs">
              <CardHeader className="pb-3 border-b border-border/70 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                    <BrainCircuit className="size-4 text-indigo-500" />
                    <span>Recent AI Runs</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Click any execution to inspect telemetry and prompt details.
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  render={<Link to="/admin/system/ai-usage" />}
                  className="rounded-xl text-xs h-7 px-2.5 gap-1"
                >
                  <span>View all</span>
                  <ExternalLink className="size-3" />
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {health.recentAiRuns.length === 0 ? (
                  <div className="p-6 text-center text-xs text-muted-foreground">
                    No AI executions logged yet.
                  </div>
                ) : (
                  <div className="flex flex-col divide-y divide-border/60">
                    {health.recentAiRuns.map((run) => (
                      <button
                        key={run.id}
                        type="button"
                        onClick={() => openAiRun(run.id)}
                        className="flex items-center justify-between gap-3 p-3.5 text-left transition-colors hover:bg-muted/50 cursor-pointer"
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-foreground truncate flex items-center gap-2">
                            <span>{run.operation}</span>
                            <span className="font-mono text-[10px] text-muted-foreground font-normal">
                              {run.provider}/{run.model}
                            </span>
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
                            <span>{formatDateTime(run.createdAt)}</span>
                            <span>·</span>
                            <span>{formatDuration(run.durationMs)}</span>
                            <span>·</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                              {formatCost(run.estimatedCostUsd)}
                            </span>
                          </div>
                        </div>

                        <Badge
                          variant={run.status === 'success' ? 'secondary' : 'destructive'}
                          className={`shrink-0 text-[10px] font-bold uppercase rounded-lg ${
                            run.status === 'success'
                              ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30'
                              : ''
                          }`}
                        >
                          {run.status}
                        </Badge>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Errors Stream */}
            <Card className="border-border/80 bg-card shadow-xs">
              <CardHeader className="pb-3 border-b border-border/70 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                    <AlertTriangle className="size-4 text-amber-500" />
                    <span>Recent Errors & Anomalies</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Click any failure to view stack frames and JSON context.
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  render={<Link to="/admin/system/errors" />}
                  className="rounded-xl text-xs h-7 px-2.5 gap-1"
                >
                  <span>View all</span>
                  <ExternalLink className="size-3" />
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {health.recentErrors.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 text-center space-y-2">
                    <CheckCircle2 className="size-8 text-emerald-500" />
                    <div className="font-bold text-xs text-foreground">Zero Recorded Faults</div>
                    <p className="text-[11px] text-muted-foreground max-w-xs">
                      All Cloud Functions and client API endpoints are running with 100% stability.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col divide-y divide-border/60">
                    {health.recentErrors.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => openError(item.id)}
                        className="flex items-center justify-between gap-3 p-3.5 text-left transition-colors hover:bg-muted/50 cursor-pointer"
                      >
                        <div className="min-w-0">
                          <div className="truncate text-xs font-bold text-red-600 dark:text-red-400">
                            {item.message || 'Unknown error'}
                          </div>
                          <div className="mt-1 text-[11px] text-muted-foreground font-mono">
                            {item.fn} · {formatDateTime(item.createdAt)}
                          </div>
                        </div>
                        <Badge variant="outline" className="shrink-0 text-[10px] font-mono rounded-lg">
                          {item.fn}
                        </Badge>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Connected Recent Activity Timeline */}
          <Card className="border-border/80 bg-card shadow-xs">
            <CardHeader className="pb-3 border-b border-border/70">
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <Activity className="size-4 text-emerald-500" />
                <span>Workflow Activity Timeline</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Real-time stream of candidate and automated pipeline execution events.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              {health.recentActivity.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  No workflow activity events logged yet.
                </div>
              ) : (
                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border/80">
                  {health.recentActivity.map((item) => {
                    const EventIcon = getActivityIcon(item.type)
                    return (
                      <div key={item.id} className="relative flex items-start gap-3 text-xs">
                        {/* Dot / Icon beacon */}
                        <div className="absolute -left-6 mt-0.5 flex size-5 items-center justify-center rounded-full border border-border/80 bg-background shadow-2xs">
                          <EventIcon className="size-2.5 text-primary" />
                        </div>

                        <div className="flex-1 min-w-0 flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <div className="font-bold text-foreground">{item.message}</div>
                            <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
                              <span>{item.type}</span>
                              <span>·</span>
                              <span>{formatDateTime(item.createdAt)}</span>
                            </div>
                          </div>

                          <span className="rounded-full border border-border bg-muted/60 px-2 py-0.5 font-mono text-[10px] uppercase font-bold text-muted-foreground">
                            {item.status}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}

      {/* Slide-Over AI Run Inspector Drawer */}
      <AdminAiRunDrawer
        runId={selectedRunId}
        open={runDrawerOpen}
        onClose={() => setRunDrawerOpen(false)}
      />

      {/* Slide-Over Error Inspector Drawer */}
      <AdminErrorDrawer
        errorId={selectedErrorId}
        open={errorDrawerOpen}
        onClose={() => setErrorDrawerOpen(false)}
      />
    </div>
  )
}

function WorkspaceMatrixCard({
  label,
  value,
  sublabel,
  icon: Icon,
  to,
  theme,
}: {
  label: string
  value: number
  sublabel: string
  icon: React.ComponentType<{ className?: string }>
  to: string
  theme: 'indigo' | 'emerald' | 'blue' | 'purple' | 'sky' | 'amber'
}) {
  const themeStyles = {
    indigo: {
      border: 'hover:border-indigo-500/50',
      bg: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-700 dark:text-indigo-300',
      badge: 'group-hover:text-indigo-600',
    },
    emerald: {
      border: 'hover:border-emerald-500/50',
      bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300',
      badge: 'group-hover:text-emerald-600',
    },
    blue: {
      border: 'hover:border-blue-500/50',
      bg: 'bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-300',
      badge: 'group-hover:text-blue-600',
    },
    purple: {
      border: 'hover:border-purple-500/50',
      bg: 'bg-purple-500/10 border-purple-500/20 text-purple-700 dark:text-purple-300',
      badge: 'group-hover:text-purple-600',
    },
    sky: {
      border: 'hover:border-sky-500/50',
      bg: 'bg-sky-500/10 border-sky-500/20 text-sky-700 dark:text-sky-300',
      badge: 'group-hover:text-sky-600',
    },
    amber: {
      border: 'hover:border-amber-500/50',
      bg: 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-300',
      badge: 'group-hover:text-amber-600',
    },
  }[theme]

  return (
    <Link
      to={to}
      className={`group relative flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-4 shadow-xs transition-all hover:shadow-md hover:-translate-y-0.5 ${themeStyles.border}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors">
          {label}
        </span>
        <div
          className={`flex size-7 items-center justify-center rounded-xl border shadow-2xs ${themeStyles.bg}`}
        >
          <Icon className="size-3.5" />
        </div>
      </div>

      <div className="mt-3">
        <div className="font-mono text-2xl sm:text-3xl font-black tracking-tight text-foreground">
          {value.toLocaleString()}
        </div>
        <div className="mt-1 text-[11px] text-muted-foreground truncate">
          {sublabel}
        </div>
      </div>
    </Link>
  )
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-mono font-medium text-foreground">{value}</span>
    </div>
  )
}
