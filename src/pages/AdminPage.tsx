import {
  Briefcase,
  Building2,
  ClipboardList,
  Send,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
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
import { PageContainer } from '@/components/layout/PageContainer'
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
    title: 'Admin — Victor Job OS',
    description: 'System-wide overview for the Job OS administrator.',
    noindex: true,
    path: '/admin',
  })

  const { overview, loading, error, refresh } = useAdminOverview()

  return (
    <PageContainer
      title="Admin overview"
      description="System-wide counts and recent accounts. Management tools will be added next."
      actions={
        <Badge variant="outline" className="gap-1.5">
          <ShieldCheck className="size-3" />
          Admin access
        </Badge>
      }
    >
      {loading ? (
        <LoadingState label="Loading admin overview…" rows={5} />
      ) : error ? (
        <EmptyState
          title="Unable to load the admin overview"
          description={error}
          action={
            <button
              type="button"
              className="text-sm font-medium text-primary underline underline-offset-4"
              onClick={() => void refresh()}
            >
              Try again
            </button>
          }
        />
      ) : overview ? (
        <div className="flex flex-col gap-6">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {METRICS.map((metric) => {
              const Icon = metric.icon
              return (
                <Card key={metric.key}>
                  <CardContent className="flex flex-col gap-3 pt-5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[0.68rem] font-semibold uppercase tracking-widest text-muted-foreground">
                        {metric.label}
                      </span>
                      <Icon className="size-4 text-muted-foreground" />
                    </div>
                    <div className="font-mono text-3xl font-black tracking-tighter text-foreground">
                      {overview[metric.key]}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Recent users</CardTitle>
              <CardDescription>
                The newest accounts in the workspace. User management is a later admin phase.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {overview.recentUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No users found.</p>
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
                          <div className="font-medium text-foreground">
                            {user.displayName || user.email || 'Unknown user'}
                          </div>
                          {user.displayName && user.email && (
                            <div className="text-xs text-muted-foreground">
                              {user.email}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={roleVariant(user.role)}>{user.role}</Badge>
                        </TableCell>
                        <TableCell className="hidden text-xs text-muted-foreground sm:table-cell">
                          {formatDate(user.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <div className="rounded-xl border border-primary/15 bg-primary/5 p-4 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Foundation phase.</span>{' '}
            This overview is read-only. Cross-user opportunities, applications, outreach, and
            settings management will be added next.
          </div>
        </div>
      ) : null}
    </PageContainer>
  )
}
