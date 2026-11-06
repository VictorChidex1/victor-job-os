import { Link, useLocation, useNavigate, useParams } from 'react-router'
import {
  ArrowLeft,
  ArrowUpRight,
  Building2,
  CalendarClock,
  ExternalLink,
  MapPin,
  Sparkles,
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
import { useAdminOpportunityDetail } from '@/hooks/useAdminOpportunityDetail'
import { usePageMeta } from '@/hooks/usePageMeta'
import { SOURCE_LABELS } from '@/lib/job-sources'

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

export function AdminOpportunityDetailPage() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const { detail, loading, error, refresh } = useAdminOpportunityDetail(id)

  usePageMeta({
    title: detail
      ? `${detail.title} — Admin — Victor Job OS`
      : 'Opportunity detail — Admin — Victor Job OS',
    description: 'Read-only cross-user opportunity detail for the Job OS administrator.',
    noindex: true,
    path: `/admin/opportunities/${id ?? ''}`,
  })

  const returnTo =
    typeof (location.state as { from?: unknown } | null)?.from === 'string'
      ? ((location.state as { from: string }).from)
      : '/admin/opportunities'

  function goBack() {
    navigate(returnTo)
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl p-4 sm:p-6">
        <LoadingState label="Loading opportunity…" rows={6} />
      </div>
    )
  }

  if (error || !detail) {
    return (
      <div className="mx-auto w-full max-w-7xl p-4 sm:p-6">
        <EmptyState
          title="Unable to load this opportunity"
          description={error ?? 'The opportunity could not be found.'}
          action={
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={goBack}>
                Back to opportunities
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
          Opportunities
        </Button>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="flex flex-col gap-4 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-950">
                  {detail.title}
                </h1>
                <Badge variant="outline">{detail.status}</Badge>
                <Badge variant="outline">
                  {SOURCE_LABELS[detail.source as keyof typeof SOURCE_LABELS] ??
                    detail.source}
                </Badge>
              </div>
              <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                <Building2 className="size-4" />
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

          <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm sm:grid-cols-3">
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
                Discovered
              </div>
              <p className="mt-1 flex items-center gap-1 text-slate-600">
                <CalendarClock className="size-3.5" />
                {formatDate(detail.discoveredAt)}
              </p>
            </div>
          </div>

          {detail.skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {detail.skills.map((skill) => (
                <Badge key={skill} variant="outline" className="font-normal">
                  {skill}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm text-slate-950">Description</CardTitle>
            <CardDescription>Plain-text job description from the source.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">
              {detail.description || 'No description stored.'}
            </p>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm text-slate-950">
                <Sparkles className="size-4 text-indigo-500" />
                Fit analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              {detail.analysis ? (
                <>
                  <div className="flex flex-wrap gap-2">
                    {typeof detail.analysis.fitScore === 'number' && (
                      <Badge variant="secondary">
                        Fit {detail.analysis.fitScore}%
                      </Badge>
                    )}
                  </div>
                  <p className="leading-relaxed text-slate-600">
                    {detail.analysis.summary || 'No summary provided.'}
                  </p>
                  {detail.analysis.matchedSkills.length > 0 && (
                    <div>
                      <div className="text-xs font-bold uppercase tracking-widest text-slate-400">
                        Matched
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {detail.analysis.matchedSkills.map((skill) => (
                          <Badge key={skill} variant="outline">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {[...detail.analysis.missingSkills, ...detail.analysis.concerns]
                    .length > 0 && (
                    <div>
                      <div className="text-xs font-bold uppercase tracking-widest text-slate-400">
                        Gaps and concerns
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {[...detail.analysis.missingSkills, ...detail.analysis.concerns].map(
                          (item) => (
                            <Badge key={item} variant="outline">
                              {item}
                            </Badge>
                          ),
                        )}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-slate-500">No analysis available for this opportunity.</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm text-slate-950">Company context</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              {detail.company ? (
                <>
                  <div className="font-medium text-slate-900">{detail.company.name}</div>
                  <div className="text-xs text-slate-500">
                    {detail.company.industry || 'Industry unknown'}
                  </div>
                  <p className="leading-relaxed text-slate-600">
                    {detail.company.researchSummary ||
                      detail.company.description ||
                      'No company research available.'}
                  </p>
                  {detail.company.website && (
                    <a
                      href={detail.company.website}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex w-fit items-center gap-1 text-xs text-indigo-600 underline underline-offset-4"
                    >
                      Company website
                      <ExternalLink className="size-3" />
                    </a>
                  )}
                </>
              ) : (
                <p className="text-slate-500">No company record available.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
