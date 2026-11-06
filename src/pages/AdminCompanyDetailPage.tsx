import { Link, useLocation, useNavigate, useParams } from 'react-router'
import {
  ArrowLeft,
  ArrowUpRight,
  Building2,
  CalendarClock,
  ExternalLink,
  Globe,
  MapPin,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { EmptyState } from '@/components/states/EmptyState'
import { LoadingState } from '@/components/states/LoadingState'
import { useAdminCompanyDetail } from '@/hooks/useAdminCompanyDetail'
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

export function AdminCompanyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const { detail, loading, error, refresh } = useAdminCompanyDetail(id)

  usePageMeta({
    title: detail
      ? `${detail.name} — Admin — Victor Job OS`
      : 'Company detail — Admin — Victor Job OS',
    description: 'Read-only cross-user company detail for the Job OS administrator.',
    noindex: true,
    path: `/admin/companies/${id ?? ''}`,
  })

  const returnTo =
    typeof (location.state as { from?: unknown } | null)?.from === 'string'
      ? (location.state as { from: string }).from
      : '/admin/companies'
  const from = `${location.pathname}${location.search}`

  function goBack() {
    navigate(returnTo)
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl p-4 sm:p-6">
        <LoadingState label="Loading company…" rows={6} />
      </div>
    )
  }

  if (error || !detail) {
    return (
      <div className="mx-auto w-full max-w-7xl p-4 sm:p-6">
        <EmptyState
          title="Unable to load this company"
          description={error ?? 'The company could not be found.'}
          action={
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={goBack}>
                Back to companies
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
          Companies
        </Button>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="flex flex-col gap-4 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-950">
                  {detail.name}
                </h1>
                <Badge variant={detail.researched ? 'secondary' : 'outline'}>
                  {detail.researched ? 'Researched' : 'Not researched'}
                </Badge>
              </div>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                <Building2 className="size-4" />
                {detail.industry || 'Industry unknown'}
                {detail.location && (
                  <>
                    <span className="text-slate-300">·</span>
                    <MapPin className="size-3.5" />
                    {detail.location}
                  </>
                )}
              </p>
            </div>
            {detail.website && (
              <Button
                variant="outline"
                size="sm"
                render={
                  <a href={detail.website} target="_blank" rel="noreferrer" />
                }
              >
                <Globe />
                Company website
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
                Opportunities
              </div>
              <p className="mt-1 font-mono text-slate-600">{detail.jobCount}</p>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Last seen
              </div>
              <p className="mt-1 flex items-center gap-1 text-slate-600">
                <CalendarClock className="size-3.5" />
                {formatDate(detail.lastSeenAt)}
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

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex flex-col gap-4">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm text-slate-950">Company profile</CardTitle>
              <CardDescription>
                Read-only company context captured from the user workspace.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm text-slate-600">
              <p className="whitespace-pre-line leading-relaxed">
                {detail.description || 'No description stored.'}
              </p>
              {detail.product && (
                <MetaRow label="Product / service" value={detail.product} />
              )}
              {detail.roleContext && (
                <MetaRow label="Role context" value={detail.roleContext} />
              )}
              {detail.hiringSignals.length > 0 && (
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    Hiring signals
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {detail.hiringSignals.map((signal) => (
                      <Badge key={signal} variant="outline">
                        {signal}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm text-slate-950">Related opportunities</CardTitle>
              <CardDescription>
                Most recent opportunities linked to this company.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {detail.opportunities.length === 0 ? (
                <p className="text-sm text-slate-500">No opportunities linked.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Role</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden sm:table-cell">Discovered</TableHead>
                        <TableHead className="w-10">
                          <span className="sr-only">Open</span>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detail.opportunities.map((opportunity) => (
                        <TableRow key={opportunity.id}>
                          <TableCell className="whitespace-normal py-3 font-medium text-slate-900">
                            <Link
                              to={`/admin/opportunities/${opportunity.id}`}
                              state={{ from }}
                              className="hover:text-indigo-700"
                            >
                              {opportunity.title || 'Untitled role'}
                            </Link>
                          </TableCell>
                          <TableCell className="text-xs text-slate-500">
                            {SOURCE_LABELS[
                              opportunity.source as keyof typeof SOURCE_LABELS
                            ] ?? opportunity.source}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{opportunity.status}</Badge>
                          </TableCell>
                          <TableCell className="hidden text-xs text-slate-500 sm:table-cell">
                            {formatDate(opportunity.discoveredAt)}
                          </TableCell>
                          <TableCell>
                            <Link
                              to={`/admin/opportunities/${opportunity.id}`}
                              state={{ from }}
                              className="text-slate-400 hover:text-slate-700"
                              aria-label="Open opportunity"
                            >
                              <ArrowUpRight className="ml-auto size-4" />
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm text-slate-950">Related applications</CardTitle>
              <CardDescription>Applications linked to this company.</CardDescription>
            </CardHeader>
            <CardContent>
              {detail.applications.length === 0 ? (
                <p className="text-sm text-slate-500">No applications linked.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden sm:table-cell">Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detail.applications.map((application) => (
                      <TableRow key={application.id}>
                        <TableCell className="whitespace-normal py-3 font-medium text-slate-900">
                          <Link
                            to={`/admin/applications/${application.id}`}
                            state={{ from }}
                            className="hover:text-indigo-700"
                          >
                            {application.jobTitle || 'Untitled application'}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{application.status}</Badge>
                        </TableCell>
                        <TableCell className="hidden text-xs text-slate-500 sm:table-cell">
                          {formatDate(application.updatedAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm text-slate-950">Related outreach</CardTitle>
              <CardDescription>Outreach linked to this company.</CardDescription>
            </CardHeader>
            <CardContent>
              {detail.outreach.length === 0 ? (
                <p className="text-sm text-slate-500">No outreach linked.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden sm:table-cell">Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detail.outreach.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="whitespace-normal py-3">
                          <Link
                            to={`/admin/outreach/${item.id}`}
                            state={{ from }}
                            className="font-medium text-slate-900 hover:text-indigo-700"
                          >
                            {item.subject || item.jobTitle || 'Untitled outreach'}
                          </Link>
                          {item.jobTitle && (
                            <div className="text-xs text-slate-500">{item.jobTitle}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.status}</Badge>
                        </TableCell>
                        <TableCell className="hidden text-xs text-slate-500 sm:table-cell">
                          {formatDate(item.updatedAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm text-slate-950">
                <Users className="size-4 text-indigo-500" />
                Contacts
              </CardTitle>
              <CardDescription>
                Contacts recorded for this company.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {detail.contacts.length === 0 ? (
                <p className="text-sm text-slate-500">No contacts recorded.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {detail.contacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="rounded-lg border border-slate-200 bg-white p-3 text-sm"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium text-slate-900">
                          {contact.name || contact.email || 'Unnamed contact'}
                        </p>
                        {contact.verified && (
                          <Badge variant="secondary">Verified</Badge>
                        )}
                      </div>
                      {contact.role && (
                        <p className="mt-1 text-xs text-slate-500">{contact.role}</p>
                      )}
                      {contact.email && (
                        <p className="mt-1 break-words text-xs text-slate-500">
                          {contact.email}
                        </p>
                      )}
                      {contact.confidence && (
                        <p className="mt-1 text-xs text-slate-400">
                          Confidence: {contact.confidence}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm text-slate-950">Research</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              <MetaRow
                label="Research summary"
                value={detail.researchSummary || 'No research summary stored.'}
              />
              <MetaRow
                label="Last researched"
                value={formatDateTime(detail.lastResearchedAt)}
              />
              <MetaRow label="Created" value={formatDateTime(detail.createdAt)} />
              <MetaRow label="Updated" value={formatDateTime(detail.updatedAt)} />
              {detail.sourceUrls.length > 0 && (
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    Sources
                  </div>
                  <ul className="mt-1 flex flex-col gap-1">
                    {detail.sourceUrls.map((url) => (
                      <li key={url}>
                        <a
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 break-all text-xs text-indigo-600 underline underline-offset-4"
                        >
                          {url}
                          <ExternalLink className="size-3 shrink-0" />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
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
      <p className="mt-1 whitespace-pre-line break-words text-slate-600">{value}</p>
    </div>
  )
}
