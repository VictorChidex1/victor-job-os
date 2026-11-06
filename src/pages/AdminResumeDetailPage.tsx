import { Link, useLocation, useNavigate, useParams } from 'react-router'
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarClock,
  ExternalLink,
  FileText,
  Star,
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
import { EmptyState } from '@/components/states/EmptyState'
import { LoadingState } from '@/components/states/LoadingState'
import { useAdminResumeDetail } from '@/hooks/useAdminResumeDetail'
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

export function AdminResumeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const { detail, loading, error, refresh } = useAdminResumeDetail(id)

  usePageMeta({
    title: detail
      ? `${detail.name} — Resume — Admin — Victor Job OS`
      : 'Resume variant detail — Admin — Victor Job OS',
    description: 'Read-only cross-user resume variant detail for the Job OS administrator.',
    noindex: true,
    path: `/admin/resumes/${id ?? ''}`,
  })

  const returnTo =
    typeof (location.state as { from?: unknown } | null)?.from === 'string'
      ? (location.state as { from: string }).from
      : '/admin/resumes'

  function goBack() {
    navigate(returnTo)
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl p-4 sm:p-6">
        <LoadingState label="Loading resume variant…" rows={5} />
      </div>
    )
  }

  if (error || !detail) {
    return (
      <div className="mx-auto w-full max-w-7xl p-4 sm:p-6">
        <EmptyState
          title="Unable to load this resume variant"
          description={error ?? 'The resume variant could not be found.'}
          action={
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={goBack}>
                Back to resumes
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
      <div>
        <Button variant="ghost" size="sm" onClick={goBack}>
          <ArrowLeft />
          Resumes
        </Button>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="flex flex-col gap-4 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <FileText className="size-5 text-indigo-500" />
                <h1 className="text-2xl font-bold tracking-tight text-slate-950">
                  {detail.name}
                </h1>
                {detail.isDefault && (
                  <Badge variant="secondary" className="gap-1">
                    <Star className="size-3" />
                    Default
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {detail.targetRoles.length > 0
                  ? detail.targetRoles.join(' · ')
                  : 'No target roles specified'}
              </p>
            </div>
            {detail.resumeUrl && (
              <Button
                variant="outline"
                size="sm"
                render={
                  <a href={detail.resumeUrl} target="_blank" rel="noreferrer" />
                }
              >
                <ExternalLink />
                Open resume
              </Button>
            )}
          </div>

          <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-slate-400">
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
                <p className="mt-1 text-slate-600">Unknown user</p>
              )}
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Default
              </div>
              <p className="mt-1 text-slate-600">{detail.isDefault ? 'Yes' : 'No'}</p>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Created
              </div>
              <p className="mt-1 flex items-center gap-1 text-slate-600">
                <CalendarClock className="size-3.5" />
                {formatDateTime(detail.createdAt)}
              </p>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Updated
              </div>
              <p className="mt-1 text-slate-600">{formatDateTime(detail.updatedAt)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm text-slate-950">Target roles</CardTitle>
            <CardDescription>Roles this resume variant is tailored for.</CardDescription>
          </CardHeader>
          <CardContent>
            {detail.targetRoles.length === 0 ? (
              <p className="text-sm text-slate-500">No target roles specified.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {detail.targetRoles.map((role) => (
                  <Badge key={role} variant="outline">
                    {role}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm text-slate-950">Technologies</CardTitle>
            <CardDescription>
              Technologies highlighted by this resume variant.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {detail.technologies.length === 0 ? (
              <p className="text-sm text-slate-500">No technologies specified.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {detail.technologies.map((technology) => (
                  <Badge key={technology} variant="outline">
                    {technology}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm text-slate-950">Notes</CardTitle>
          <CardDescription>
            Freeform notes attached by the user. Not indexed for search.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">
            {detail.notes || 'No notes recorded.'}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
