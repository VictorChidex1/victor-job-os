import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import {
  Building2,
  CalendarClock,
  ChevronRight,
  Filter,
  Globe,
  MapPin,
  RefreshCw,
  Search,
  User,
  X,
} from 'lucide-react'
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
import { CursorPaginationBar } from '@/components/CursorPaginationBar'
import { EmptyState } from '@/components/states/EmptyState'
import { LoadingState } from '@/components/states/LoadingState'
import { AdminOpportunityDrawer } from '@/components/admin/AdminOpportunityDrawer'
import { AdminOpportunityFlowBar } from '@/components/admin/AdminOpportunityFlowBar'
import { AdminOpportunityMetricsStrip } from '@/components/admin/AdminOpportunityMetricsStrip'
import { useAdminOpportunitiesPage } from '@/hooks/useAdminOpportunitiesPage'
import { useAdminOpportunityMetrics } from '@/hooks/useAdminOpportunityMetrics'
import { useAdminUsers } from '@/hooks/useAdminUsers'
import { usePageMeta } from '@/hooks/usePageMeta'
import {
  appendCursor,
  currentPage,
  decodeCursorStack,
  encodeCursorStack,
  popCursor,
} from '@/lib/cursorPagination'
import { SELECTABLE_SOURCE_IDS, SOURCE_LABELS } from '@/lib/job-sources'

const PAGE_SIZE = 25
const STATUS_OPTIONS = ['new', 'qualified', 'rejected', 'archived']

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

function getMonogram(name?: string): string {
  return (name || 'JB')
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('')
}

export function AdminOpportunitiesPage() {
  usePageMeta({
    title: 'Opportunities — Admin — Victor Job OS',
    description: 'Cross-user opportunity browser for the Job OS administrator.',
    noindex: true,
    path: '/admin/opportunities',
  })

  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') ?? ''
  const status = searchParams.get('status') ?? ''
  const source = searchParams.get('source') ?? ''
  const userId = searchParams.get('user') ?? ''
  const cursorParam = searchParams.get('cursors') ?? ''
  const cursorStack = useMemo(
    () => decodeCursorStack(cursorParam),
    [cursorParam],
  )
  const page = currentPage(cursorStack)
  const activeCursor = cursorStack[cursorStack.length - 1] ?? null
  const [searchInput, setSearchInput] = useState(query)
  const [inspectJobId, setInspectJobId] = useState<string | null>(null)

  const { users } = useAdminUsers()
  const userMap = useMemo(
    () => new Map(users.map((user) => [user.id, user])),
    [users],
  )

  const { metrics, loading: metricsLoading, refresh: refreshMetrics } =
    useAdminOpportunityMetrics()

  const { items, hasNext, nextCursor, loading, error, refresh: refreshPage } =
    useAdminOpportunitiesPage({
      search: query,
      status,
      source,
      userId,
      cursor: activeCursor,
      pageSize: PAGE_SIZE,
    })

  const handleRefreshAll = () => {
    void Promise.all([refreshMetrics(), refreshPage()])
  }

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

  const hasFilters = Boolean(query || status || source || userId)
  const userLabel = (id: string) => {
    const user = userMap.get(id)
    return user?.displayName || user?.email || id.slice(0, 12)
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 p-4 sm:p-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-950">
              Opportunities Command Center
            </h1>
            <span className="rounded-full border border-indigo-500/25 bg-indigo-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-indigo-700 dark:text-indigo-300">
              Cross-User Sourcing
            </span>
          </div>
          <p className="mt-1 max-w-2xl text-xs sm:text-sm text-slate-500">
            Read-only cross-user opportunity browser. Inspect roles, source attribution,
            and AI qualification fit telemetry.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefreshAll}
          className="gap-1.5"
        >
          <RefreshCw className="size-3.5" />
          Refresh
        </Button>
      </div>

      {/* Top 4-KPI Telemetry Strip */}
      <AdminOpportunityMetricsStrip
        metrics={metrics}
        loading={metricsLoading}
        selectedStatus={status}
        onSelectStatus={(nextStatus) => updateFilter('status', nextStatus)}
      />

      {/* Quick Status Segment Flow Bar */}
      <AdminOpportunityFlowBar
        metrics={metrics}
        activeStatus={status}
        onSelectStatus={(nextStatus) => updateFilter('status', nextStatus)}
      />

      {/* Filter & Search Bar */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold text-slate-950">
              Filter Pipeline
            </CardTitle>
            <CardDescription className="text-xs">
              Page {page} · {hasNext ? 'More available' : 'End of results'}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.3fr)_12rem_12rem_13rem]">
            {/* Search Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Search className="size-3 text-primary" />
                <span>Keyword Search</span>
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Search role, company, skills, or user…"
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

            {/* Status Select */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Filter className="size-3 text-primary" />
                <span>Status Filter</span>
              </label>
              <Select
                value={status || 'all'}
                onValueChange={(value) => updateFilter('status', value === 'all' ? '' : (value ?? ''))}
              >
                <SelectTrigger className="h-9 w-full bg-white text-xs">
                  <div className="flex items-center gap-1.5 truncate text-left flex-1 min-w-0">
                    <span className="font-semibold text-muted-foreground">Status:</span>
                    <span className="font-bold text-foreground truncate capitalize">{status ? status : 'All statuses'}</span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option} className="capitalize">
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Source Select */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Globe className="size-3 text-primary" />
                <span>Source / ATS</span>
              </label>
              <Select
                value={source || 'all'}
                onValueChange={(value) => updateFilter('source', value === 'all' ? '' : (value ?? ''))}
              >
                <SelectTrigger className="h-9 w-full bg-white text-xs">
                  <div className="flex items-center gap-1.5 truncate text-left flex-1 min-w-0">
                    <span className="font-semibold text-muted-foreground">Source:</span>
                    <span className="font-bold text-foreground truncate">{source ? (SOURCE_LABELS[source] ?? source) : 'All sources'}</span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All sources</SelectItem>
                  {SELECTABLE_SOURCE_IDS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {SOURCE_LABELS[option] ?? option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* User Select */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <User className="size-3 text-primary" />
                <span>Candidate / User</span>
              </label>
              <Select
                value={userId || 'all'}
                onValueChange={(value) => updateFilter('user', value === 'all' ? '' : (value ?? ''))}
              >
                <SelectTrigger className="h-9 w-full bg-white text-xs">
                  <div className="flex items-center gap-1.5 truncate text-left flex-1 min-w-0">
                    <span className="font-semibold text-muted-foreground">Candidate:</span>
                    <span className="font-bold text-foreground truncate">
                      {userId ? (users.find((u) => u.id === userId)?.displayName || users.find((u) => u.id === userId)?.email || userId) : 'All users'}
                    </span>
                  </div>
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
          </div>

          {/* Active Filter Indicators */}
          {hasFilters && (
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2 text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-slate-400 text-[11px]">Active filters:</span>
                {status && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                    Status: <b className="capitalize">{status}</b>
                    <button
                      type="button"
                      onClick={() => updateFilter('status', '')}
                      className="text-slate-400 hover:text-slate-700"
                    >
                      ×
                    </button>
                  </span>
                )}
                {source && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                    Source: <b>{SOURCE_LABELS[source as keyof typeof SOURCE_LABELS] ?? source}</b>
                    <button
                      type="button"
                      onClick={() => updateFilter('source', '')}
                      className="text-slate-400 hover:text-slate-700"
                    >
                      ×
                    </button>
                  </span>
                )}
                {userId && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                    User: <b>{userLabel(userId)}</b>
                    <button
                      type="button"
                      onClick={() => updateFilter('user', '')}
                      className="text-slate-400 hover:text-slate-700"
                    >
                      ×
                    </button>
                  </span>
                )}
                {query && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                    Query: "{query}"
                    <button
                      type="button"
                      onClick={() => setSearchInput('')}
                      className="text-slate-400 hover:text-slate-700"
                    >
                      ×
                    </button>
                  </span>
                )}
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs text-slate-500 hover:text-slate-900"
                onClick={clearFilters}
              >
                Clear all filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Opportunities Data Grid */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-sm font-bold text-slate-950">
              Opportunities Stream
            </CardTitle>
            <CardDescription className="text-xs">
              Click any opportunity row to inspect fit analysis and raw source details.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingState label="Loading opportunities…" rows={6} />
          ) : error ? (
            <EmptyState
              title="Unable to load opportunities"
              description={error}
              action={
                <Button size="sm" onClick={() => void refreshPage()}>
                  Try again
                </Button>
              }
            />
          ) : items.length === 0 ? (
            <EmptyState
              title="No opportunities found"
              description={
                hasFilters
                  ? 'Try clearing or changing the active filters.'
                  : 'Opportunities from all workspace users will appear here.'
              }
              action={
                hasFilters ? (
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    Clear filters
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="flex flex-col gap-4">
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <Table>
                  <TableHeader className="bg-slate-50/80">
                    <TableRow>
                      <TableHead className="w-[38%]">Role & Company</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden lg:table-cell">Location</TableHead>
                      <TableHead className="hidden sm:table-cell">Discovered</TableHead>
                      <TableHead className="w-16 text-right">
                        <span className="sr-only">Inspect</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((job) => (
                      <TableRow
                        key={job.id}
                        role="button"
                        tabIndex={0}
                        aria-label={`Inspect ${job.title} at ${job.companyName}`}
                        className="group cursor-pointer transition-colors hover:bg-slate-50/90 focus-visible:bg-slate-50 focus-visible:outline-none"
                        onClick={() => setInspectJobId(job.id)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            setInspectJobId(job.id)
                          }
                        }}
                      >
                        {/* Role & Company with Monogram Avatar */}
                        <TableCell className="whitespace-normal py-3">
                          <div className="flex items-center gap-3">
                            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-indigo-500/25 bg-indigo-500/10 font-mono text-xs font-bold text-indigo-700 dark:text-indigo-300 shadow-2xs group-hover:scale-105 transition-transform">
                              {getMonogram(job.companyName)}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-slate-950 group-hover:text-indigo-600 transition-colors line-clamp-1">
                                {job.title}
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                                <Building2 className="size-3 text-slate-400 shrink-0" />
                                <span className="truncate">{job.companyName}</span>
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        {/* User Cell */}
                        <TableCell className="max-w-40 truncate">
                          <div className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50/80 px-2 py-0.5 text-xs text-slate-700">
                            <span className="flex size-4 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-700">
                              {(userLabel(job.userId) || 'U')[0]?.toUpperCase()}
                            </span>
                            <span className="truncate">{userLabel(job.userId)}</span>
                          </div>
                        </TableCell>

                        {/* Source Cell */}
                        <TableCell>
                          <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-0.5 font-mono text-[11px] text-slate-600 shadow-2xs">
                            <Globe className="size-3 text-slate-400" />
                            {SOURCE_LABELS[job.source as keyof typeof SOURCE_LABELS] ?? job.source}
                          </span>
                        </TableCell>

                        {/* Status Cell */}
                        <TableCell>
                          {job.status === 'qualified' ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 shadow-2xs">
                              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Qualified
                            </span>
                          ) : job.status === 'new' ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-sky-700 dark:text-sky-300 shadow-2xs">
                              <span className="size-1.5 rounded-full bg-sky-500" />
                              New
                            </span>
                          ) : job.status === 'rejected' ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-rose-700 dark:text-rose-300">
                              <span className="size-1.5 rounded-full bg-rose-500" />
                              Rejected
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-slate-100 px-2.5 py-0.5 font-mono text-[11px] font-medium text-slate-600">
                              <span className="size-1.5 rounded-full bg-slate-400" />
                              {job.status}
                            </span>
                          )}
                        </TableCell>

                        {/* Location Cell */}
                        <TableCell className="hidden max-w-40 truncate text-xs text-slate-600 lg:table-cell">
                          {job.remote ? (
                            <span className="inline-flex items-center gap-1 rounded-md border border-indigo-200 bg-indigo-50/80 px-2 py-0.5 text-[11px] font-medium text-indigo-700">
                              Remote
                            </span>
                          ) : job.location ? (
                            <span className="inline-flex items-center gap-1 text-slate-600">
                              <MapPin className="size-3 text-slate-400" />
                              <span className="truncate">{job.location}</span>
                            </span>
                          ) : (
                            <span className="text-slate-400">Unlisted</span>
                          )}
                        </TableCell>

                        {/* Discovered Cell */}
                        <TableCell className="hidden text-xs text-slate-500 sm:table-cell">
                          <div className="flex items-center gap-1">
                            <CalendarClock className="size-3 text-slate-400" />
                            <span>{formatDate(job.discoveredAt)}</span>
                          </div>
                        </TableCell>

                        {/* Inspect Cell */}
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <span className="hidden group-hover:inline-flex text-[11px] font-medium text-indigo-600 items-center gap-0.5 transition-all">
                              Inspect <ChevronRight className="size-3" />
                            </span>
                            <ChevronRight className="size-4 text-slate-400 group-hover:hidden" />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Cursor Pagination */}
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

      {/* Slide-Over Inspection Drawer */}
      <AdminOpportunityDrawer
        jobId={inspectJobId}
        open={Boolean(inspectJobId)}
        onClose={() => setInspectJobId(null)}
      />
    </div>
  )
}
