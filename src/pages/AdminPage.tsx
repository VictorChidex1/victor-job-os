import { Link } from 'react-router'
import {
  Briefcase,
  Building2,
  ClipboardList,
  Send,
  ShieldCheck,
  UserPlus,
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
import { useAdminOverview } from '@/hooks/useAdminOverview'
import { usePageMeta } from '@/hooks/usePageMeta'
import type { AdminUserSummary } from '@/types/admin'

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

const METRICS = [
  { key: 'userCount', label: 'Users', icon: Users },
  { key: 'newUsersThisWeek', label: 'New this week', icon: UserPlus },
  { key: 'jobCount', label: 'Opportunities', icon: Briefcase },
  { key: 'applicationCount', label: 'Applications', icon: ClipboardList },
  { key: 'outreachCount', label: 'Outreach', icon: Send },
  { key: 'companyCount', label: 'Companies', icon: Building2 },
] as const

function roleVariant(role: AdminUserSummary['role']): 'secondary' | 'outline' {
  return role === 'admin' || role === 'owner' ? 'secondary' : 'outline'
}

export function AdminPage() {
  usePageMeta({
    title: 'Admin overview — Victor Job OS',
    description: 'System-wide overview for the Job OS administrator.',
    noindex: true,
    path: '/admin',
  })

  const { overview, loading, error, refresh } = useAdminOverview()

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-950">
              System overview
            </h1>
            <Badge
              variant="outline"
              className="gap-1 border-indigo-200 bg-indigo-50 text-indigo-700"
            >
              <ShieldCheck className="size-3" />
              Admin console
            </Badge>
          </div>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Workspace-wide counts and account health. This console is separate from the
            personal Job OS workspace.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void refresh()}>
          Refresh
        </Button>
      </div>

      {loading ? (
        <LoadingState label="Loading admin overview…" rows={5} />
      ) : error ? (
        <EmptyState
          title="Unable to load the admin overview"
          description={error}
          action={
            <Button size="sm" onClick={() => void refresh()}>
              Try again
            </Button>
          }
        />
      ) : overview ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            {METRICS.map((metric) => {
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
                      {overview[metric.key]}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="flex flex-row items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-sm text-slate-950">Recent users</CardTitle>
                  <CardDescription>
                    Newest accounts across the workspace.
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" render={<Link to="/admin/users" />}>
                  View users
                </Button>
              </CardHeader>
              <CardContent>
                {overview.recentUsers.length === 0 ? (
                  <p className="text-sm text-slate-500">No users found.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead className="hidden sm:table-cell">Joined</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {overview.recentUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="whitespace-normal py-3">
                            <div className="font-medium text-slate-950">
                              {user.displayName || user.email || 'Unknown user'}
                            </div>
                            {user.displayName && user.email && (
                              <div className="text-xs text-slate-500">{user.email}</div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={roleVariant(user.role)}>{user.role}</Badge>
                          </TableCell>
                          <TableCell className="hidden text-xs text-slate-500 sm:table-cell">
                            {formatDate(user.createdAt)}
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
                <CardTitle className="text-sm text-slate-950">Console scope</CardTitle>
                <CardDescription>
                  Read-only foundation. Management tools arrive next.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 text-sm text-slate-600">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  User directory and account metadata
                </div>
                <div className="rounded-lg border border-dashed border-slate-200 p-3 text-slate-400">
                  Cross-user opportunities, applications, and outreach
                </div>
                <div className="rounded-lg border border-dashed border-slate-200 p-3 text-slate-400">
                  System health and audit history
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  )
}
