import { Link, useLocation, useNavigate, useParams } from 'react-router'
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarClock,
  ScrollText,
  ShieldCheck,
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
import { useAdminAuditLogDetail } from '@/hooks/useAdminAuditLogDetail'
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

function actionLabel(action: string): string {
  return action
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function AdminAuditLogDetailPage() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const { detail, loading, error, refresh } = useAdminAuditLogDetail(id)

  usePageMeta({
    title: detail
      ? `${actionLabel(detail.action)} — Audit — Admin — Victor Job OS`
      : 'Audit detail — Admin — Victor Job OS',
    description: 'Read-only audit detail for protected admin actions.',
    noindex: true,
    path: `/admin/system/audit/${id ?? ''}`,
  })

  const returnTo =
    typeof (location.state as { from?: unknown } | null)?.from === 'string'
      ? (location.state as { from: string }).from
      : '/admin/system/audit'

  function goBack() {
    navigate(returnTo)
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl p-4 sm:p-6">
        <LoadingState label="Loading audit entry…" rows={5} />
      </div>
    )
  }

  if (error || !detail) {
    return (
      <div className="mx-auto w-full max-w-7xl p-4 sm:p-6">
        <EmptyState
          title="Unable to load this audit entry"
          description={error ?? 'The audit entry could not be found.'}
          action={
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={goBack}>
                Back to audit log
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
          Audit log
        </Button>
        <AdminSystemTabs />
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="flex flex-col gap-4 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <ScrollText className="size-5 text-indigo-500" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-950">
              {actionLabel(detail.action)}
            </h1>
            <Badge variant="outline">{detail.action}</Badge>
          </div>
          <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Actor
              </div>
              {detail.actor ? (
                <Link
                  to={`/admin/users/${detail.actor.id}`}
                  className="mt-1 inline-flex items-center gap-1 font-medium text-indigo-600 underline underline-offset-4"
                >
                  {detail.actor.displayName || detail.actor.email || detail.actor.id}
                  <ArrowUpRight className="size-3" />
                </Link>
              ) : detail.actorType === 'cli' ? (
                <p className="mt-1 text-xs text-slate-600">
                  CLI · {detail.actorEmail || detail.actorUid || 'Unknown'}
                </p>
              ) : (
                <p className="mt-1 break-all font-mono text-xs text-slate-600">
                  {detail.actorUid || 'Unknown'}
                </p>
              )}
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Target
              </div>
              {detail.target ? (
                <Link
                  to={`/admin/users/${detail.target.id}`}
                  className="mt-1 inline-flex items-center gap-1 font-medium text-indigo-600 underline underline-offset-4"
                >
                  {detail.target.displayName || detail.target.email || detail.target.id}
                  <ArrowUpRight className="size-3" />
                </Link>
              ) : (
                <p className="mt-1 break-all text-xs text-slate-600">
                  {detail.targetEmail || detail.targetUid || 'Unknown'}
                </p>
              )}
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Timestamp
              </div>
              <p className="mt-1 flex items-center gap-1 text-slate-600">
                <CalendarClock className="size-3.5" />
                {formatDateTime(detail.createdAt)}
              </p>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Audit ID
              </div>
              <p className="mt-1 break-all font-mono text-xs text-slate-600">
                {detail.id}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm text-slate-950">Account changes</CardTitle>
            <CardDescription>
              Before and after state captured by the admin action.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <ChangeRow
              label="Role"
              before={detail.beforeRole || '—'}
              after={detail.afterRole || '—'}
            />
            <ChangeRow
              label="Disabled"
              before={
                detail.beforeDisabled === undefined
                  ? '—'
                  : detail.beforeDisabled
                    ? 'Yes'
                    : 'No'
              }
              after={
                detail.afterDisabled === undefined
                  ? '—'
                  : detail.afterDisabled
                    ? 'Yes'
                    : 'No'
              }
            />
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Reason
              </div>
              <p className="mt-1 whitespace-pre-line leading-relaxed text-slate-600">
                {detail.reason || 'No reason recorded.'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm text-slate-950">
              <ShieldCheck className="size-4 text-indigo-500" />
              Metadata
            </CardTitle>
            <CardDescription>
              Additional structured context for this security event.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {detail.metadata ? (
              <pre className="max-h-[28rem] overflow-auto whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-slate-700">
                {JSON.stringify(detail.metadata, null, 2)}
              </pre>
            ) : (
              <p className="text-sm text-slate-500">No additional metadata.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function ChangeRow({
  label,
  before,
  after,
}: {
  label: string
  before: string
  after: string
}) {
  return (
    <div className="grid grid-cols-[7rem_minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
      <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
        {label}
      </span>
      <Badge variant="outline" className="justify-center">
        {before}
      </Badge>
      <span className="text-slate-400">→</span>
      <Badge variant="secondary" className="justify-center">
        {after}
      </Badge>
    </div>
  )
}
