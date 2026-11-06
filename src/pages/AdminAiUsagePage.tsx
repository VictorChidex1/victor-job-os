import { useMemo } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router'
import { BrainCircuit, ChevronRight } from 'lucide-react'
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
import { useAdminAiRunsPage } from '@/hooks/useAdminAiRunsPage'
import { useAdminAiSummary } from '@/hooks/useAdminAiSummary'
import { useAdminUsers } from '@/hooks/useAdminUsers'
import { usePageMeta } from '@/hooks/usePageMeta'
import {
  appendCursor,
  currentPage,
  decodeCursorStack,
  encodeCursorStack,
  popCursor,
} from '@/lib/cursorPagination'
import { AI_OPERATIONS, AI_STATUSES } from '@/services/adminAiUsage'

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

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms} ms`
  return `${(ms / 1000).toFixed(1)} s`
}

function formatCost(value: number): string {
  return `$${value.toFixed(4)}`
}

export function AdminAiUsagePage() {
  usePageMeta({
    title: 'AI usage — Admin — Victor Job OS',
    description: 'Cross-user AI usage and cost telemetry for the Job OS administrator.',
    noindex: true,
    path: '/admin/system/ai-usage',
  })

  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const status = searchParams.get('status') ?? ''
  const operation = searchParams.get('operation') ?? ''
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
    useAdminAiSummary()
  const { items, hasNext, nextCursor, loading, error, refresh } =
    useAdminAiRunsPage({
      status,
      operation,
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

  function openRun(id: string) {
    navigate(`/admin/system/ai-usage/${id}`, {
      state: { from: `${location.pathname}${location.search}` },
    })
  }

  const hasFilters = Boolean(status || operation || userId)
  const userLabel = (id: string) => {
    const user = userMap.get(id)
    return user?.displayName || user?.email || id.slice(0, 12)
  }
  const successRate =
    summary && summary.totalRuns > 0
      ? Math.round((summary.successRuns / summary.totalRuns) * 100)
      : 0

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">
            AI usage
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Read-only AI call telemetry. Costs are estimates, not billing truth.
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
        <LoadingState label="Loading AI summary…" rows={2} />
      ) : summary ? (
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <SummaryCard label="Total runs" value={summary.totalRuns.toLocaleString()} />
          <SummaryCard
            label="Success rate"
            value={`${successRate}%`}
            hint={`${summary.successRuns.toLocaleString()} success · ${summary.errorRuns.toLocaleString()} errors`}
          />
          <SummaryCard label="Runs · 7d" value={summary.runs7d.toLocaleString()} />
          <SummaryCard
            label="Avg duration · 7d"
            value={formatDuration(summary.averageDurationMs7d)}
          />
          <SummaryCard
            label="Est. cost · 7d"
            value={formatCost(summary.estimatedCost7d)}
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
          <div className="grid gap-2 lg:grid-cols-[12rem_15rem_13rem]">
            <Select
              value={status || 'all'}
              onValueChange={(value) =>
                updateFilter('status', value === 'all' ? '' : (value ?? ''))
              }
            >
              <SelectTrigger className="h-9 bg-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {AI_STATUSES.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={operation || 'all'}
              onValueChange={(value) =>
                updateFilter('operation', value === 'all' ? '' : (value ?? ''))
              }
            >
              <SelectTrigger className="h-9 bg-white">
                <SelectValue placeholder="Operation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All operations</SelectItem>
                {AI_OPERATIONS.map((option) => (
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
            <BrainCircuit className="size-4 text-indigo-500" />
            AI runs
          </CardTitle>
          <CardDescription>
            Page {page} · {hasNext ? 'More available' : 'End of results'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingState label="Loading AI runs…" rows={5} />
          ) : error ? (
            <EmptyState
              title="Unable to load AI runs"
              description={error}
              action={
                <Button size="sm" onClick={() => void refresh()}>
                  Try again
                </Button>
              }
            />
          ) : items.length === 0 ? (
            <EmptyState
              title="No AI runs found"
              description={
                hasFilters
                  ? 'Try clearing or changing the filters.'
                  : 'AI calls will appear here after users run qualification, outreach, or preparation actions.'
              }
            />
          ) : (
            <div className="flex flex-col gap-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Operation</TableHead>
                      <TableHead className="hidden lg:table-cell">Provider / model</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden sm:table-cell">Duration</TableHead>
                      <TableHead className="hidden sm:table-cell">Est. cost</TableHead>
                      <TableHead className="w-10">
                        <span className="sr-only">Open</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((run) => (
                      <TableRow
                        key={run.id}
                        role="link"
                        tabIndex={0}
                        aria-label={`Open ${run.operation} AI run`}
                        className="cursor-pointer transition-colors hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none"
                        onClick={() => openRun(run.id)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            openRun(run.id)
                          }
                        }}
                      >
                        <TableCell className="whitespace-nowrap text-xs text-slate-500">
                          {formatDateTime(run.createdAt)}
                        </TableCell>
                        <TableCell className="max-w-40 truncate text-xs text-slate-600">
                          {userLabel(run.userId)}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-slate-700">
                          {run.operation}
                        </TableCell>
                        <TableCell className="hidden text-xs text-slate-500 lg:table-cell">
                          {run.provider} / {run.model}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={run.status === 'success' ? 'secondary' : 'outline'}
                          >
                            {run.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden font-mono text-xs text-slate-500 sm:table-cell">
                          {formatDuration(run.durationMs)}
                        </TableCell>
                        <TableCell className="hidden font-mono text-xs text-slate-500 sm:table-cell">
                          {formatCost(run.estimatedCostUsd)}
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

function SummaryCard({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint?: string
}) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardContent className="flex flex-col gap-2 pt-5">
        <span className="text-[0.65rem] font-bold uppercase tracking-widest text-slate-500">
          {label}
        </span>
        <span className="font-mono text-2xl font-black tracking-tighter text-slate-950">
          {value}
        </span>
        {hint && <span className="text-xs text-slate-500">{hint}</span>}
      </CardContent>
    </Card>
  )
}
