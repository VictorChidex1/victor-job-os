import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router'
import {
  ChevronRight,
  Code2,
  ExternalLink,
  FileText,
  Layers,
  RotateCw,
  Search,
  Star,
  Tag,
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
import { Input } from '@/components/ui/input'
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
import { CursorPaginationBar } from '@/components/CursorPaginationBar'
import { EmptyState } from '@/components/states/EmptyState'
import { LoadingState } from '@/components/states/LoadingState'
import { AdminResumeMetricsStrip } from '@/components/admin/AdminResumeMetricsStrip'
import { AdminResumeFlowBar } from '@/components/admin/AdminResumeFlowBar'
import { AdminResumeDrawer } from '@/components/admin/AdminResumeDrawer'
import { useAdminResumesPage } from '@/hooks/useAdminResumesPage'
import { useAdminResumeMetrics } from '@/hooks/useAdminResumeMetrics'
import { useAdminUsers } from '@/hooks/useAdminUsers'
import { usePageMeta } from '@/hooks/usePageMeta'
import {
  appendCursor,
  currentPage,
  decodeCursorStack,
  encodeCursorStack,
  popCursor,
} from '@/lib/cursorPagination'
import type { AdminResumeDefaultFilter } from '@/services/adminResumes'

const PAGE_SIZE = 24
const DEFAULT_OPTIONS: Array<{ value: AdminResumeDefaultFilter; label: string }> = [
  { value: 'all', label: 'All variants' },
  { value: 'default', label: 'Default baselines only' },
  { value: 'non-default', label: 'Tailored variants only' },
]

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

function defaultFilter(value: string): AdminResumeDefaultFilter {
  return value === 'default' || value === 'non-default' ? value : 'all'
}

export function AdminResumesPage() {
  usePageMeta({
    title: 'Resumes — Admin — Victor Job OS',
    description: 'Cross-user resume variants, tailoring, and document assets hub.',
    noindex: true,
    path: '/admin/resumes',
  })

  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') ?? ''
  const selectedDefault = defaultFilter(searchParams.get('default') ?? 'all')
  const userId = searchParams.get('user') ?? ''
  const cursorParam = searchParams.get('cursors') ?? ''
  const cursorStack = useMemo(
    () => decodeCursorStack(cursorParam),
    [cursorParam],
  )
  const page = currentPage(cursorStack)
  const activeCursor = cursorStack[cursorStack.length - 1] ?? null
  const [searchInput, setSearchInput] = useState(query)

  // View mode and slide-over state
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const { users } = useAdminUsers()
  const userMap = useMemo(
    () => new Map(users.map((user) => [user.id, user])),
    [users],
  )

  const { metrics, loading: metricsLoading, refresh: refreshMetrics } =
    useAdminResumeMetrics()

  const { items, hasNext, nextCursor, loading, error, refresh } =
    useAdminResumesPage({
      search: query,
      defaultFilter: selectedDefault,
      userId,
      cursor: activeCursor,
      pageSize: PAGE_SIZE,
    })

  const handleRefreshAll = async () => {
    setIsRefreshing(true)
    try {
      await Promise.all([refresh(), refreshMetrics()])
    } finally {
      setIsRefreshing(false)
    }
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
    if (value && !(key === 'default' && value === 'all')) next.set(key, value)
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

  function openResumeDrawer(id: string) {
    setSelectedResumeId(id)
    setDrawerOpen(true)
  }

  function navigateToResumeFull(id: string, e?: React.MouseEvent) {
    if (e) e.stopPropagation()
    navigate(`/admin/resumes/${id}`, {
      state: { from: `${location.pathname}${location.search}` },
    })
  }

  const hasFilters = Boolean(query || userId || selectedDefault !== 'all')
  const userLabel = (id: string) => {
    const user = userMap.get(id)
    return user?.displayName || user?.email || id.slice(0, 12)
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 sm:p-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">
            Resumes
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Cross-user career document portfolio, baseline templates, and customized variants.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void handleRefreshAll()}
          disabled={isRefreshing}
          className="rounded-xl gap-2 font-medium shadow-2xs hover:bg-muted"
        >
          <RotateCw className={`size-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Real-time Telemetry Cards */}
      <AdminResumeMetricsStrip
        metrics={metrics}
        loading={metricsLoading}
        selectedFilter={selectedDefault}
        onSelectFilter={(val) => updateFilter('default', val)}
      />

      {/* Segment Flow Bar + View Toggle */}
      <AdminResumeFlowBar
        metrics={metrics}
        selectedFilter={selectedDefault}
        onSelectFilter={(val) => updateFilter('default', val)}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Search & Filter Card */}
      <Card className="border-border/80 bg-card/60 shadow-xs backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Search & Filter Resume Assets
          </CardTitle>
          <CardDescription className="text-xs">
            Page {page} · {hasNext ? 'More available' : 'End of results'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="grid gap-2.5 lg:grid-cols-[minmax(0,1fr)_14rem_14rem]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search variant, target role, or technology…"
                className="h-10 bg-background/80 pl-9 pr-8 rounded-xl border-border/80 text-xs"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            <Select
              value={selectedDefault}
              onValueChange={(value) =>
                updateFilter('default', value ?? 'all')
              }
            >
              <SelectTrigger className="h-10 bg-background/80 rounded-xl border-border/80 text-xs">
                <SelectValue placeholder="Variant Type" />
              </SelectTrigger>
              <SelectContent>
                {DEFAULT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="text-xs">
                    {option.label}
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
              <SelectTrigger className="h-10 bg-background/80 rounded-xl border-border/80 text-xs">
                <SelectValue placeholder="Target User" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All users</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id} className="text-xs">
                    {user.displayName || user.email || user.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {hasFilters && (
            <div className="flex items-center justify-between pt-1">
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                <span>Active filters:</span>
                {query && (
                  <Badge variant="secondary" className="rounded-lg text-[11px] gap-1">
                    Query: {query}
                    <X className="size-2.5 cursor-pointer" onClick={() => updateFilter('q', '')} />
                  </Badge>
                )}
                {selectedDefault !== 'all' && (
                  <Badge variant="secondary" className="rounded-lg text-[11px] gap-1">
                    Type: {selectedDefault}
                    <X className="size-2.5 cursor-pointer" onClick={() => updateFilter('default', 'all')} />
                  </Badge>
                )}
                {userId && (
                  <Badge variant="secondary" className="rounded-lg text-[11px] gap-1">
                    User: {userLabel(userId)}
                    <X className="size-2.5 cursor-pointer" onClick={() => updateFilter('user', 'all')} />
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground hover:text-foreground"
                onClick={clearFilters}
              >
                Clear all
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Content Area */}
      <Card className="border-border/80 bg-card shadow-xs">
        <CardHeader className="pb-3 border-b border-border/70 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold text-foreground">
              {viewMode === 'grid' ? 'Resume Document Cards' : 'Resume Variants Table'}
            </CardTitle>
            <CardDescription className="text-xs">
              Page {page} · {hasNext ? 'More records available' : 'End of records'}
            </CardDescription>
          </div>
          <span className="text-[11px] font-mono text-muted-foreground">
            {items.length} records shown
          </span>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {loading ? (
            <LoadingState label="Loading resume assets…" rows={6} />
          ) : error ? (
            <EmptyState
              title="Unable to load resume variants"
              description={error}
              action={
                <Button size="sm" onClick={() => void handleRefreshAll()} className="rounded-xl">
                  Try again
                </Button>
              }
            />
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-dashed border-border/80 bg-muted/20">
              <div className="flex size-14 items-center justify-center rounded-2xl border border-border/80 bg-card shadow-2xs mb-4">
                <FileText className="size-7 text-muted-foreground/60" />
              </div>
              <h3 className="text-base font-bold text-foreground">
                No resume variants found
              </h3>
              <p className="mt-1.5 max-w-md text-xs text-muted-foreground leading-relaxed">
                {hasFilters
                  ? 'No resume documents match your active search filters. Try clearing filters or search terms.'
                  : 'Resume variants created by candidates across the application will be indexed and displayed here.'}
              </p>
              {hasFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="mt-4 rounded-xl text-xs"
                >
                  Reset all filters
                </Button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            /* Visual Card Grid View */
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((resume) => {
                  const isSelected = selectedResumeId === resume.id && drawerOpen
                  return (
                    <div
                      key={resume.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => openResumeDrawer(resume.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          openResumeDrawer(resume.id)
                        }
                      }}
                      className={`group relative flex flex-col justify-between rounded-2xl border p-5 text-left transition-all hover:shadow-md cursor-pointer ${
                        isSelected
                          ? 'border-primary ring-2 ring-primary/20 bg-card shadow-sm'
                          : 'border-border/80 bg-card hover:border-border'
                      }`}
                    >
                      {/* Card Header */}
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div
                            className={`flex size-10 shrink-0 items-center justify-center rounded-xl border shadow-2xs ${
                              resume.isDefault
                                ? 'border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                : 'border-purple-500/25 bg-purple-500/10 text-purple-600 dark:text-purple-400'
                            }`}
                          >
                            {resume.isDefault ? (
                              <Star className="size-5 fill-amber-500 text-amber-500" />
                            ) : (
                              <Layers className="size-5" />
                            )}
                          </div>
                          <span
                            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              resume.isDefault
                                ? 'border-amber-500/30 bg-amber-500/15 text-amber-800 dark:text-amber-300'
                                : 'border-purple-500/30 bg-purple-500/15 text-purple-800 dark:text-purple-300'
                            }`}
                          >
                            {resume.isDefault ? 'Default Baseline' : 'Tailored Variant'}
                          </span>
                        </div>

                        {/* Title & Candidate */}
                        <div className="mt-3">
                          <h3 className="text-base font-bold text-foreground leading-snug group-hover:text-primary transition-colors">
                            {resume.name}
                          </h3>
                          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[9px] font-bold text-primary">
                              {userLabel(resume.userId).slice(0, 1).toUpperCase()}
                            </span>
                            <span className="truncate">{userLabel(resume.userId)}</span>
                          </div>
                        </div>

                        {/* Target Roles */}
                        {resume.targetRoles && resume.targetRoles.length > 0 && (
                          <div className="mt-3.5 space-y-1">
                            <div className="flex items-center gap-1 text-[11px] font-semibold uppercase text-muted-foreground">
                              <Tag className="size-3" />
                              <span>Target Roles</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {resume.targetRoles.slice(0, 2).map((role, idx) => (
                                <span
                                  key={idx}
                                  className="rounded-md border border-primary/20 bg-primary/5 px-2 py-0.5 text-[11px] font-medium text-primary truncate max-w-48"
                                >
                                  {role}
                                </span>
                              ))}
                              {resume.targetRoles.length > 2 && (
                                <span className="rounded-md border border-border bg-muted/60 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                  +{resume.targetRoles.length - 2} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Technologies */}
                        {resume.technologies && resume.technologies.length > 0 && (
                          <div className="mt-3 space-y-1">
                            <div className="flex items-center gap-1 text-[11px] font-semibold uppercase text-muted-foreground">
                              <Code2 className="size-3" />
                              <span>Tech Stack</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {resume.technologies.slice(0, 4).map((tech, idx) => (
                                <span
                                  key={idx}
                                  className="rounded-md border border-border bg-muted/40 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
                                >
                                  {tech}
                                </span>
                              ))}
                              {resume.technologies.length > 4 && (
                                <span className="rounded-md border border-border bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                                  +{resume.technologies.length - 4}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Card Footer */}
                      <div className="mt-5 pt-3 border-t border-border/70 flex items-center justify-between text-xs text-muted-foreground">
                        <span>Updated {formatDate(resume.updatedAt)}</span>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => navigateToResumeFull(resume.id, e)}
                            className="size-7 rounded-lg text-muted-foreground hover:text-foreground"
                            title="Open full record page"
                          >
                            <ExternalLink className="size-3.5" />
                          </Button>
                          <ChevronRight className="size-4 text-muted-foreground group-hover:text-foreground transition-transform group-hover:translate-x-0.5" />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="pt-2">
                <CursorPaginationBar
                  page={page}
                  loading={loading}
                  hasPrev={cursorStack.length > 0}
                  hasNext={hasNext}
                  onPrev={goPrevPage}
                  onNext={goNextPage}
                />
              </div>
            </div>
          ) : (
            /* Dense Data Table View */
            <div className="flex flex-col">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-12 pl-4">Type</TableHead>
                      <TableHead>Resume Variant</TableHead>
                      <TableHead>Candidate</TableHead>
                      <TableHead>Target Roles</TableHead>
                      <TableHead className="hidden lg:table-cell">Technologies</TableHead>
                      <TableHead className="hidden sm:table-cell">Updated</TableHead>
                      <TableHead className="w-12 pr-4 text-right">
                        <span className="sr-only">Inspect</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((resume) => {
                      const isSelected = selectedResumeId === resume.id && drawerOpen
                      return (
                        <TableRow
                          key={resume.id}
                          role="button"
                          tabIndex={0}
                          aria-label={`Inspect ${resume.name}`}
                          className={`cursor-pointer transition-colors hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none ${
                            isSelected ? 'bg-muted/60 ring-1 ring-primary/30' : ''
                          }`}
                          onClick={() => openResumeDrawer(resume.id)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault()
                              openResumeDrawer(resume.id)
                            }
                          }}
                        >
                          {/* Variant Type Icon */}
                          <TableCell className="pl-4 py-3.5">
                            <span
                              className={`flex size-8 items-center justify-center rounded-lg border ${
                                resume.isDefault
                                  ? 'border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                  : 'border-purple-500/25 bg-purple-500/10 text-purple-600 dark:text-purple-400'
                              }`}
                            >
                              {resume.isDefault ? (
                                <Star className="size-4 fill-amber-500 text-amber-500" />
                              ) : (
                                <FileText className="size-4" />
                              )}
                            </span>
                          </TableCell>

                          {/* Variant Name & Badge */}
                          <TableCell className="whitespace-normal py-3.5">
                            <div className="font-bold text-sm text-foreground">
                              {resume.name}
                            </div>
                            <div className="mt-0.5">
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.2 text-[10px] font-bold uppercase tracking-wider ${
                                  resume.isDefault
                                    ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300'
                                    : 'bg-purple-500/15 text-purple-800 dark:text-purple-300'
                                }`}
                              >
                                {resume.isDefault ? 'Default Baseline' : 'Tailored Variant'}
                              </span>
                            </div>
                          </TableCell>

                          {/* Candidate Attribution */}
                          <TableCell className="max-w-36 truncate text-xs py-3.5">
                            <span className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-muted/40 px-2 py-1 text-xs text-foreground">
                              <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[9px] font-bold text-primary">
                                {userLabel(resume.userId).slice(0, 1).toUpperCase()}
                              </span>
                              <span className="truncate">{userLabel(resume.userId)}</span>
                            </span>
                          </TableCell>

                          {/* Target Roles */}
                          <TableCell className="py-3.5">
                            {resume.targetRoles && resume.targetRoles.length > 0 ? (
                              <div className="flex flex-wrap gap-1 max-w-xs">
                                {resume.targetRoles.slice(0, 2).map((role, idx) => (
                                  <span
                                    key={idx}
                                    className="rounded-md border border-primary/20 bg-primary/5 px-2 py-0.5 text-[11px] font-medium text-primary truncate"
                                  >
                                    {role}
                                  </span>
                                ))}
                                {resume.targetRoles.length > 2 && (
                                  <span className="rounded-md border border-border bg-muted/60 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                    +{resume.targetRoles.length - 2}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground/50 text-xs">—</span>
                            )}
                          </TableCell>

                          {/* Technologies */}
                          <TableCell className="hidden lg:table-cell py-3.5">
                            {resume.technologies && resume.technologies.length > 0 ? (
                              <div className="flex flex-wrap gap-1 max-w-xs">
                                {resume.technologies.slice(0, 3).map((tech, idx) => (
                                  <span
                                    key={idx}
                                    className="rounded-md border border-border bg-muted/40 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
                                  >
                                    {tech}
                                  </span>
                                ))}
                                {resume.technologies.length > 3 && (
                                  <span className="rounded-md border border-border bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                                    +{resume.technologies.length - 3}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground/50 text-xs">—</span>
                            )}
                          </TableCell>

                          {/* Updated Date */}
                          <TableCell className="hidden text-xs text-muted-foreground sm:table-cell py-3.5">
                            {formatDate(resume.updatedAt)}
                          </TableCell>

                          {/* Action Chevron */}
                          <TableCell className="text-right pr-4 py-3.5">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => navigateToResumeFull(resume.id, e)}
                                className="size-7 rounded-lg text-muted-foreground hover:text-foreground"
                                title="Open full record page"
                              >
                                <ExternalLink className="size-3.5" />
                              </Button>
                              <ChevronRight className="size-4 text-muted-foreground group-hover:text-foreground transition-transform group-hover:translate-x-0.5" />
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="p-4 border-t border-border/70">
                <CursorPaginationBar
                  page={page}
                  loading={loading}
                  hasPrev={cursorStack.length > 0}
                  hasNext={hasNext}
                  onPrev={goPrevPage}
                  onNext={goNextPage}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Slide-Over Resume Drawer */}
      <AdminResumeDrawer
        resumeId={selectedResumeId}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  )
}
