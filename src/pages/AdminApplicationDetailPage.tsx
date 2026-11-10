import { Link, useLocation, useNavigate, useParams } from 'react-router'
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarClock,
  ExternalLink,
  MapPin,
} from 'lucide-react'
import { AdminApplicationInterviewsCard } from '@/components/admin/AdminApplicationInterviewsCard'
import { AtsApplicationMetadataCard } from '@/components/applications/AtsApplicationMetadataCard'
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
import { useAdminApplicationDetail } from '@/hooks/useAdminApplicationDetail'
import { usePageMeta } from '@/hooks/usePageMeta'
import { APPLICATION_STATUS_LABELS } from '@/lib/applications'
import { SOURCE_LABELS } from '@/lib/job-sources'
import type { ApplicationStatus } from '@/types/applications'

function formatDate(value?: { toDate?: () => Date }): string {
  const date = value?.toDate?.()
  return date
    ? date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '—'
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

function statusLabel(status: string): string {
  return APPLICATION_STATUS_LABELS[status as ApplicationStatus] ?? status
}

export function AdminApplicationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const { detail, loading, error, refresh } = useAdminApplicationDetail(id)

  usePageMeta({
    title: detail
      ? `${detail.jobTitle} — Application — Admin — Victor Job OS`
      : 'Application detail — Admin — Victor Job OS',
    description: 'Read-only cross-user application detail for the Job OS administrator.',
    noindex: true,
    path: `/admin/applications/${id ?? ''}`,
  })

  const returnTo =
    typeof (location.state as { from?: unknown } | null)?.from === 'string'
      ? (location.state as { from: string }).from
      : '/admin/applications'

  function goBack() {
    navigate(returnTo)
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl p-4 sm:p-6">
        <LoadingState label="Loading application…" rows={6} />
      </div>
    )
  }

  if (error || !detail) {
    return (
      <div className="mx-auto w-full max-w-7xl p-4 sm:p-6">
        <EmptyState
          title="Unable to load this application"
          description={error ?? 'The application could not be found.'}
          action={
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={goBack}>
                Back to applications
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
          Applications
        </Button>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="flex flex-col gap-4 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-950">
                  {detail.jobTitle || 'Untitled application'}
                </h1>
                <Badge variant="outline">{statusLabel(detail.status)}</Badge>
                {detail.outcome && (
                  <Badge variant="secondary">{detail.outcome}</Badge>
                )}
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {detail.companyName || 'Unknown company'}
              </p>
            </div>
            {detail.applicationUrl && (
              <Button
                variant="outline"
                size="sm"
                render={
                  <a href={detail.applicationUrl} target="_blank" rel="noreferrer" />
                }
              >
                <ExternalLink />
                Open application
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
                Location
              </div>
              <p className="mt-1 flex items-center gap-1 text-slate-600">
                <MapPin className="size-3.5" />
                {detail.remote ? 'Remote' : detail.location || 'Not specified'}
              </p>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Source
              </div>
              <p className="mt-1 text-slate-600">
                {SOURCE_LABELS[detail.jobSource as keyof typeof SOURCE_LABELS] ??
                  detail.jobSource}
              </p>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Origin
              </div>
              <p className="mt-1 text-slate-600">{detail.origin}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <AtsApplicationMetadataCard metadata={detail.atsMetadata} />

      <AdminApplicationInterviewsCard applicationId={detail.id} />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex flex-col gap-4">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm text-slate-950">Next action</CardTitle>
              <CardDescription>
                Read-only snapshot of what the user plans to do next.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              <p className="text-slate-700">
                {detail.nextAction || 'No next action recorded.'}
              </p>
              <p className="flex items-center gap-1.5 text-xs text-slate-500">
                <CalendarClock className="size-3.5" />
                Due {formatDate(detail.nextActionAt)}
              </p>
              {detail.notes && (
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    Notes
                  </div>
                  <p className="mt-1 whitespace-pre-line leading-relaxed text-slate-600">
                    {detail.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm text-slate-950">Status history</CardTitle>
              <CardDescription>
                Events recorded for this application, newest first.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {detail.events.length === 0 ? (
                <p className="text-sm text-slate-500">No events recorded.</p>
              ) : (
                <ol className="flex flex-col gap-3">
                  {detail.events.map((event) => (
                    <li
                      key={event.id}
                      className="rounded-lg border border-slate-200 bg-white p-3 text-sm"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge variant="outline">{event.type}</Badge>
                          {event.fromStatus && (
                            <span className="text-xs text-slate-500">
                              {statusLabel(event.fromStatus)} →
                            </span>
                          )}
                          {event.toStatus && (
                            <span className="text-xs font-medium text-slate-700">
                              {statusLabel(event.toStatus)}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-400">
                          {formatDateTime(event.createdAt)}
                        </span>
                      </div>
                      {event.note && (
                        <p className="mt-2 text-xs leading-relaxed text-slate-600">
                          {event.note}
                        </p>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm text-slate-950">Timeline</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              <MetaRow label="Created" value={formatDateTime(detail.createdAt)} />
              <MetaRow label="Updated" value={formatDateTime(detail.updatedAt)} />
              <MetaRow label="Approved" value={formatDateTime(detail.approvedAt)} />
              <MetaRow label="Submitted" value={formatDateTime(detail.submittedAt)} />
              <MetaRow label="Closed" value={formatDateTime(detail.closedAt)} />
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm text-slate-950">Preparation</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              <MetaRow
                label="Resume variant"
                value={detail.resumeVariantName || 'Not selected'}
              />
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  Resume
                </div>
                {detail.resumeUrl ? (
                  <a
                    href={detail.resumeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-xs text-indigo-600 underline underline-offset-4"
                  >
                    Open resume
                    <ExternalLink className="size-3" />
                  </a>
                ) : (
                  <p className="mt-1 text-slate-500">No resume attached.</p>
                )}
              </div>
              <MetaRow label="Contact" value={detail.contactId || 'None'} />
              <MetaRow
                label="Submitted manually"
                value={detail.submittedManually ? 'Yes' : 'No'}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-bold uppercase tracking-widest text-slate-400">
        {label}
      </div>
      <p className="mt-1 break-words text-slate-600">{value}</p>
    </div>
  )
}
