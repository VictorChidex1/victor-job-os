import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { ChevronRight, Search, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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
import { useAdminUsers } from '@/hooks/useAdminUsers'
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

function roleVariant(role: AdminUserSummary['role']): 'secondary' | 'outline' {
  return role === 'admin' || role === 'owner' ? 'secondary' : 'outline'
}

export function AdminUsersPage() {
  usePageMeta({
    title: 'Users — Admin — Victor Job OS',
    description: 'Read-only user directory for the Job OS administrator.',
    noindex: true,
    path: '/admin/users',
  })

  const { users, loading, error, refresh } = useAdminUsers()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase()
    if (!search) return users
    return users.filter((user) =>
      [user.displayName, user.email, user.id, user.role, user.disabled ? 'disabled' : 'active']
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(search)),
    )
  }, [users, query])

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">Users</h1>
        <p className="mt-1 text-sm text-slate-500">
          Directory of authenticated accounts with protected role and account management.
        </p>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-sm text-slate-950">All users</CardTitle>
            <CardDescription>
              {users.length} account{users.length === 1 ? '' : 's'} found
            </CardDescription>
          </div>
          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name, email, role, or UID…"
              className="h-9 bg-white pl-9 pr-8"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700"
                aria-label="Clear search"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingState label="Loading users…" rows={5} />
          ) : error ? (
            <EmptyState
              title="Unable to load users"
              description={error}
              action={
                <Button size="sm" onClick={() => void refresh()}>
                  Try again
                </Button>
              }
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              title={users.length === 0 ? 'No users found' : 'No matching users'}
              description={
                users.length === 0
                  ? 'Authenticated accounts will appear here.'
                  : 'Try a different name, email, role, or UID.'
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">UID</TableHead>
                  <TableHead className="hidden sm:table-cell">Joined</TableHead>
                  <TableHead className="w-10">
                    <span className="sr-only">Open user</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((user) => (
                  <TableRow
                    key={user.id}
                    role="link"
                    tabIndex={0}
                    aria-label={`Open ${user.displayName || user.email || 'user'} details`}
                    className="cursor-pointer transition-colors hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none"
                    onClick={() => navigate(`/admin/users/${user.id}`)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        navigate(`/admin/users/${user.id}`)
                      }
                    }}
                  >
                    <TableCell className="whitespace-normal py-3">
                      <div className="font-medium text-slate-950">
                        {user.displayName || 'Unnamed user'}
                      </div>
                      <div className="text-xs text-slate-500">{user.email || 'No email'}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={roleVariant(user.role)}>{user.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.disabled ? 'outline' : 'secondary'}>
                        {user.disabled ? 'Disabled' : 'Active'}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden max-w-48 truncate font-mono text-xs text-slate-500 md:table-cell">
                      {user.id}
                    </TableCell>
                    <TableCell className="hidden text-xs text-slate-500 sm:table-cell">
                      {formatDate(user.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <ChevronRight className="ml-auto size-4 text-slate-400" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
