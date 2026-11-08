import { useMemo } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router'
import {
  ChevronRight,
  ScrollText,
  ShieldAlert,
  Target,
  UserCheck,
  X,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { AdminSystemTabs } from '@/components/admin/AdminSystemTabs'
import { SlidingPaginationBar } from '@/components/SlidingPaginationBar'
import { EmptyState } from '@/components/states/EmptyState'
import { LoadingState } from '@/components/states/LoadingState'
import { useAdminAuditLogsPage } from '@/hooks/useAdminAuditLogsPage'
import { useAdminUsers } from '@/hooks/useAdminUsers'
import { usePageMeta } from '@/hooks/usePageMeta'
import {
  appendCursor,
  currentPage,
  decodeCursorStack,
  encodeCursorStack,
  popCursor,
} from '@/lib/cursorPagination'
import { AUDIT_ACTIONS } from '@/services/adminAuditLogs'
import type { AdminAuditLog } from '@/types/admin'

const PAGE_SIZE = 25

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

function actionLabel(action: string): string {
  return action
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function AdminAuditLogPage() {
  usePageMeta({
    title: 'Audit log — Admin — Victor Job OS',
    description: 'Read-only audit history for protected admin actions.',
    noindex: true,
    path: '/admin/system/audit',
  })

  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const action = searchParams.get('action') ?? ''
  const actorUid = searchParams.get('actor') ?? ''
  const targetUid = searchParams.get('target') ?? ''
  const cursorParam = searchParams.get('cursors') ?? ''
  const cursorStack = useMemo(
    () => decodeCursorStack(cursorParam),
    [cursorParam],
  )
  const page = currentPage(cursorStack)
  const activeCursor = cursorStack[cursorStack.length - 1] ?? null

  const { users } = useAdminUsers()
  const userMap = useMemo(
    () => new Map(users.map((user) => [user.id, user])),
    [users],
  )
  const { items, total, hasNext, nextCursor, loading, error, refresh } =
    useAdminAuditLogsPage({
      action,
      actorUid,
      targetUid,
      cursor: activeCursor,
      pageSize: PAGE_SIZE,
    })

  function updateFilter(key: string, value: string) {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    next.delete('cursors')
    setSearchParams(next, { replace: true })
  }

  function setCursorStack(nextStack: typeof cursorStack) {
    const next = new URLSearchParams(searchParams)
    const encoded = encodeCursorStack(nextStack)
    if (encoded) next.set('cursors', encoded)
    else next.delete('cursors')
    setSearchParams(next, { replace: true })
  }

  function goNextPage() {
    if (!nextCursor) return
    setCursorStack(appendCursor(cursorStack, nextCursor))
  }

  function goPrevPage() {
    if (cursorStack.length === 0) return
    setCursorStack(popCursor(cursorStack))
  }

  function clearFilters() {
    setSearchParams(new URLSearchParams(), { replace: true })
  }

  function openAudit(id: string) {
    navigate(`/admin/system/audit/${id}`, {
      state: { from: `${location.pathname}${location.search}` },
    })
  }

  const hasFilters = Boolean(action || actorUid || targetUid)
  const userLabel = (id: string) => {
    const user = userMap.get(id)
    return user?.displayName || user?.email || `${id.slice(0, 14)}…`
  }
  const actorLabel = (item: AdminAuditLog) =>
    item.actorType === 'cli'
      ? item.actorEmail || 'CLI'
      : userLabel(item.actorUid)

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">
            Audit log
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Read-only history of protected role, account, and deletion actions.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" render={<Link to="/admin/users" />}>
            Manage users
          </Button>
          <Button variant="outline" size="sm" onClick={() => void refresh()}>
            Refresh
          </Button>
        </div>
      </div>

      <AdminSystemTabs />

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm text-slate-950">Filters</CardTitle>
          <CardDescription>
            Page {page} · {hasNext ? 'More available' : 'End of results'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {/* Audit Action Select */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <ShieldAlert className="size-3 text-primary" />
                <span>Audit Action</span>
              </label>
              <Select
                value={action || 'all'}
                onValueChange={(value) =>
                  updateFilter('action', value === 'all' ? '' : (value ?? ''))
                }
              >
                <SelectTrigger className="h-9 w-full bg-white text-xs">
                  <div className="flex items-center gap-1.5 truncate text-left flex-1 min-w-0">
                    <span className="font-semibold text-muted-foreground">Action:</span>
                    <span className="font-bold text-foreground truncate">
                      {action ? actionLabel(action) : 'All actions'}
                    </span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All actions</SelectItem>
                  {AUDIT_ACTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {actionLabel(option)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Actor Select */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <UserCheck className="size-3 text-primary" />
                <span>Actor / Initiator</span>
              </label>
              <Select
                value={actorUid || 'all'}
                onValueChange={(value) =>
                  updateFilter('actor', value === 'all' ? '' : (value ?? ''))
                }
              >
                <SelectTrigger className="h-9 w-full bg-white text-xs">
                  <div className="flex items-center gap-1.5 truncate text-left flex-1 min-w-0">
                    <span className="font-semibold text-muted-foreground">Actor:</span>
                    <span className="font-bold text-foreground truncate">
                      {actorUid ? userLabel(actorUid) : 'All actors'}
                    </span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All actors</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.displayName || user.email || user.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Target Select */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Target className="size-3 text-primary" />
                <span>Target Subject</span>
              </label>
              <Select
                value={targetUid || 'all'}
                onValueChange={(value) =>
                  updateFilter('target', value === 'all' ? '' : (value ?? ''))
                }
              >
                <SelectTrigger className="h-9 w-full bg-white text-xs">
                  <div className="flex items-center gap-1.5 truncate text-left flex-1 min-w-0">
                    <span className="font-semibold text-muted-foreground">Target:</span>
                    <span className="font-bold text-foreground truncate">
                      {targetUid ? userLabel(targetUid) : 'All targets'}
                    </span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All targets</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.displayName || user.email || user.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active Filter Indicators */}
          {hasFilters && (
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2 text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-slate-400 text-[11px]">Active filters:</span>
                {action && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                    Action: <b>{actionLabel(action)}</b>
                    <button
                      type="button"
                      onClick={() => updateFilter('action', '')}
                      className="text-slate-400 hover:text-slate-700"
                      aria-label="Remove action filter"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                )}
                {actorUid && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                    Actor: <b>{userLabel(actorUid)}</b>
                    <button
                      type="button"
                      onClick={() => updateFilter('actor', '')}
                      className="text-slate-400 hover:text-slate-700"
                      aria-label="Remove actor filter"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                )}
                {targetUid && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                    Target: <b>{userLabel(targetUid)}</b>
                    <button
                      type="button"
                      onClick={() => updateFilter('target', '')}
                      className="text-slate-400 hover:text-slate-700"
                      aria-label="Remove target filter"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={clearFilters}
                className="text-[11px] font-medium text-primary hover:underline"
              >
                Reset all
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm text-slate-950">
            <ScrollText className="size-4 text-indigo-500" />
            Audit entries
          </CardTitle>
          <CardDescription>
            Page {page} · {hasNext ? 'More available' : 'End of results'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingState label="Loading audit entries…" rows={5} />
          ) : error ? (
            <EmptyState
              title="Unable to load audit entries"
              description={error}
              action={
                <Button size="sm" onClick={() => void refresh()}>
                  Try again
                </Button>
              }
            />
          ) : items.length === 0 ? (
            <EmptyState
              title="No audit entries found"
              description={
                hasFilters
                  ? 'Try clearing or changing the filters.'
                  : 'No audited admin actions yet. Manage users to assign a role, disable an account, or provision access.'
              }
              action={
                !hasFilters ? (
                  <Button size="sm" render={<Link to="/admin/users" />}>
                    Manage users
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="flex flex-col gap-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Actor</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead className="hidden lg:table-cell">Reason</TableHead>
                      <TableHead className="w-10">
                        <span className="sr-only">Open</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow
                        key={item.id}
                        role="link"
                        tabIndex={0}
                        aria-label={`Open audit entry ${item.action}`}
                        className="cursor-pointer transition-colors hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none"
                        onClick={() => openAudit(item.id)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            openAudit(item.id)
                          }
                        }}
                      >
                        <TableCell className="whitespace-nowrap text-xs text-slate-500">
                          {formatDateTime(item.createdAt)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{actionLabel(item.action)}</Badge>
                        </TableCell>
                        <TableCell className="max-w-44 truncate text-xs text-slate-600">
                          {actorLabel(item)}
                        </TableCell>
                        <TableCell className="max-w-44 truncate text-xs text-slate-600">
                          {item.targetEmail || userLabel(item.targetUid)}
                        </TableCell>
                        <TableCell className="hidden max-w-xl truncate text-xs text-slate-500 lg:table-cell">
                          {item.reason || '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          <ChevronRight className="ml-auto size-4 text-slate-400" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

                            <SlidingPaginationBar
                page={page}
                totalPages={Math.max(1, Math.ceil(total / PAGE_SIZE))}
                loading={loading}
                hasPrev={cursorStack.length > 0}
                hasNext={hasNext}
                onPrev={goPrevPage}
                onNext={goNextPage}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
