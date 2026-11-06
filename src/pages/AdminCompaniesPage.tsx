import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router'
import {
  Briefcase,
  Building2,
  ChevronRight,
  ExternalLink,
  MapPin,
  RotateCw,
  Search,
  Sparkles,
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
import { AdminCompanyMetricsStrip } from '@/components/admin/AdminCompanyMetricsStrip'
import { AdminCompanyFlowBar } from '@/components/admin/AdminCompanyFlowBar'
import { AdminCompanyDrawer } from '@/components/admin/AdminCompanyDrawer'
import { useAdminCompaniesPage } from '@/hooks/useAdminCompaniesPage'
import { useAdminCompanyMetrics } from '@/hooks/useAdminCompanyMetrics'
import { useAdminUsers } from '@/hooks/useAdminUsers'
import { usePageMeta } from '@/hooks/usePageMeta'
import {
  appendCursor,
  currentPage,
  decodeCursorStack,
  encodeCursorStack,
  popCursor,
} from '@/lib/cursorPagination'
import type { AdminCompanyResearchFilter } from '@/services/adminCompanies'

const PAGE_SIZE = 25
const RESEARCH_OPTIONS: Array<{
  value: AdminCompanyResearchFilter
  label: string
}> = [
  { value: 'all', label: 'All research states' },
  { value: 'researched', label: 'Researched' },
  { value: 'unresearched', label: 'Not researched' },
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

function getMonogram(name?: string): string {
  return (name || 'CO')
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('')
}

function researchFilter(value: string): AdminCompanyResearchFilter {
  return value === 'researched' || value === 'unresearched' ? value : 'all'
}

export function AdminCompaniesPage() {
  usePageMeta({
    title: 'Companies — Admin — Victor Job OS',
    description: 'Cross-user enterprise directory and intelligence command center.',
    noindex: true,
    path: '/admin/companies',
  })

  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') ?? ''
  const research = researchFilter(searchParams.get('research') ?? 'all')
  const userId = searchParams.get('user') ?? ''
  const cursorParam = searchParams.get('cursors') ?? ''
  const cursorStack = useMemo(
    () => decodeCursorStack(cursorParam),
    [cursorParam],
  )
  const page = currentPage(cursorStack)
  const activeCursor = cursorStack[cursorStack.length - 1] ?? null
  const [searchInput, setSearchInput] = useState(query)

  // Slide-over drawer state
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const { users } = useAdminUsers()
  const userMap = useMemo(
    () => new Map(users.map((user) => [user.id, user])),
    [users],
  )

  const { metrics, loading: metricsLoading, refresh: refreshMetrics } =
    useAdminCompanyMetrics()

  const { items, hasNext, nextCursor, loading, error, refresh } =
    useAdminCompaniesPage({
      search: query,
      research,
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
    if (value && !(key === 'research' && value === 'all')) next.set(key, value)
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

  function openCompanyDrawer(id: string) {
    setSelectedCompanyId(id)
    setDrawerOpen(true)
  }

  function navigateToCompanyFull(id: string, e?: React.MouseEvent) {
    if (e) e.stopPropagation()
    navigate(`/admin/companies/${id}`, {
      state: { from: `${location.pathname}${location.search}` },
    })
  }

  const hasFilters = Boolean(query || userId || research !== 'all')
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
            Companies
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Cross-user enterprise directory, AI research dossier, and opportunity pipeline hub.
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
      <AdminCompanyMetricsStrip
        metrics={metrics}
        loading={metricsLoading}
        selectedResearch={research}
        onSelectResearch={(val) => updateFilter('research', val)}
      />

      {/* Directory Segment Flow Bar */}
      <AdminCompanyFlowBar
        metrics={metrics}
        selectedResearch={research}
        onSelectResearch={(val) => updateFilter('research', val)}
      />

      {/* Search & Filter Card */}
      <Card className="border-border/80 bg-card/60 shadow-xs backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Search & Filter Enterprise Profiles
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
                placeholder="Search company, industry, or location…"
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
              value={research}
              onValueChange={(value) =>
                updateFilter('research', value ?? 'all')
              }
            >
              <SelectTrigger className="h-10 bg-background/80 rounded-xl border-border/80 text-xs">
                <SelectValue placeholder="Research Status" />
              </SelectTrigger>
              <SelectContent>
                {RESEARCH_OPTIONS.map((option) => (
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
                {research !== 'all' && (
                  <Badge variant="secondary" className="rounded-lg text-[11px] gap-1">
                    Research: {research}
                    <X className="size-2.5 cursor-pointer" onClick={() => updateFilter('research', 'all')} />
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

      {/* Directory Table Card */}
      <Card className="border-border/80 bg-card shadow-xs">
        <CardHeader className="pb-3 border-b border-border/70 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold text-foreground">
              All Enterprise Directory Profiles
            </CardTitle>
            <CardDescription className="text-xs">
              Page {page} · {hasNext ? 'More records available' : 'End of records'}
            </CardDescription>
          </div>
          <span className="text-[11px] font-mono text-muted-foreground">
            {items.length} records shown
          </span>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6">
              <LoadingState label="Loading company records…" rows={6} />
            </div>
          ) : error ? (
            <div className="p-6">
              <EmptyState
                title="Unable to load companies"
                description={error}
                action={
                  <Button size="sm" onClick={() => void handleRefreshAll()} className="rounded-xl">
                    Try again
                  </Button>
                }
              />
            </div>
          ) : items.length === 0 ? (
            <div className="p-6">
              <EmptyState
                title="No companies found"
                description={
                  hasFilters
                    ? 'No enterprise profiles match your current search criteria. Try clearing or relaxing filters.'
                    : 'Companies from all users will appear here.'
                }
                action={
                  hasFilters ? (
                    <Button variant="outline" size="sm" onClick={clearFilters} className="rounded-xl">
                      Clear filters
                    </Button>
                  ) : undefined
                }
              />
            </div>
          ) : (
            <div className="flex flex-col">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-14 pl-5">Logo</TableHead>
                      <TableHead>Company & Industry</TableHead>
                      <TableHead>Research Status</TableHead>
                      <TableHead className="hidden lg:table-cell">Location</TableHead>
                      <TableHead className="hidden sm:table-cell">Pipeline Depth</TableHead>
                      <TableHead>Candidate</TableHead>
                      <TableHead className="hidden sm:table-cell">Updated</TableHead>
                      <TableHead className="w-12 pr-5 text-right">
                        <span className="sr-only">Inspect</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((company) => {
                      const isSelected = selectedCompanyId === company.id && drawerOpen
                      return (
                        <TableRow
                          key={company.id}
                          role="button"
                          tabIndex={0}
                          aria-label={`Inspect ${company.name}`}
                          className={`cursor-pointer transition-colors hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none ${
                            isSelected ? 'bg-muted/60 ring-1 ring-primary/30' : ''
                          }`}
                          onClick={() => openCompanyDrawer(company.id)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault()
                              openCompanyDrawer(company.id)
                            }
                          }}
                        >
                          {/* Monogram Avatar */}
                          <TableCell className="pl-5 py-3.5">
                            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-indigo-500/25 bg-indigo-500/10 font-mono text-xs font-black text-indigo-700 dark:text-indigo-300 shadow-2xs">
                              {getMonogram(company.name)}
                            </span>
                          </TableCell>

                          {/* Company Name & Industry */}
                          <TableCell className="whitespace-normal py-3.5">
                            <div className="font-bold text-sm text-foreground flex items-center gap-1.5">
                              <span>{company.name}</span>
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Building2 className="size-3 text-muted-foreground/70 shrink-0" />
                              <span className="truncate">{company.industry || 'Industry unknown'}</span>
                            </div>
                          </TableCell>

                          {/* Research Status */}
                          <TableCell className="py-3.5">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                                company.researched
                                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300'
                                  : 'border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300'
                              }`}
                            >
                              {company.researched ? (
                                <>
                                  <Sparkles className="size-3 text-emerald-600 dark:text-emerald-400" />
                                  <span>Researched</span>
                                </>
                              ) : (
                                <>
                                  <span className="size-1.5 rounded-full bg-amber-500" />
                                  <span>Not researched</span>
                                </>
                              )}
                            </span>
                          </TableCell>

                          {/* Location */}
                          <TableCell className="hidden max-w-36 truncate text-xs text-muted-foreground lg:table-cell py-3.5">
                            {company.location ? (
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="size-3 text-muted-foreground/70 shrink-0" />
                                <span className="truncate">{company.location}</span>
                              </span>
                            ) : (
                              <span className="text-muted-foreground/50">—</span>
                            )}
                          </TableCell>

                          {/* Opportunities / Pipeline Depth */}
                          <TableCell className="hidden sm:table-cell py-3.5">
                            <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/25 bg-blue-500/10 px-2 py-0.5 font-mono text-xs font-bold text-blue-700 dark:text-blue-300">
                              <Briefcase className="size-3 text-blue-600 dark:text-blue-400" />
                              <span>{company.jobCount}</span>
                              <span className="text-[10px] font-normal uppercase text-muted-foreground">
                                {company.jobCount === 1 ? 'role' : 'roles'}
                              </span>
                            </span>
                          </TableCell>

                          {/* Candidate Attribution */}
                          <TableCell className="max-w-36 truncate text-xs py-3.5">
                            <span className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-muted/40 px-2 py-1 text-xs text-foreground">
                              <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[9px] font-bold text-primary">
                                {userLabel(company.userId).slice(0, 1).toUpperCase()}
                              </span>
                              <span className="truncate">{userLabel(company.userId)}</span>
                            </span>
                          </TableCell>

                          {/* Updated Date */}
                          <TableCell className="hidden text-xs text-muted-foreground sm:table-cell py-3.5">
                            {formatDate(company.updatedAt)}
                          </TableCell>

                          {/* Action Chevron */}
                          <TableCell className="text-right pr-5 py-3.5">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => navigateToCompanyFull(company.id, e)}
                                className="size-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
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

      {/* Slide-Over Company Dossier Drawer */}
      <AdminCompanyDrawer
        companyId={selectedCompanyId}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  )
}
