import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import {
  CalendarClock,
  ExternalLink,
  Filter,
  RefreshCw,
  Search,
  User,
  X,
} from 'lucide-react'
import { SlidingPaginationBar } from '@/components/SlidingPaginationBar'
import { AdminInterviewDrawer } from '@/components/admin/AdminInterviewDrawer'
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
import { useAdminInterviewMetrics } from '@/hooks/useAdminInterviewMetrics'
import { useAdminInterviewsPage } from '@/hooks/useAdminInterviewsPage'
import { useAdminUsers } from '@/hooks/useAdminUsers'
import { usePageMeta } from '@/hooks/usePageMeta'
import {
  INTERVIEW_STATUS_LABELS,
  INTERVIEW_STATUS_OPTIONS,
  INTERVIEW_TYPE_LABELS,
  INTERVIEW_TYPE_OPTIONS,
  formatDuration,
  formatInterviewDate,
} from '@/lib/interviews'
import {
  appendCursor,
  currentPage,
  decodeCursorStack,
  encodeCursorStack,
  popCursor,
} from '@/lib/cursorPagination'
const PAGE_SIZE = 25

export function AdminInterviewsPage() {
  usePageMeta({
    title: 'Interviews — Admin — Victor Job OS',
    description: 'Read-only cross-user interview monitoring.',
    noindex: true,
    path: '/admin/interviews',
  })

  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') ?? ''
  const status = searchParams.get('status') ?? ''
  const type = searchParams.get('type') ?? ''
  const userId = searchParams.get('user') ?? ''
  const applicationId = searchParams.get('application') ?? ''
  const fromParam = searchParams.get('from') ?? ''
  const toParam = searchParams.get('to') ?? ''
  const cursorParam = searchParams.get('cursors') ?? ''
  const cursorStack = useMemo(
    () => decodeCursorStack(cursorParam),
    [cursorParam],
  )
  const page = currentPage(cursorStack)
  const activeCursor = cursorStack[cursorStack.length - 1] ?? null
  const [searchInput, setSearchInput] = useState(query)
  const [selected, setSelected] = useState<string | null>(null)

  const from = useMemo(
    () => (fromParam ? new Date(`${fromParam}T00:00:00`) : undefined),
    [fromParam],
  )
  const to = useMemo(
    () => (toParam ? new Date(`${toParam}T23:59:59.999`) : undefined),
    [toParam],
  )

  const { users } = useAdminUsers()
  const userMap = useMemo(
    () => new Map(users.map((user) => [user.id, user])),
    [users],
  )
  const { metrics, loading: metricsLoading, refresh: refreshMetrics } =
    useAdminInterviewMetrics()
  const { items, total, hasNext, nextCursor, loading, error, refresh } =
    useAdminInterviewsPage({
      search: query,
      status,
      type,
      userId,
      applicationId,
      from,
      to,
      cursor: activeCursor,
      pageSize: PAGE_SIZE,
    })

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput === query) return
      const next = new URLSearchParams(searchParams)
      if (searchInput.trim()) next.set('q', searchInput)
      else next.delete('q')
      next.delete('cursors')
      setSearchParams(next, { replace: true })
    }, 350)
    return () => clearTimeout(timer)
  }, [searchInput, query, searchParams, setSearchParams])

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
    setSearchInput('')
    setSearchParams(new URLSearchParams(), { replace: true })
  }

  function refreshAll() {
    void Promise.all([refresh(), refreshMetrics()])
  }

  const selectedInterview = items.find((interview) => interview.id === selected) ?? null
  const hasFilters = Boolean(
    query || status || type || userId || applicationId || fromParam || toParam,
  )
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const userName = (id: string) => {
    const user = userMap.get(id)
    return user?.displayName || user?.email || id.slice(0, 12)
  }
  const metricCards = [
    { label: 'Total', value: metrics.total },
    { label: 'Upcoming', value: metrics.upcoming },
    { label: 'Completed', value: metrics.completed },
    { label: 'Cancelled', value: metrics.cancelled },
    { label: 'No-show', value: metrics.noShow },
  ]

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-950">
              Interviews Command Center
            </h1>
            <span className="rounded-full border border-indigo-500/25 bg-indigo-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-indigo-700">
              Cross-User Monitoring
            </span>
          </div>
          <p className="mt-1 max-w-2xl text-xs text-slate-500 sm:text-sm">
            Read-only interview monitoring across all users and applications.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refreshAll} className="gap-1.5">
          <RefreshCw className="size-3.5" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {metricCards.map((metric) => (
          <Card key={metric.label} className="border-slate-200 shadow-sm">
            <CardContent className="p-4">
              <div className="text-[0.65rem] font-bold uppercase tracking-widest text-slate-400">
                {metric.label}
              </div>
              <div className="mt-2 font-mono text-2xl font-black text-slate-950">
                {metricsLoading ? '—' : metric.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-sm font-bold text-slate-950">
              Filter interviews
            </CardTitle>
            <CardDescription className="text-xs">
              Page {page} · {hasNext ? 'More available' : 'End of results'}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col gap-1.5">
              <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <Search className="size-3 text-primary" />
                Keyword
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Company, role, interviewer…"
                  className="h-9 bg-white pl-9 pr-8 text-xs"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => setSearchInput('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700"
                    aria-label="Clear search"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
            </div>

            <label className="flex flex-col gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Filter className="size-3 text-primary" />
                Status
              </span>
              <select
                value={status}
                onChange={(event) => updateFilter('status', event.target.value)}
                className="h-9 rounded-md border border-input bg-white px-3 text-xs font-normal text-foreground"
              >
                <option value="">All statuses</option>
                {INTERVIEW_STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {INTERVIEW_STATUS_LABELS[option]}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CalendarClock className="size-3 text-primary" />
                Type
              </span>
              <select
                value={type}
                onChange={(event) => updateFilter('type', event.target.value)}
                className="h-9 rounded-md border border-input bg-white px-3 text-xs font-normal text-foreground"
              >
                <option value="">All types</option>
                {INTERVIEW_TYPE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {INTERVIEW_TYPE_LABELS[option]}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <User className="size-3 text-primary" />
                User
              </span>
              <select
                value={userId}
                onChange={(event) => updateFilter('user', event.target.value)}
                className="h-9 rounded-md border border-input bg-white px-3 text-xs font-normal text-foreground"
              >
                <option value="">All users</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.displayName || user.email || user.id}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              From date
              <Input
                type="date"
                value={fromParam}
                onChange={(event) => updateFilter('from', event.target.value)}
                className="h-9 bg-white text-xs"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              To date
              <Input
                type="date"
                value={toParam}
                onChange={(event) => updateFilter('to', event.target.value)}
                className="h-9 bg-white text-xs"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Application ID
              <Input
                value={applicationId}
                onChange={(event) => updateFilter('application', event.target.value)}
                placeholder="Application document ID"
                className="h-9 bg-white text-xs"
              />
            </label>

            <div className="flex items-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                disabled={!hasFilters}
                className="h-9 text-xs"
              >
                <X className="size-3.5" />
                Clear filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4">
              <LoadingState label="Loading interviews…" rows={5} />
            </div>
          ) : error ? (
            <div className="p-4">
              <EmptyState
                title="Unable to load interviews"
                description={error}
                action={
                  <Button size="sm" onClick={() => void refresh()}>
                    Try again
                  </Button>
                }
              />
            </div>
          ) : items.length === 0 ? (
            <div className="p-4">
              <EmptyState
                title="No interviews found"
                description={
                  hasFilters
                    ? 'Try removing a filter or searching for another term.'
                    : 'Interviews scheduled by users will appear here.'
                }
              />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Scheduled</TableHead>
                    <TableHead>Company / role</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Interviewers</TableHead>
                    <TableHead className="text-right">Application</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((interview) => (
                    <TableRow
                      key={interview.id}
                      className="cursor-pointer"
                      onClick={() => setSelected(interview.id)}
                    >
                      <TableCell className="whitespace-nowrap text-xs">
                        {formatInterviewDate(interview.scheduledAt, interview.timezone)}
                        <div className="text-[11px] text-slate-400">
                          {formatDuration(interview.durationMinutes)}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[16rem]">
                        <div className="truncate text-sm font-medium text-slate-900">
                          {interview.companyName || 'Unknown company'}
                        </div>
                        <div className="truncate text-xs text-slate-500">
                          {interview.jobTitle || 'Interview'}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        {userName(interview.userId)}
                      </TableCell>
                      <TableCell className="text-xs">
                        {INTERVIEW_TYPE_LABELS[interview.type]}
                        {interview.round && (
                          <div className="text-[11px] text-slate-400">
                            {interview.round}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {INTERVIEW_STATUS_LABELS[interview.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[12rem] truncate text-xs text-slate-600">
                        {interview.interviewers.join(', ') || '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1 px-2 text-xs"
                          onClick={(event) => {
                            event.stopPropagation()
                          }}
                          render={
                            <Link
                              to={`/admin/applications/${encodeURIComponent(interview.applicationId)}`}
                            />
                          }
                        >
                          Open
                          <ExternalLink className="size-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="border-t p-3">
                <SlidingPaginationBar
                  page={page}
                  totalPages={totalPages}
                  loading={loading}
                  hasPrev={cursorStack.length > 0}
                  hasNext={hasNext}
                  onPrev={goPrevPage}
                  onNext={goNextPage}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <AdminInterviewDrawer
        interview={selectedInterview}
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null)
        }}
        userName={
          selectedInterview ? userName(selectedInterview.userId) : undefined
        }
      />
    </div>
  )
}
