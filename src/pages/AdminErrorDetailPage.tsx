import { Link, useLocation, useNavigate, useParams } from 'react-router'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  CalendarClock,
  Code2,
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
import { useAdminErrorLogDetail } from '@/hooks/useAdminErrorLogDetail'
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

export function AdminErrorDetailPage() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const { detail, loading, error, refresh } = useAdminErrorLogDetail(id)

  usePageMeta({
    title: detail
      ? `${detail.fn} — Error — Admin — Victor Job OS`
      : 'Error detail — Admin — Victor Job OS',
    description: 'Read-only error log detail for the Job OS administrator.',
    noindex: true,
    path: `/admin/system/errors/${id ?? ''}`,
  })

  const returnTo =
    typeof (location.state as { from?: unknown } | null)?.from === 'string'
      ? (location.state as { from: string }).from
      : '/admin/system/errors'

  function goBack() {
    navigate(returnTo)
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl p-4 sm:p-6">
        <LoadingState label="Loading error log…" rows={5} />
      </div>
    )
  }

  if (error || !detail) {
    return (
      <div className="mx-auto w-full max-w-7xl p-4 sm:p-6">
        <EmptyState
          title="Unable to load this error log"
          description={error ?? 'The error log could not be found.'}
          action={
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={goBack}>
                Back to errors
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
          Errors
        </Button>
        <AdminSystemTabs />
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="flex flex-col gap-4 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <AlertTriangle className="size-5 text-amber-500" />
                <h1 className="text-2xl font-bold tracking-tight text-slate-950">
                  {detail.fn}
                </h1>
                <Badge variant="outline">error</Badge>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {detail.message || 'No error message'}
              </p>
            </div>
          </div>

          <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm sm:grid-cols-2">
            <div>
              <div className="flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-slate-400">
                <User className="size-3.5" />
                User
              </div>
              {detail.user ? (
                <Link
                  to={`/admin/users/${detail.user.id}`}
                  className="mt-1 inline-flex items-center gap-1 font-medium text-indigo-600 underline underline-offset-4"
                >
                  {detail.user.displayName || detail.user.email || 'View user'}
                  <ArrowUpRight className="size-3" />
                </Link>
              ) : (
                <p className="mt-1 text-slate-600">System / unknown user</p>
              )}
            </div>
            <div>
              <div className="flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-slate-400">
                <CalendarClock className="size-3.5" />
                Created
              </div>
              <p className="mt-1 text-slate-600">{formatDateTime(detail.createdAt)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm text-slate-950">
              <Code2 className="size-4 text-indigo-500" />
              Stack trace
            </CardTitle>
            <CardDescription>Captured server or client stack.</CardDescription>
          </CardHeader>
          <CardContent>
            {detail.stack ? (
              <pre className="max-h-[32rem] overflow-auto whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-950 p-4 text-xs leading-relaxed text-slate-100">
                {detail.stack}
              </pre>
            ) : (
              <p className="text-sm text-slate-500">No stack trace recorded.</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm text-slate-950">
              <Code2 className="size-4 text-indigo-500" />
              Context
            </CardTitle>
            <CardDescription>Structured context attached to the error.</CardDescription>
          </CardHeader>
          <CardContent>
            {detail.context ? (
              <pre className="max-h-[32rem] overflow-auto whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-slate-700">
                {JSON.stringify(detail.context, null, 2)}
              </pre>
            ) : (
              <p className="text-sm text-slate-500">No context recorded.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
