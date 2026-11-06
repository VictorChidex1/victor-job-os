import type { ReactNode } from 'react'
import { Link } from 'react-router'
import {
  Activity,
  AlertTriangle,
  BrainCircuit,
  Briefcase,
  Building2,
  CheckCircle2,
  ClipboardList,
  Database,
  FileText,
  LockKeyhole,
  Send,
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
import { AdminSystemTabs } from '@/components/admin/AdminSystemTabs'
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

export function AdminSystemHealthPage() {
  usePageMeta({
    title: 'System health — Admin — Victor Job OS',
    description: 'System health, AI usage, and error telemetry for the Job OS administrator.',
    noindex: true,
    path: '/admin/system',
  })

  const { health, loading, error, refresh } = useAdminSystemHealth()

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">
            System health
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Read-only operational telemetry from Firestore. Counts and aggregates are
            queried server-side; no collection scans.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void refresh()}>
          Refresh
        </Button>
      </div>

      <AdminSystemTabs />

      {loading ? (
        <LoadingState label="Loading system health…" rows={6} />
      ) : error ? (
        <EmptyState
          title="Unable to load system health"
          description={error}
          action={
            <Button size="sm" onClick={() => void refresh()}>
              Try again
            </Button>
          }
        />
      ) : health ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Environment"
              value={health.environment}
              icon={<Database className="size-4 text-indigo-500" />}
            />
            <StatCard
              label="Firebase project"
              value={health.projectId}
              icon={<CheckCircle2 className="size-4 text-emerald-500" />}
              hint="Firestore connected"
            />
            <StatCard
              label="Last checked"
              value={formatDateTime(health.generatedAt)}
              icon={<Activity className="size-4 text-indigo-500" />}
            />
            <StatCard
              label="Active discovery locks"
              value={health.activeDiscoveryLocks.toLocaleString()}
              icon={<LockKeyhole className="size-4 text-amber-500" />}
              hint="Unexpired locks"
            />
          </div>

          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">
              Workspace data
            </h2>
            <div className="grid gap-3 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <MetricCard
                label="Users"
                value={health.counts.users}
                icon={<Users className="size-4 text-indigo-500" />}
                to="/admin/users"
              />
              <MetricCard
                label="Opportunities"
                value={health.counts.jobs}
                icon={<Briefcase className="size-4 text-indigo-500" />}
                to="/admin/opportunities"
              />
              <MetricCard
                label="Applications"
                value={health.counts.applications}
                icon={<ClipboardList className="size-4 text-indigo-500" />}
                to="/admin/applications"
              />
              <MetricCard
                label="Outreach"
                value={health.counts.outreach}
                icon={<Send className="size-4 text-indigo-500" />}
                to="/admin/outreach"
              />
              <MetricCard
                label="Companies"
                value={health.counts.companies}
                icon={<Building2 className="size-4 text-indigo-500" />}
                to="/admin/companies"
              />
              <MetricCard
                label="Resumes"
                value={health.counts.resumeVariants}
                icon={<FileText className="size-4 text-indigo-500" />}
                to="/admin/resumes"
              />
            </div>
          </section>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm text-slate-950">
                  <BrainCircuit className="size-4 text-indigo-500" />
                  AI usage
                </CardTitle>
                <CardDescription>Last 7 days and all-time totals.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 text-sm">
                <MetricRow label="Total runs" value={health.ai.totalRuns.toLocaleString()} />
                <MetricRow
                  label="Success / errors"
                  value={`${health.ai.successRuns.toLocaleString()} / ${health.ai.errorRuns.toLocaleString()}`}
                />
                <MetricRow label="Runs · last 7d" value={health.ai.runs7d.toLocaleString()} />
                <MetricRow
                  label="Avg duration · 7d"
                  value={formatDuration(health.ai.averageDurationMs7d)}
                />
                <MetricRow
                  label="Estimated cost · 7d"
                  value={formatCost(health.ai.estimatedCost7d)}
                />
                <MetricRow label="Last run" value={formatDateTime(health.ai.lastRunAt)} />
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-1 w-fit"
                  render={<Link to="/admin/system/ai-usage" />}
                >
                  View AI usage
                </Button>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm text-slate-950">
                  <AlertTriangle className="size-4 text-amber-500" />
                  Errors
                </CardTitle>
                <CardDescription>Server and client error telemetry.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 text-sm">
                <MetricRow label="Total errors" value={health.errors.total.toLocaleString()} />
                <MetricRow label="Last 24h" value={health.errors.last24h.toLocaleString()} />
                <MetricRow label="Last 7d" value={health.errors.last7d.toLocaleString()} />
                <MetricRow
                  label="Latest error"
                  value={formatDateTime(health.errors.lastErrorAt)}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-1 w-fit"
                  render={<Link to="/admin/system/errors" />}
                >
                  View errors
                </Button>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm text-slate-950">
                  <Activity className="size-4 text-emerald-500" />
                  Activity
                </CardTitle>
                <CardDescription>User-visible workflow activity events.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 text-sm">
                <MetricRow
                  label="Events · last 24h"
                  value={health.activity.last24h.toLocaleString()}
                />
                <MetricRow
                  label="Latest activity"
                  value={formatDateTime(health.activity.lastActivityAt)}
                />
                <MetricRow
                  label="Active discovery locks"
                  value={health.activeDiscoveryLocks.toLocaleString()}
                />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="flex flex-row items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-sm text-slate-950">Recent errors</CardTitle>
                  <CardDescription>Newest error records.</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  render={<Link to="/admin/system/errors" />}
                >
                  View all
                </Button>
              </CardHeader>
              <CardContent>
                {health.recentErrors.length === 0 ? (
                  <p className="text-sm text-slate-500">No errors recorded.</p>
                ) : (
                  <div className="flex flex-col divide-y divide-slate-100">
                    {health.recentErrors.map((item) => (
                      <Link
                        key={item.id}
                        to={`/admin/system/errors/${item.id}`}
                        state={{ from: '/admin/system' }}
                        className="flex items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0 hover:text-indigo-700"
                      >
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium text-slate-900">
                            {item.message || 'Unknown error'}
                          </div>
                          <div className="mt-0.5 text-xs text-slate-500">
                            {item.fn} · {formatDateTime(item.createdAt)}
                          </div>
                        </div>
                        <Badge variant="outline" className="shrink-0">
                          {item.fn}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="flex flex-row items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-sm text-slate-950">Recent AI runs</CardTitle>
                  <CardDescription>Newest AI calls across the workspace.</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  render={<Link to="/admin/system/ai-usage" />}
                >
                  View all
                </Button>
              </CardHeader>
              <CardContent>
                {health.recentAiRuns.length === 0 ? (
                  <p className="text-sm text-slate-500">No AI runs recorded.</p>
                ) : (
                  <div className="flex flex-col divide-y divide-slate-100">
                    {health.recentAiRuns.map((run) => (
                      <Link
                        key={run.id}
                        to={`/admin/system/ai-usage/${run.id}`}
                        state={{ from: '/admin/system' }}
                        className="flex items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0 hover:text-indigo-700"
                      >
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium text-slate-900">
                            {run.operation}
                          </div>
                          <div className="mt-0.5 text-xs text-slate-500">
                            {run.provider} / {run.model} · {formatDateTime(run.createdAt)}
                          </div>
                        </div>
                        <Badge
                          variant={run.status === 'success' ? 'secondary' : 'outline'}
                          className="shrink-0"
                        >
                          {run.status}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm text-slate-950">Recent activity</CardTitle>
              <CardDescription>Latest workflow events from all users.</CardDescription>
            </CardHeader>
            <CardContent>
              {health.recentActivity.length === 0 ? (
                <p className="text-sm text-slate-500">No activity recorded.</p>
              ) : (
                <div className="flex flex-col divide-y divide-slate-100">
                  {health.recentActivity.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-wrap items-center justify-between gap-2 py-2.5 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <div className="text-sm text-slate-800">{item.message}</div>
                        <div className="mt-0.5 text-xs text-slate-500">
                          {item.type} · {item.status} · {formatDateTime(item.createdAt)}
                        </div>
                      </div>
                      <Badge variant="outline">{item.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
  hint,
}: {
  label: string
  value: string
  icon: ReactNode
  hint?: string
}) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardContent className="flex flex-col gap-2 pt-5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[0.65rem] font-bold uppercase tracking-widest text-slate-500">
            {label}
          </span>
          {icon}
        </div>
        <div className="truncate text-xl font-bold tracking-tight text-slate-950">
          {value}
        </div>
        {hint && <div className="text-xs text-slate-500">{hint}</div>}
      </CardContent>
    </Card>
  )
}

function MetricCard({
  label,
  value,
  icon,
  to,
}: {
  label: string
  value: number
  icon: ReactNode
  to: string
}) {
  return (
    <Link
      to={to}
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-indigo-200 hover:bg-indigo-50/30"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[0.65rem] font-bold uppercase tracking-widest text-slate-500">
          {label}
        </span>
        {icon}
      </div>
      <div className="mt-2 font-mono text-2xl font-black tracking-tighter text-slate-950">
        {value.toLocaleString()}
      </div>
    </Link>
  )
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-right font-medium text-slate-800">{value}</span>
    </div>
  )
}
