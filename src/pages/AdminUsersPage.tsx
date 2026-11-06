import { useMemo, useState } from 'react'
import { Search, UserRound, X } from 'lucide-react'
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
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
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<AdminUserSummary | null>(null)

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase()
    if (!search) return users
    return users.filter((user) =>
      [user.displayName, user.email, user.id, user.role]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(search)),
    )
  }, [users, query])

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">Users</h1>
        <p className="mt-1 text-sm text-slate-500">
          Read-only directory of authenticated accounts. Role and account management tools
          will be added next.
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
                  <TableHead className="hidden md:table-cell">UID</TableHead>
                  <TableHead className="hidden sm:table-cell">Joined</TableHead>
                  <TableHead className="text-right">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="whitespace-normal py-3">
                      <div className="font-medium text-slate-950">
                        {user.displayName || 'Unnamed user'}
                      </div>
                      <div className="text-xs text-slate-500">{user.email || 'No email'}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={roleVariant(user.role)}>{user.role}</Badge>
                    </TableCell>
                    <TableCell className="hidden max-w-48 truncate font-mono text-xs text-slate-500 md:table-cell">
                      {user.id}
                    </TableCell>
                    <TableCell className="hidden text-xs text-slate-500 sm:table-cell">
                      {formatDate(user.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelected(user)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Sheet open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent side="right" className="w-full data-[side=right]:sm:max-w-md">
          <SheetHeader>
            <SheetTitle>User account</SheetTitle>
            <SheetDescription>Read-only identity information.</SheetDescription>
          </SheetHeader>
          {selected && (
            <div className="flex flex-col gap-4 px-4 pb-6">
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex size-10 items-center justify-center rounded-lg bg-white text-indigo-600 ring-1 ring-slate-200">
                  <UserRound className="size-5" />
                </div>
                <div className="min-w-0">
                  <div className="truncate font-semibold text-slate-950">
                    {selected.displayName || 'Unnamed user'}
                  </div>
                  <div className="truncate text-sm text-slate-500">
                    {selected.email || 'No email'}
                  </div>
                </div>
              </div>
              <dl className="grid gap-3 text-sm">
                <div>
                  <dt className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    Role
                  </dt>
                  <dd className="mt-1">
                    <Badge variant={roleVariant(selected.role)}>{selected.role}</Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    UID
                  </dt>
                  <dd className="mt-1 break-all font-mono text-xs text-slate-700">
                    {selected.id}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    Joined
                  </dt>
                  <dd className="mt-1 text-slate-700">{formatDate(selected.createdAt)}</dd>
                </div>
              </dl>
              <p className="rounded-lg border border-dashed border-slate-200 p-3 text-xs text-slate-500">
                Account role changes, disabling, and deletion will be added in the next admin
                management phase.
              </p>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
