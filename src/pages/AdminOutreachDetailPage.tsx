import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { ArrowLeft, ArrowUpRight, CalendarClock, Mail } from 'lucide-react'
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
import { useAdminOutreachDetail } from '@/hooks/useAdminOutreachDetail'
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

export function AdminOutreachDetailPage() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const { detail, loading, error, refresh } = useAdminOutreachDetail(id)

  usePageMeta({
    title: detail
      ? `${detail.subject || detail.jobTitle || 'Outreach'} — Admin — Victor Job OS`
      : 'Outreach detail — Admin — Victor Job OS',
    description: 'Read-only cross-user outreach detail for the Job OS administrator.',
    noindex: true,
    path: `/admin/outreach/${id ?? ''}`,
  })

  const returnTo =
    typeof (location.state as { from?: unknown } | null)?.from === 'string'
      ? (location.state as { from: string }).from
      : '/admin/outreach'

  function goBack() {
    navigate(returnTo)
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl p-4 sm:p-6">
        <LoadingState label="Loading outreach…" rows={6} />
      </div>
    )
  }

  if (error || !detail) {
    return (
      <div className="mx-auto w-full max-w-7xl p-4 sm:p-6">
        <EmptyState
          title="Unable to load this outreach"
          description={error ?? 'The outreach could not be found.'}
          action={
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={goBack}>
                Back to outreach
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
          Outreach
        </Button>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="flex flex-col gap-4 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-950">
                  {detail.subject || 'Untitled outreach'}
                </h1>
                <Badge variant="outline">{detail.status}</Badge>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {detail.jobTitle || 'Unknown role'} ·{' '}
                {detail.companyName || 'Unknown company'}
              </p>
            </div>
            {detail.contactEmail && (
              <Button
                variant="outline"
                size="sm"
                render={<a href={`mailto:${detail.contactEmail}`} />}
              >
                <Mail />
                Email contact
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
                Contact
              </div>
              <p className="mt-1 break-words text-slate-600">
                {detail.contactName || detail.contactEmail || 'Not specified'}
              </p>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Follow-ups
              </div>
              <p className="mt-1 text-slate-600">{detail.followUpCount}</p>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Last follow-up
              </div>
              <p className="mt-1 flex items-center gap-1 text-slate-600">
                <CalendarClock className="size-3.5" />
                {formatDateTime(detail.lastFollowUpAt)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm text-slate-950">Current message</CardTitle>
            <CardDescription>The editable draft as stored by the user.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Subject
              </div>
              <p className="mt-1 text-sm font-medium text-slate-900">
                {detail.subject || '—'}
              </p>
            </div>
            <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">
              {detail.body || 'No message body stored.'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm text-slate-950">Original AI draft</CardTitle>
            <CardDescription>Immutable source draft for comparison.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Subject
              </div>
              <p className="mt-1 text-sm font-medium text-slate-900">
                {detail.draftSubject || '—'}
              </p>
            </div>
            <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">
              {detail.draftBody || 'No draft body stored.'}
            </p>
            <div className="flex flex-wrap gap-2 text-xs text-slate-500">
              {detail.aiProvider && <Badge variant="outline">{detail.aiProvider}</Badge>}
              {detail.model && <Badge variant="outline">{detail.model}</Badge>}
              {detail.promptVersion && (
                <Badge variant="outline">{detail.promptVersion}</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm text-slate-950">Follow-ups</CardTitle>
            <CardDescription>
              Scheduled and completed follow-ups, in sequence order.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {detail.followUps.length === 0 ? (
              <p className="text-sm text-slate-500">No follow-ups recorded.</p>
            ) : (
              <ol className="flex flex-col gap-3">
                {detail.followUps.map((followUp) => (
                  <li
                    key={followUp.id}
                    className="rounded-lg border border-slate-200 bg-white p-3 text-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">#{followUp.sequence}</Badge>
                        <Badge variant="secondary">{followUp.status}</Badge>
                      </div>
                      <span className="text-xs text-slate-400">
                        Scheduled {formatDateTime(followUp.scheduledFor)}
                      </span>
                    </div>
                    {followUp.draftSubject && (
                      <p className="mt-2 text-xs font-medium text-slate-700">
                        {followUp.draftSubject}
                      </p>
                    )}
                    {followUp.draftBody && (
                      <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-slate-600">
                        {followUp.draftBody}
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm text-slate-950">Timeline</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <MetaRow label="Created" value={formatDateTime(detail.createdAt)} />
            <MetaRow label="Updated" value={formatDateTime(detail.updatedAt)} />
            <MetaRow label="Approved" value={formatDateTime(detail.approvedAt)} />
            <MetaRow label="Scheduled" value={formatDateTime(detail.scheduledAt)} />
            <MetaRow label="Sent" value={formatDateTime(detail.sentAt)} />
            <MetaRow label="Replied" value={formatDateTime(detail.replyAt)} />
            <MetaRow label="Closed" value={formatDateTime(detail.closedAt)} />
            {detail.closedReason && (
              <MetaRow label="Close reason" value={detail.closedReason} />
            )}
            <MetaRow
              label="Sent manually"
              value={detail.sentManually ? 'Yes' : 'No'}
            />
          </CardContent>
        </Card>
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
