import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import {
  Building2,
  CalendarClock,
  ChevronRight,
  Clock,
  Filter,
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
import { AdminApplicationDrawer } from '@/components/admin/AdminApplicationDrawer'
import { AdminApplicationFlowBar } from '@/components/admin/AdminApplicationFlowBar'
import { AdminApplicationMetricsStrip } from '@/components/admin/AdminApplicationMetricsStrip'
import { useAdminApplicationsPage } from '@/hooks/useAdminApplicationsPage'
import { useAdminApplicationMetrics } from '@/hooks/useAdminApplicationMetrics'
import { useAdminUsers } from '@/hooks/useAdminUsers'
import { usePageMeta } from '@/hooks/usePageMeta'
import {
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUS_ORDER,
} from '@/lib/applications'
import { STAGE_THEMES } from '@/lib/applicationPipeline'
import {
  appendCursor,
  currentPage,
  decodeCursorStack,
  encodeCursorStack,
  popCursor,
} from '@/lib/cursorPagination'
import type { ApplicationStatus } from '@/types/applications'

const PAGE_SIZE = 25

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

export function AdminApplicationsPage() {
  usePageMeta({
    title: 'Applications — Admin — Victor Job OS',
    description: 'Cross-user application browser for the Job OS administrator.',
    noindex: true,
    path: '/admin/applications',
  })

  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') ?? ''
  const status = searchParams.get('status') ?? ''
  const userId = searchParams.get('user') ?? ''
  const cursorParam = searchParams.get('cursors') ?? ''
  const cursorStack = useMemo(
    () => decodeCursorStack(cursorParam),
    [cursorParam],
  )
  const page = currentPage(cursorStack)
  const activeCursor = cursorStack[cursorStack.length - 1] ?? null
  const [searchInput, setSearchInput] = useState(query)
  const [inspectAppId, setInspectAppId] = useState<string | null>(null)

  const { users } = useAdminUsers()
  const userMap = useMemo(
    () => new Map(users.map((user) => [user.id, user])),
    [users],
  )

  const { metrics, loading: metricsLoading, refresh: refreshMetrics } =
    useAdminApplicationMetrics()

  const { items, hasNext, nextCursor, loading, error, refresh: refreshPage } =
    useAdminApplicationsPage({
      search: query,
      status,
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

  const hasFilters = Boolean(query || status || userId)
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
              Applications Command Center
            </h1>
            <span className="rounded-full border border-indigo-500/25 bg-indigo-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-indigo-700 dark:text-indigo-300">
              Cross-User Pipeline
            </span>
          </div>
          <p className="mt-1 max-w-2xl text-xs sm:text-sm text-slate-500">
            Read-only cross-user application browser. Inspect active candidate stages,
            review gates, and submission materials.
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
      <AdminApplicationMetricsStrip
        metrics={metrics}
        loading={metricsLoading}
        selectedStatus={status}
        onSelectStatus={(nextStatus) => updateFilter('status', nextStatus)}
      />

      {/* 9-Stage Flow Navigator Bar */}
      <AdminApplicationFlowBar
        activeStatus={status}
        onSelectStatus={(nextStatus) => updateFilter('status', nextStatus)}
      />

      {/* Filter & Search Card */}
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
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.4fr)_14rem_14rem]">
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
                  placeholder="Search role, company, or location…"
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
                <span>Pipeline Stage</span>
              </label>
              <Select
                value={status || 'all'}
                onValueChange={(value) =>
                  updateFilter('status', value === 'all' ? '' : (value ?? ''))
                }
              >
                <SelectTrigger className="h-9 w-full bg-white text-xs">
                  <div className="flex items-center gap-1.5 truncate text-left flex-1 min-w-0">
                    <span className="font-semibold text-muted-foreground">Stage:</span>
                    <span className="font-bold text-foreground truncate">
                      {status ? (APPLICATION_STATUS_LABELS[status as ApplicationStatus] ?? status) : 'All stages'}
                    </span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All stages</SelectItem>
                  {APPLICATION_STATUS_ORDER.map((option) => (
                    <SelectItem key={option} value={option}>
                      {APPLICATION_STATUS_LABELS[option]}
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
                onValueChange={(value) =>
                  updateFilter('user', value === 'all' ? '' : (value ?? ''))
                }
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
                    Status:{' '}
                    <b>
                      {APPLICATION_STATUS_LABELS[status as ApplicationStatus] ?? status}
                    </b>
                    <button
                      type="button"
                      onClick={() => updateFilter('status', '')}
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

      {/* Applications Data Grid */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-sm font-bold text-slate-950">
              Applications Stream
            </CardTitle>
            <CardDescription className="text-xs">
              Click any application row to inspect candidate notes, materials, and timeline.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingState label="Loading applications…" rows={5} />
          ) : error ? (
            <EmptyState
              title="Unable to load applications"
              description={error}
              action={
                <Button size="sm" onClick={() => void refreshPage()}>
                  Try again
                </Button>
              }
            />
          ) : items.length === 0 ? (
            <EmptyState
              title="No applications found"
              description={
                hasFilters
                  ? 'Try clearing or changing the active filters.'
                  : 'Applications from all workspace users will appear here.'
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
                      <TableHead>Stage</TableHead>
                      <TableHead className="hidden lg:table-cell">Next Action</TableHead>
                      <TableHead className="hidden sm:table-cell">Updated</TableHead>
                      <TableHead className="w-16 text-right">
                        <span className="sr-only">Inspect</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((application) => {
                      const theme =
                        STAGE_THEMES[application.status] ??
                        STAGE_THEMES['not-started']

                      return (
                        <TableRow
                          key={application.id}
                          role="button"
                          tabIndex={0}
                          aria-label={`Inspect ${application.jobTitle} at ${application.companyName}`}
                          className="group cursor-pointer transition-colors hover:bg-slate-50/90 focus-visible:bg-slate-50 focus-visible:outline-none"
                          onClick={() => setInspectAppId(application.id)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault()
                              setInspectAppId(application.id)
                            }
                          }}
                        >
                          {/* Role & Company with Monogram Avatar */}
                          <TableCell className="whitespace-normal py-3">
                            <div className="flex items-center gap-3">
                              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-indigo-500/25 bg-indigo-500/10 font-mono text-xs font-bold text-indigo-700 dark:text-indigo-300 shadow-2xs group-hover:scale-105 transition-transform">
                                {getMonogram(application.companyName)}
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="font-semibold text-slate-950 group-hover:text-indigo-600 transition-colors line-clamp-1">
                                  {application.jobTitle}
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                                  <Building2 className="size-3 text-slate-400 shrink-0" />
                                  <span className="truncate">{application.companyName}</span>
                                </div>
                              </div>
                            </div>
                          </TableCell>

                          {/* User Cell */}
                          <TableCell className="max-w-40 truncate">
                            <div className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50/80 px-2 py-0.5 text-xs text-slate-700">
                              <span className="flex size-4 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-700">
                                {(userLabel(application.userId) || 'U')[0]?.toUpperCase()}
                              </span>
                              <span className="truncate">{userLabel(application.userId)}</span>
                            </div>
                          </TableCell>

                          {/* Stage Status Badge */}
                          <TableCell>
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-semibold ${theme.badgeBg} ${theme.badgeText} shadow-2xs`}
                            >
                              <span
                                className={`size-1.5 rounded-full ${theme.dotColor} ${
                                  application.status === 'needs-review' ? 'animate-pulse' : ''
                                }`}
                              />
                              <span>
                                {APPLICATION_STATUS_LABELS[application.status as ApplicationStatus] ??
                                  application.status}
                              </span>
                            </span>
                          </TableCell>

                          {/* Next Action Cell */}
                          <TableCell className="hidden max-w-48 truncate text-xs text-slate-600 lg:table-cell">
                            {application.nextAction ? (
                              <div className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-0.5 shadow-2xs">
                                <Clock className="size-3 text-indigo-500 shrink-0" />
                                <span className="truncate font-medium">{application.nextAction}</span>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[11px]">No action due</span>
                            )}
                          </TableCell>

                          {/* Updated Date */}
                          <TableCell className="hidden text-xs text-slate-500 sm:table-cell">
                            <div className="flex items-center gap-1">
                              <CalendarClock className="size-3 text-slate-400" />
                              <span>{formatDate(application.updatedAt)}</span>
                            </div>
                          </TableCell>

                          {/* Inspect Action */}
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <span className="hidden group-hover:inline-flex text-[11px] font-medium text-indigo-600 items-center gap-0.5 transition-all">
                                Inspect <ChevronRight className="size-3" />
                              </span>
                              <ChevronRight className="size-4 text-slate-400 group-hover:hidden" />
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
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
      <AdminApplicationDrawer
        applicationId={inspectAppId}
        open={Boolean(inspectAppId)}
        onClose={() => setInspectAppId(null)}
      />
    </div>
  )
}
