import { Link, useParams } from 'react-router'
import {
  ArrowLeft,
  Briefcase,
  Building2,
  ClipboardList,
  ExternalLink,
  FileText,
  Send,
  ShieldCheck,
} from 'lucide-react'
import { AdminUserManagementCard } from '@/components/admin/AdminUserManagementCard'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EmptyState } from '@/components/states/EmptyState'
import { LoadingState } from '@/components/states/LoadingState'
import { useAdminUserDetail } from '@/hooks/useAdminUserDetail'
import { usePageMeta } from '@/hooks/usePageMeta'
import { SOURCE_LABELS } from '@/lib/job-sources'
import type { AdminUserDetail } from '@/types/admin'

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

function roleVariant(role: string): 'secondary' | 'outline' {
  return role === 'admin' || role === 'owner' ? 'secondary' : 'outline'
}

function EmptyBlock({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
      <p className="text-sm text-slate-500">No {label} found.</p>
    </div>
  )
}

const COUNT_METRICS = [
  { key: 'opportunities', label: 'Opportunities', icon: Briefcase },
  { key: 'applications', label: 'Applications', icon: ClipboardList },
  { key: 'outreach', label: 'Outreach', icon: Send },
  { key: 'companies', label: 'Companies', icon: Building2 },
  { key: 'resumes', label: 'Resumes', icon: FileText },
] as const

export function AdminUserDetailPage() {
  const { uid } = useParams<{ uid: string }>()
  const { detail, loading, error, refresh } = useAdminUserDetail(uid)

  usePageMeta({
    title: detail?.user.displayName
      ? `${detail.user.displayName} — Admin — Victor Job OS`
      : 'User detail — Admin — Victor Job OS',
    description: 'Read-only user data inspection for the Job OS administrator.',
    noindex: true,
    path: `/admin/users/${uid ?? ''}`,
  })

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl p-4 sm:p-6">
        <LoadingState label="Loading user details…" rows={6} />
      </div>
    )
  }

  if (error || !detail) {
    return (
      <div className="mx-auto w-full max-w-7xl p-4 sm:p-6">
        <EmptyState
          title="Unable to load this user"
          description={error ?? 'The user could not be found.'}
          action={
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" render={<Link to="/admin/users" />}>
                Back to users
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
    <UserDetailContent detail={detail} onRefresh={refresh} />
  )
}

function UserDetailContent({
  detail,
  onRefresh,
}: {
  detail: AdminUserDetail
  onRefresh: () => Promise<void>
}) {
  const user = detail.user
  const initials = (user.displayName || user.email || 'U')
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
  const counts = detail.counts

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" size="sm" render={<Link to="/admin/users" />}>
          <ArrowLeft />
          Users
        </Button>
        <Badge variant="outline" className="gap-1 border-slate-200 text-slate-500">
          <ShieldCheck className="size-3" />
          Secure admin view
        </Badge>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="flex flex-col gap-5 p-5">
          <div className="flex flex-wrap items-start gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 font-mono text-lg font-bold text-indigo-700 ring-1 ring-indigo-100">
              {initials || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-2xl font-bold tracking-tight text-slate-950">
                  {user.displayName || 'Unnamed user'}
                </h1>
                <Badge variant={roleVariant(user.role)}>{user.role}</Badge>
                <Badge variant={user.disabled ? 'outline' : 'secondary'}>
                  {user.disabled ? 'Disabled' : 'Active'}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-slate-500">{user.email || 'No email'}</p>
              <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-500">
                <span>Joined {formatDate(user.createdAt)}</span>
                <span className="break-all font-mono">UID {user.id}</span>
              </div>
            </div>
          </div>
          <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
            Read-only data inspection remains the default. Protected account actions are
            available in the management panel below.
          </p>
        </CardContent>
      </Card>

      <AdminUserManagementCard user={user} onUpdated={onRefresh} />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {COUNT_METRICS.map((metric) => {
          const Icon = metric.icon
          return (
            <Card key={metric.key} className="border-slate-200 shadow-sm">
              <CardContent className="flex flex-col gap-3 pt-5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[0.65rem] font-bold uppercase tracking-widest text-slate-500">
                    {metric.label}
                  </span>
                  <Icon className="size-4 text-indigo-500" />
                </div>
                <div className="font-mono text-3xl font-black tracking-tighter text-slate-950">
                  {counts[metric.key]}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 bg-slate-100 p-1">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="outreach">Outreach</TabsTrigger>
          <TabsTrigger value="companies">Companies</TabsTrigger>
          <TabsTrigger value="resumes">Resumes</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm text-slate-950">Profile</CardTitle>
              <CardDescription>Professional profile owned by this account.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5 text-sm">
              {detail.profile ? (
                <>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-slate-400">
                      Headline
                    </div>
                    <p className="mt-1 font-medium text-slate-900">
                      {detail.profile.headline || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-slate-400">
                      Summary
                    </div>
                    <p className="mt-1 max-w-3xl leading-relaxed text-slate-600">
                      {detail.profile.summary || 'Not provided'}
                    </p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-widest text-slate-400">
                        Experience level
                      </div>
                      <p className="mt-1 text-slate-700">
                        {detail.profile.experienceLevel || 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <div className="text-xs font-bold uppercase tracking-widest text-slate-400">
                        Preferred roles
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {detail.profile.preferredRoles.length ? (
                          detail.profile.preferredRoles.map((role) => (
                            <Badge key={role} variant="outline">
                              {role}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-slate-500">Not provided</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-bold uppercase tracking-widest text-slate-400">
                        Skills
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {detail.profile.skills.length ? (
                          detail.profile.skills.map((skill) => (
                            <Badge key={skill} variant="outline">
                              {skill}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-slate-500">None listed</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-bold uppercase tracking-widest text-slate-400">
                        Technologies
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {detail.profile.technologies.length ? (
                          detail.profile.technologies.map((technology) => (
                            <Badge key={technology} variant="outline">
                              {technology}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-slate-500">None listed</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-bold uppercase tracking-widest text-slate-400">
                        Preferred locations
                      </div>
                      <p className="mt-1 text-slate-700">
                        {detail.profile.preferredLocations.length
                          ? detail.profile.preferredLocations.join(', ')
                          : 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <div className="text-xs font-bold uppercase tracking-widest text-slate-400">
                        Links
                      </div>
                      <div className="mt-1 flex flex-wrap gap-3">
                        {detail.profile.portfolioUrl && (
                          <a
                            href={detail.profile.portfolioUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-indigo-600 underline underline-offset-4"
                          >
                            Portfolio
                            <ExternalLink className="size-3" />
                          </a>
                        )}
                        {detail.profile.resumeUrl && (
                          <a
                            href={detail.profile.resumeUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-indigo-600 underline underline-offset-4"
                          >
                            Resume
                            <ExternalLink className="size-3" />
                          </a>
                        )}
                        {!detail.profile.portfolioUrl && !detail.profile.resumeUrl && (
                          <span className="text-slate-500">No links</span>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <EmptyBlock label="profile" />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="opportunities" className="mt-4">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm text-slate-950">Opportunities</CardTitle>
              <CardDescription>Most recent opportunities for this user.</CardDescription>
            </CardHeader>
            <CardContent>
              {detail.opportunities.length === 0 ? (
                <EmptyBlock label="opportunities" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Role</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden sm:table-cell">Discovered</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detail.opportunities.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell className="whitespace-normal py-3">
                          <div className="font-medium text-slate-900">{job.title}</div>
                          <div className="text-xs text-slate-500">{job.companyName}</div>
                        </TableCell>
                        <TableCell className="text-xs text-slate-500">
                          {SOURCE_LABELS[job.source as keyof typeof SOURCE_LABELS] ??
                            job.source}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{job.status}</Badge>
                        </TableCell>
                        <TableCell className="hidden text-xs text-slate-500 sm:table-cell">
                          {formatDate(job.discoveredAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="applications" className="mt-4">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm text-slate-950">Applications</CardTitle>
              <CardDescription>Application pipeline for this user.</CardDescription>
            </CardHeader>
            <CardContent>
              {detail.applications.length === 0 ? (
                <EmptyBlock label="applications" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden md:table-cell">Next action</TableHead>
                      <TableHead className="hidden sm:table-cell">Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detail.applications.map((application) => (
                      <TableRow key={application.id}>
                        <TableCell className="whitespace-normal py-3">
                          <div className="font-medium text-slate-900">
                            {application.jobTitle}
                          </div>
                          <div className="text-xs text-slate-500">
                            {application.companyName}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{application.status}</Badge>
                        </TableCell>
                        <TableCell className="hidden whitespace-normal text-xs text-slate-600 md:table-cell">
                          {application.nextAction || '—'}
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
        </TabsContent>

        <TabsContent value="outreach" className="mt-4">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm text-slate-950">Outreach</CardTitle>
              <CardDescription>Recent outreach records for this user.</CardDescription>
            </CardHeader>
            <CardContent>
              {detail.outreach.length === 0 ? (
                <EmptyBlock label="outreach" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company / role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden sm:table-cell">Sent</TableHead>
                      <TableHead className="hidden sm:table-cell">Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detail.outreach.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="whitespace-normal py-3">
                          <div className="font-medium text-slate-900">
                            {item.companyName}
                          </div>
                          <div className="text-xs text-slate-500">
                            {item.jobTitle || 'No role recorded'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.status}</Badge>
                        </TableCell>
                        <TableCell className="hidden text-xs text-slate-500 sm:table-cell">
                          {formatDate(item.sentAt)}
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
        </TabsContent>

        <TabsContent value="companies" className="mt-4">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm text-slate-950">Companies</CardTitle>
              <CardDescription>Company records owned by this user.</CardDescription>
            </CardHeader>
            <CardContent>
              {detail.companies.length === 0 ? (
                <EmptyBlock label="companies" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead>Research</TableHead>
                      <TableHead className="hidden sm:table-cell">Opportunities</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detail.companies.map((company) => (
                      <TableRow key={company.id}>
                        <TableCell className="whitespace-normal py-3">
                          <Link
                            to={`/admin/companies/${company.id}`}
                            state={{ from: `/admin/users/${user.id}` }}
                            className="font-medium text-slate-900 hover:text-indigo-700"
                          >
                            {company.name}
                          </Link>
                          <div className="text-xs text-slate-500">
                            {company.industry || 'Industry unknown'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={company.researched ? 'secondary' : 'outline'}>
                            {company.researched ? 'Researched' : 'Not researched'}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden font-mono text-xs text-slate-500 sm:table-cell">
                          {company.jobCount}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resumes" className="mt-4">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm text-slate-950">Resume variants</CardTitle>
              <CardDescription>Named resume versions owned by this user.</CardDescription>
            </CardHeader>
            <CardContent>
              {detail.resumes.length === 0 ? (
                <EmptyBlock label="resume variants" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Variant</TableHead>
                      <TableHead>Resume</TableHead>
                      <TableHead className="hidden sm:table-cell">Default</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detail.resumes.map((resume) => (
                      <TableRow key={resume.id}>
                        <TableCell className="font-medium text-slate-900">
                          <Link
                            to={`/admin/resumes/${resume.id}`}
                            state={{ from: `/admin/users/${user.id}` }}
                            className="hover:text-indigo-700"
                          >
                            {resume.name}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <a
                            href={resume.resumeUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-indigo-600 underline underline-offset-4"
                          >
                            Open
                            <ExternalLink className="size-3" />
                          </a>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {resume.isDefault ? (
                            <Badge variant="secondary">Default</Badge>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
