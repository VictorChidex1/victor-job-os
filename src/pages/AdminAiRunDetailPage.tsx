import type { ReactNode } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import {
  ArrowLeft,
  ArrowUpRight,
  BrainCircuit,
  Briefcase,
  CalendarClock,
  ExternalLink,
  User,
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
import { useAdminAiRunDetail } from '@/hooks/useAdminAiRunDetail'
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
        second: '2-digit',
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

export function AdminAiRunDetailPage() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const { detail, loading, error, refresh } = useAdminAiRunDetail(id)

  usePageMeta({
    title: detail
      ? `${detail.operation} — AI run — Admin — Victor Job OS`
      : 'AI run detail — Admin — Victor Job OS',
    description: 'Read-only AI run detail for the Job OS administrator.',
    noindex: true,
    path: `/admin/system/ai-usage/${id ?? ''}`,
  })

  const returnTo =
    typeof (location.state as { from?: unknown } | null)?.from === 'string'
      ? (location.state as { from: string }).from
      : '/admin/system/ai-usage'
  const from = `${location.pathname}${location.search}`

  function goBack() {
    navigate(returnTo)
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl p-4 sm:p-6">
        <LoadingState label="Loading AI run…" rows={5} />
      </div>
    )
  }

  if (error || !detail) {
    return (
      <div className="mx-auto w-full max-w-7xl p-4 sm:p-6">
        <EmptyState
          title="Unable to load this AI run"
          description={error ?? 'The AI run could not be found.'}
          action={
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={goBack}>
                Back to AI usage
              </Button>
              <Button size="sm" onClick={() => void refresh()}>
                Try again
              </Button>
            </div>
          }
        />
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={goBack}>
          <ArrowLeft />
          AI usage
        </Button>
        <AdminSystemTabs />
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="flex flex-col gap-4 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <BrainCircuit className="size-5 text-indigo-500" />
                <h1 className="font-mono text-2xl font-bold tracking-tight text-slate-950">
                  {detail.operation}
                </h1>
                <Badge
                  variant={detail.status === 'success' ? 'secondary' : 'outline'}
                >
                  {detail.status}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {detail.provider} / {detail.model}
              </p>
            </div>
            {detail.job && (
              <Button
                variant="outline"
                size="sm"
                render={
                  <Link
                    to={`/admin/opportunities/${detail.job.id}`}
                    state={{ from }}
                  />
                }
              >
                <ExternalLink />
                Open opportunity
              </Button>
            )}
          </div>

          <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <MetaBlock
              label="User"
              icon={<User className="size-3.5" />}
              value={
                detail.user ? (
                  <Link
                    to={`/admin/users/${detail.user.id}`}
                    className="inline-flex items-center gap-1 font-medium text-indigo-600 underline underline-offset-4"
                  >
                    {detail.user.displayName || detail.user.email || 'View user'}
                    <ArrowUpRight className="size-3" />
                  </Link>
                ) : (
                  'Unknown user'
                )
              }
            />
            <MetaBlock
              label="Duration"
              icon={<CalendarClock className="size-3.5" />}
              value={formatDuration(detail.durationMs)}
            />
            <MetaBlock
              label="Estimated cost"
              icon={<Briefcase className="size-3.5" />}
              value={formatCost(detail.estimatedCostUsd)}
            />
            <MetaBlock
              label="Created"
              icon={<CalendarClock className="size-3.5" />}
              value={formatDateTime(detail.createdAt)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm text-slate-950">Error</CardTitle>
            <CardDescription>
              Captured error text for failed AI calls.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {detail.error ? (
              <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg border border-rose-200 bg-rose-50 p-4 text-xs leading-relaxed text-rose-800">
                {detail.error}
              </pre>
            ) : (
              <p className="text-sm text-slate-500">No error recorded for this run.</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm text-slate-950">Job context</CardTitle>
            <CardDescription>
              Opportunity linked to this AI call, when available.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            {detail.job ? (
              <>
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    Role
                  </div>
                  <Link
                    to={`/admin/opportunities/${detail.job.id}`}
                    state={{ from }}
                    className="mt-1 inline-flex items-center gap-1 font-medium text-indigo-600 underline underline-offset-4"
                  >
                    {detail.job.title || 'Untitled role'}
                    <ArrowUpRight className="size-3" />
                  </Link>
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    Company
                  </div>
                  <p className="mt-1 text-slate-600">
                    {detail.job.companyName || 'Unknown company'}
                  </p>
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    Source
                  </div>
                  <p className="mt-1 text-slate-600">{detail.job.source}</p>
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    Status
                  </div>
                  <Badge variant="outline" className="mt-1">
                    {detail.job.status}
                  </Badge>
                </div>
              </>
            ) : (
              <p className="text-slate-500">No linked job for this AI run.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function MetaBlock({
  label,
  icon,
  value,
}: {
  label: string
  icon: ReactNode
  value: ReactNode
}) {
  return (
    <div>
      <div className="flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-slate-400">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-slate-600">{value}</div>
    </div>
  )
}
