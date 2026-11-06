import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router'
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
import { useAdminOpportunitiesPage } from '@/hooks/useAdminOpportunitiesPage'
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

export function AdminOpportunitiesPage() {
  usePageMeta({
    title: 'Opportunities — Admin — Victor Job OS',
    description: 'Cross-user opportunity browser for the Job OS administrator.',
    noindex: true,
    path: '/admin/opportunities',
  })

  const navigate = useNavigate()
  const location = useLocation()
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

  const { users } = useAdminUsers()
  const userMap = useMemo(
    () => new Map(users.map((user) => [user.id, user])),
    [users],
  )

  const { items, hasNext, nextCursor, loading, error, refresh } =
    useAdminOpportunitiesPage({
      search: query,
      status,
      source,
      userId,
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

  function openJob(id: string) {
    navigate(`/admin/opportunities/${id}`, {
      state: { from: `${location.pathname}${location.search}` },
    })
  }

  const hasFilters = Boolean(query || status || source || userId)
  const userLabel = (id: string) => {
    const user = userMap.get(id)
    return user?.displayName || user?.email || id.slice(0, 12)
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">
            Opportunities
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Read-only cross-user opportunity browser. Open a row to inspect the role,
            company context, description, and latest fit analysis.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void refresh()}>
          Refresh
        </Button>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm text-slate-950">Filters</CardTitle>
          <CardDescription>
            Page {page} · {hasNext ? 'More available' : 'End of results'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_11rem_11rem_12rem]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search role, company, skills, or user…"
                className="h-9 bg-white pl-9 pr-8"
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

            <Select
              value={status || 'all'}
              onValueChange={(value) => updateFilter('status', value === 'all' ? '' : (value ?? ''))}
            >
              <SelectTrigger className="h-9 bg-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={source || 'all'}
              onValueChange={(value) => updateFilter('source', value === 'all' ? '' : (value ?? ''))}
            >
              <SelectTrigger className="h-9 bg-white">
                <SelectValue placeholder="Source" />
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

            <Select
              value={userId || 'all'}
              onValueChange={(value) => updateFilter('user', value === 'all' ? '' : (value ?? ''))}
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
          <CardTitle className="text-sm text-slate-950">All opportunities</CardTitle>
          <CardDescription>
            Page {page} · {hasNext ? 'More available' : 'End of results'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingState label="Loading opportunities…" rows={5} />
          ) : error ? (
            <EmptyState
              title="Unable to load opportunities"
              description={error}
              action={
                <Button size="sm" onClick={() => void refresh()}>
                  Try again
                </Button>
              }
            />
          ) : items.length === 0 ? (
            <EmptyState
              title="No opportunities found"
              description={
                hasFilters
                  ? 'Try clearing or changing the filters.'
                  : 'Opportunities from all users will appear here.'
              }
            />
          ) : (
            <div className="flex flex-col gap-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Role / company</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden lg:table-cell">Location</TableHead>
                      <TableHead className="hidden sm:table-cell">Discovered</TableHead>
                      <TableHead className="w-10">
                        <span className="sr-only">Open</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((job) => (
                      <TableRow
                        key={job.id}
                        role="link"
                        tabIndex={0}
                        aria-label={`Open ${job.title} at ${job.companyName}`}
                        className="cursor-pointer transition-colors hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none"
                        onClick={() => openJob(job.id)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            openJob(job.id)
                          }
                        }}
                      >
                        <TableCell className="whitespace-normal py-3">
                          <div className="font-medium text-slate-950">{job.title}</div>
                          <div className="text-xs text-slate-500">{job.companyName}</div>
                        </TableCell>
                        <TableCell className="max-w-40 truncate text-xs text-slate-600">
                          {userLabel(job.userId)}
                        </TableCell>
                        <TableCell className="text-xs text-slate-500">
                          {SOURCE_LABELS[job.source as keyof typeof SOURCE_LABELS] ??
                            job.source}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{job.status}</Badge>
                        </TableCell>
                        <TableCell className="hidden max-w-40 truncate text-xs text-slate-500 lg:table-cell">
                          {job.remote ? 'Remote' : job.location || '—'}
                        </TableCell>
                        <TableCell className="hidden text-xs text-slate-500 sm:table-cell">
                          {formatDate(job.discoveredAt)}
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
