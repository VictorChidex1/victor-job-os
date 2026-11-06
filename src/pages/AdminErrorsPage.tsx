import { useMemo } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router'
import { AlertTriangle, ChevronRight } from 'lucide-react'
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
  SelectValue,
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
import { CursorPaginationBar } from '@/components/CursorPaginationBar'
import { EmptyState } from '@/components/states/EmptyState'
import { LoadingState } from '@/components/states/LoadingState'
import { useAdminErrorLogsPage } from '@/hooks/useAdminErrorLogsPage'
import { useAdminErrorSummary } from '@/hooks/useAdminErrorSummary'
import { useAdminUsers } from '@/hooks/useAdminUsers'
import { usePageMeta } from '@/hooks/usePageMeta'
import {
  appendCursor,
  currentPage,
  decodeCursorStack,
  encodeCursorStack,
  popCursor,
} from '@/lib/cursorPagination'
import { ERROR_FUNCTIONS } from '@/services/adminErrors'

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

export function AdminErrorsPage() {
  usePageMeta({
    title: 'Errors — Admin — Victor Job OS',
    description: 'Cross-user error monitoring for the Job OS administrator.',
    noindex: true,
    path: '/admin/system/errors',
  })

  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const fn = searchParams.get('fn') ?? ''
  const userId = searchParams.get('user') ?? ''
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
  const { summary, loading: summaryLoading, refresh: refreshSummary } =
    useAdminErrorSummary()
  const { items, hasNext, nextCursor, loading, error, refresh } =
    useAdminErrorLogsPage({
      fn,
      userId,
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

  function openError(id: string) {
    navigate(`/admin/system/errors/${id}`, {
      state: { from: `${location.pathname}${location.search}` },
    })
  }

  const hasFilters = Boolean(fn || userId)
  const userLabel = (id?: string) => {
    if (!id) return 'System'
    const user = userMap.get(id)
    return user?.displayName || user?.email || id.slice(0, 12)
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">Errors</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Read-only server and client error telemetry. Messages and stack traces are
            visible only to administrators.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            void refreshSummary()
            void refresh()
          }}
        >
          Refresh
        </Button>
      </div>

      <AdminSystemTabs />

      {summaryLoading && !summary ? (
        <LoadingState label="Loading error summary…" rows={2} />
      ) : summary ? (
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <SummaryCard label="Total errors" value={summary.total.toLocaleString()} />
          <SummaryCard label="Last 24h" value={summary.last24h.toLocaleString()} />
          <SummaryCard label="Last 7d" value={summary.last7d.toLocaleString()} />
          <SummaryCard
            label="Latest error"
            value={formatDateTime(summary.lastErrorAt)}
          />
        </div>
      ) : null}

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm text-slate-950">Filters</CardTitle>
          <CardDescription>
            Page {page} · {hasNext ? 'More available' : 'End of results'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="grid gap-2 lg:grid-cols-[16rem_13rem]">
            <Select
              value={fn || 'all'}
              onValueChange={(value) =>
                updateFilter('fn', value === 'all' ? '' : (value ?? ''))
              }
            >
              <SelectTrigger className="h-9 bg-white">
                <SelectValue placeholder="Function" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All functions</SelectItem>
                {ERROR_FUNCTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={userId || 'all'}
              onValueChange={(value) =>
                updateFilter('user', value === 'all' ? '' : (value ?? ''))
              }
            >
              <SelectTrigger className="h-9 bg-white">
                <SelectValue placeholder="User" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All users</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.displayName || user.email || user.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="w-fit text-slate-500"
              onClick={clearFilters}
            >
              Clear filters
            </Button>
          )}
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm text-slate-950">
            <AlertTriangle className="size-4 text-amber-500" />
            Error log
          </CardTitle>
          <CardDescription>
            Page {page} · {hasNext ? 'More available' : 'End of results'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingState label="Loading error logs…" rows={5} />
          ) : error ? (
            <EmptyState
              title="Unable to load error logs"
              description={error}
              action={
                <Button size="sm" onClick={() => void refresh()}>
                  Try again
                </Button>
              }
            />
          ) : items.length === 0 ? (
            <EmptyState
              title="No errors found"
              description={
                hasFilters
                  ? 'Try clearing or changing the filters.'
                  : 'Errors will appear here when workflows or clients report failures.'
              }
            />
          ) : (
            <div className="flex flex-col gap-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Function</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Message</TableHead>
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
                        aria-label={`Open error from ${item.fn}`}
                        className="cursor-pointer transition-colors hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none"
                        onClick={() => openError(item.id)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            openError(item.id)
                          }
                        }}
                      >
                        <TableCell className="whitespace-nowrap text-xs text-slate-500">
                          {formatDateTime(item.createdAt)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.fn}</Badge>
                        </TableCell>
                        <TableCell className="max-w-40 truncate text-xs text-slate-600">
                          {userLabel(item.userId)}
                        </TableCell>
                        <TableCell className="max-w-xl whitespace-normal text-sm text-slate-700">
                          <span className="line-clamp-2 break-words">{item.message || 'No message'}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <ChevronRight className="ml-auto size-4 text-slate-400" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <CursorPaginationBar
                page={page}
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

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardContent className="flex flex-col gap-2 pt-5">
        <span className="text-[0.65rem] font-bold uppercase tracking-widest text-slate-500">
          {label}
        </span>
        <span className="truncate font-mono text-xl font-black tracking-tighter text-slate-950">
          {value}
        </span>
      </CardContent>
    </Card>
  )
}
