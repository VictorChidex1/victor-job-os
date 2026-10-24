import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { motion, useReducedMotion } from 'motion/react'
import {
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ExternalLink,
  MapPin,
  Search,
  Sparkles,
  X,
  XCircle,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageContainer } from '@/components/layout/PageContainer'
import { EmptyState } from '@/components/states/EmptyState'
import { QualifyNewButton } from '@/components/dashboard/QualifyNewButton'
import { useJobCounts } from '@/hooks/useJobCounts'
import { useJobsPage } from '@/hooks/useJobsPage'
import { usePageMeta } from '@/hooks/usePageMeta'
import { SELECTABLE_SOURCE_IDS, SOURCE_LABELS } from '@/lib/job-sources'
import { cn } from '@/lib/utils'
import type { Job } from '@/types/jobs'

const statusLabels: Record<string, string> = {
  new: 'New',
  qualified: 'Qualified',
  rejected: 'Rejected',
  archived: 'Archived',
}

function formatRelativeTime(
  timestamp?: { toDate?: () => Date; seconds?: number } | null,
): string {
  if (!timestamp) return ''
  const date =
    typeof timestamp.toDate === 'function'
      ? timestamp.toDate()
      : typeof timestamp.seconds === 'number'
        ? new Date(timestamp.seconds * 1000)
        : null
  if (!date || isNaN(date.getTime())) return ''
  const diffMs = Date.now() - date.getTime()
  if (diffMs < 0) return 'Just now'
  const diffMinutes = Math.floor(diffMs / 60000)
  if (diffMinutes < 1) return 'Just now'
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  const diffWeeks = Math.floor(diffDays / 7)
  if (diffWeeks < 4) return `${diffWeeks}w ago`
  return `${Math.floor(diffDays / 30)}mo ago`
}

function getCompanyInitials(name?: string): string {
  if (!name) return '??'
  const parts = name.trim().split(/[\s\-_]+/)
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

// Compositor-only mouse spotlight tracking (0% GPU thrash)
function handleSpotlightMove(e: React.MouseEvent<HTMLDivElement>) {
  const rect = e.currentTarget.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  e.currentTarget.style.setProperty('--mouse-x', `${x}px`)
  e.currentTarget.style.setProperty('--mouse-y', `${y}px`)
}

// 120 FPS Spring physics variants
const cardContainerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.035,
      delayChildren: 0.03,
    },
  },
} as const

const cardItemVariants = {
  hidden: { opacity: 0, y: 14, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 280,
      damping: 24,
      mass: 0.7,
    },
  },
} as const

function OpportunityCard({ job }: { job: Job }) {
  const timeLabel = formatRelativeTime(job.postedAt || job.discoveredAt)
  const isQualified = job.status === 'qualified'
  const isNew = job.status === 'new'

  return (
    <motion.div
      variants={cardItemVariants}
      onMouseMove={handleSpotlightMove}
      className={cn(
        'group relative flex w-full min-w-0 max-w-full flex-col justify-between rounded-2xl border bg-card/95 p-4 sm:p-5 text-card-foreground shadow-xs transition-all duration-300 overflow-hidden',
        'hover:-translate-y-1 hover:shadow-lg',
        isQualified
          ? 'border-emerald-500/30 hover:border-emerald-500/60'
          : 'border-border/60 hover:border-border/90',
      )}
    >
      {/* Specular Top Edge Glow on Hover */}
      <div
        className={cn(
          'pointer-events-none absolute inset-x-0 top-0 h-[2px] opacity-0 transition-opacity duration-500 group-hover:opacity-100',
          isQualified
            ? 'bg-gradient-to-r from-transparent via-emerald-500/80 to-transparent'
            : 'bg-gradient-to-r from-transparent via-primary/50 to-transparent',
        )}
      />

      {/* Hardware-Accelerated Spotlight Radial Glow */}
      <div
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            'radial-gradient(350px circle at var(--mouse-x, 0px) var(--mouse-y, 0px), rgba(255, 255, 255, 0.05), transparent 60%)',
        }}
      />

      {/* Main Details */}
      <div className="relative z-10 flex w-full min-w-0 flex-col gap-3 sm:gap-3.5">
        {/* Top Header: Monogram Avatar, Company, Time & Status */}
        <div className="flex w-full min-w-0 items-start justify-between gap-2.5 sm:gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3">
            <div className="flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-xl border border-border/80 bg-secondary/60 font-mono text-xs font-bold tracking-wider text-foreground shadow-xs group-hover:border-border group-hover:bg-secondary">
              {getCompanyInitials(job.companyName || job.companyId)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <span className="truncate font-semibold uppercase tracking-wider text-foreground/80 text-[11px] sm:text-xs">
                  {job.companyName || job.companyId || 'Unknown company'}
                </span>
                {timeLabel && (
                  <>
                    <span className="text-muted-foreground/40">·</span>
                    <span className="shrink-0 text-[10px] sm:text-[11px] text-muted-foreground">{timeLabel}</span>
                  </>
                )}
              </div>
              <Link
                to={`/app/opportunities/${job.id}`}
                className="block group/title focus:outline-hidden"
              >
                <h3 className="truncate text-sm sm:text-base font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary">
                  {job.title}
                </h3>
              </Link>
            </div>
          </div>

          {/* Status Badge */}
          {isQualified ? (
            <Badge
              variant="outline"
              className="shrink-0 gap-1.5 border-emerald-500/30 bg-emerald-500/10 py-0.5 sm:py-1 px-2 text-[11px] sm:text-xs font-semibold text-emerald-600 dark:text-emerald-400 shadow-xs"
            >
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.9)]" />
              Qualified
            </Badge>
          ) : isNew ? (
            <Badge
              variant="outline"
              className="shrink-0 gap-1.5 border-sky-500/30 bg-sky-500/10 py-0.5 sm:py-1 px-2 text-[11px] sm:text-xs font-semibold text-sky-600 dark:text-sky-400"
            >
              <span className="size-1.5 rounded-full bg-sky-500 animate-pulse" />
              New
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="shrink-0 border-border/60 bg-muted/30 py-0.5 sm:py-1 px-2 text-[11px] sm:text-xs font-medium text-muted-foreground"
            >
              {statusLabels[job.status] ?? job.status}
            </Badge>
          )}
        </div>

        {/* Metadata Badges: Remote, Location, Employment Type, ATS Source */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 rounded-md border border-border/50 bg-secondary/50 px-2 py-0.5 font-medium text-foreground/90">
            <MapPin className="size-3 text-muted-foreground" />
            {job.remote ? 'Remote' : job.location || 'Location unspecified'}
          </span>
          {job.employmentType && (
            <span className="inline-flex items-center rounded-md border border-border/50 bg-secondary/40 px-2 py-0.5 text-muted-foreground">
              {job.employmentType}
            </span>
          )}
          {job.seniority && (
            <span className="inline-flex items-center rounded-md border border-border/50 bg-secondary/40 px-2 py-0.5 text-muted-foreground">
              {job.seniority}
            </span>
          )}
          <span className="inline-flex items-center rounded-md border border-border/60 bg-background/80 px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
            {SOURCE_LABELS[job.source] ?? job.source}
          </span>
        </div>

        {/* Skills Tag Cloud */}
        {job.skills.length > 0 && (
          <div className="flex flex-wrap items-center gap-1 pt-0.5">
            {job.skills.slice(0, 5).map((skill) => (
              <span
                key={skill}
                className="rounded-md border border-border/50 bg-muted/30 px-2 py-0.5 font-mono text-[11px] text-foreground/80 transition-colors group-hover:border-border/80"
              >
                {skill}
              </span>
            ))}
            {job.skills.length > 5 && (
              <span className="px-1 text-[11px] font-mono text-muted-foreground">
                +{job.skills.length - 5}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Card Footer: Source Link & CTA */}
      <div className="relative z-10 mt-4 flex w-full min-w-0 flex-col gap-2.5 border-t border-border/40 pt-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center justify-between sm:justify-start">
          {job.applicationUrl ? (
            <a
              href={job.applicationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground py-0.5"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="size-3.5 shrink-0" />
              <span>Posting link</span>
            </a>
          ) : (
            <span className="text-xs text-muted-foreground/60 py-0.5">Discovered role</span>
          )}
        </div>

        <Link
          to={`/app/opportunities/${job.id}`}
          className={cn(
            buttonVariants({ variant: 'default', size: 'default' }),
            'group/btn h-10 w-full sm:w-auto sm:h-8.5 gap-2 font-medium shadow-xs justify-center rounded-xl shrink-0',
          )}
        >
          <span>Review Opportunity</span>
          <ChevronRight className="size-4 shrink-0 transition-transform duration-200 group-hover/btn:translate-x-0.5" />
        </Link>
      </div>
    </motion.div>
  )
}

function OpportunityCardSkeleton() {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-border/40 bg-card/60 p-4 sm:p-5 shadow-xs animate-pulse">
      <div className="flex flex-col gap-3 sm:gap-3.5">
        <div className="flex items-start justify-between gap-2.5 sm:gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="size-9 sm:size-10 rounded-xl bg-muted/60" />
            <div className="flex flex-col gap-1.5">
              <div className="h-3 w-24 rounded-md bg-muted/60" />
              <div className="h-4 w-48 rounded-md bg-muted" />
            </div>
          </div>
          <div className="h-6 w-20 rounded-full bg-muted/60" />
        </div>
        <div className="flex gap-2">
          <div className="h-5 w-20 rounded-md bg-muted/50" />
          <div className="h-5 w-24 rounded-md bg-muted/50" />
        </div>
        <div className="flex gap-1.5 pt-1">
          <div className="h-5 w-14 rounded-md bg-muted/40" />
          <div className="h-5 w-16 rounded-md bg-muted/40" />
          <div className="h-5 w-14 rounded-md bg-muted/40" />
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-2.5 border-t border-border/40 pt-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="h-4 w-20 rounded-md bg-muted/40" />
        <div className="h-10 w-full sm:h-8 sm:w-36 rounded-xl bg-muted" />
      </div>
    </div>
  )
}

function IntelligenceHUD({
  counts,
  activeStatus,
  onSelectStatus,
}: {
  counts: { total: number; new: number; qualified: number; rejected: number }
  activeStatus: string
  onSelectStatus: (status: string) => void
}) {
  const cards = [
    {
      id: '',
      label: 'All Opportunities',
      value: counts.total,
      icon: Briefcase,
      color: 'text-foreground',
      dotColor: 'bg-foreground',
      description: 'Discovered across all ATS pipelines',
    },
    {
      id: 'qualified',
      label: 'Qualified Fit',
      value: counts.qualified,
      icon: Sparkles,
      color: 'text-emerald-500 dark:text-emerald-400',
      dotColor: 'bg-emerald-500 animate-pulse',
      description: 'Passed automated stack & role criteria',
    },
    {
      id: 'new',
      label: 'Needs Review',
      value: counts.new,
      icon: Clock3,
      color: 'text-sky-500 dark:text-sky-400',
      dotColor: 'bg-sky-500 animate-pulse',
      description: 'Pending AI qualification or manual review',
    },
    {
      id: 'rejected',
      label: 'Rejected / Archived',
      value: counts.rejected,
      icon: XCircle,
      color: 'text-muted-foreground',
      dotColor: 'bg-muted-foreground',
      description: 'Filtered out or archived roles',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
      {cards.map((item) => {
        const isSelected = activeStatus === item.id
        const Icon = item.icon
        return (
          <button
            type="button"
            key={item.label}
            onClick={() => onSelectStatus(item.id)}
            className={cn(
              'group relative flex flex-col items-start rounded-2xl border p-3 sm:p-4 text-left transition-all duration-300 cursor-pointer',
              'hover:-translate-y-0.5 hover:shadow-md',
              isSelected
                ? 'border-primary bg-primary/5 shadow-xs'
                : 'border-border/60 bg-card hover:border-border/90',
            )}
          >
            {/* Specular Edge Highlight */}
            <div
              className={cn(
                'pointer-events-none absolute inset-x-0 top-0 h-[2px] transition-opacity duration-300',
                isSelected
                  ? 'bg-gradient-to-r from-transparent via-primary to-transparent opacity-100'
                  : 'bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 group-hover:opacity-100',
              )}
            />
            <div className="flex w-full items-center justify-between gap-2">
              <span className="text-[11px] sm:text-xs font-medium text-muted-foreground">{item.label}</span>
              <Icon className={cn('size-3.5 sm:size-4 transition-transform group-hover:scale-110', item.color)} />
            </div>
            <div className="mt-1.5 sm:mt-2 flex items-baseline gap-2">
              <span className={cn('text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight', item.color)}>
                {item.value.toLocaleString()}
              </span>
              <span className={cn('size-1.5 rounded-full', item.dotColor)} />
            </div>
            <p className="mt-1 line-clamp-1 text-[11px] text-muted-foreground hidden sm:block">
              {item.description}
            </p>
          </button>
        )
      })}
    </div>
  )
}

function PaginationBar({
  page,
  totalPages,
  total,
  isSearch,
  hasPrev,
  hasNext,
  loading,
  onPrev,
  onNext,
}: {
  page: number
  totalPages: number
  total: number
  isSearch: boolean
  hasPrev: boolean
  hasNext: boolean
  loading: boolean
  onPrev: () => void
  onNext: () => void
}) {
  return (
    <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-border/60 bg-card/60 p-3 sm:px-4 sm:py-2.5 backdrop-blur-xs shadow-xs">
      <div className="flex items-center justify-between sm:justify-start gap-2 text-xs text-muted-foreground w-full sm:w-auto">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-foreground">{total.toLocaleString()}</span>
          <span>{isSearch ? 'matching roles' : 'roles'}</span>
        </div>
        <span className="text-muted-foreground/40 sm:inline">·</span>
        <span>
          Page {page} of {Math.max(1, totalPages)}
        </span>
      </div>
      <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
        <Button
          variant="outline"
          size="sm"
          onClick={onPrev}
          disabled={!hasPrev || loading}
          className="gap-1 rounded-xl text-xs font-medium flex-1 sm:flex-initial"
        >
          <ChevronLeft className="size-3.5" />
          <span>Previous</span>
        </Button>
        <span className="min-w-[60px] text-center font-mono text-xs font-semibold text-foreground">
          {page} / {Math.max(1, totalPages)}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={onNext}
          disabled={!hasNext || loading}
          className="gap-1 rounded-xl text-xs font-medium flex-1 sm:flex-initial"
        >
          <span>Next</span>
          <ChevronRight className="size-3.5" />
        </Button>
      </div>
    </div>
  )
}

export function OpportunitiesPage() {
  usePageMeta({
    title: 'Opportunities — Victor Job OS',
    description: 'Discover the roles worth pursuing.',
    noindex: true,
    path: '/app/opportunities',
  })

  const shouldReduceMotion = useReducedMotion()
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [sourceFilter, setSourceFilter] = useState<string>('all')

  const statusFilter = searchParams.get('status') ?? ''
  const activeStatus = statusFilter && statusLabels[statusFilter] ? statusFilter : ''
  const companyFilter = searchParams.get('companyId') ?? ''

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput.trim()), 350)
    return () => clearTimeout(timer)
  }, [searchInput])

  const {
    jobs,
    loading,
    error,
    isSearch,
    page,
    totalPages,
    total,
    hasNext,
    hasPrev,
    nextPage,
    prevPage,
    refresh,
  } = useJobsPage({
    source: sourceFilter !== 'all' ? sourceFilter : undefined,
    status: activeStatus || undefined,
    companyId: companyFilter || undefined,
    search: debouncedSearch,
  })
  const { counts } = useJobCounts()

  const title = isSearch
    ? `Search: ${debouncedSearch}`
    : activeStatus
      ? statusLabels[activeStatus] === 'New'
        ? 'New opportunities'
        : `${statusLabels[activeStatus]} opportunities`
      : 'Opportunities'

  function handleSelectStatus(status: string) {
    const next = new URLSearchParams(searchParams)
    if (status) {
      next.set('status', status)
    } else {
      next.delete('status')
    }
    setSearchParams(next)
  }

  const statusTabs = [
    { id: '', label: 'All Roles', count: counts.total },
    { id: 'qualified', label: 'Qualified', count: counts.qualified },
    { id: 'new', label: 'Needs Review', count: counts.new },
    { id: 'rejected', label: 'Rejected', count: counts.rejected },
  ]

  return (
    <PageContainer
      title={title}
      description={
        isSearch
          ? 'Searching across all ATS discovery feeds. Clear the search to view source filters.'
          : activeStatus
            ? `Showing ${statusLabels[activeStatus].toLowerCase()} roles only.`
            : 'Discover the roles worth pursuing.'
      }
      actions={
        <QualifyNewButton pendingCount={counts.new} onComplete={() => void refresh()} />
      }
    >
      <div className="flex w-full min-w-0 max-w-full flex-col gap-6">
        {/* Executive Intelligence HUD Strip */}
        <IntelligenceHUD
          counts={counts}
          activeStatus={activeStatus}
          onSelectStatus={handleSelectStatus}
        />

        {/* Search, Status Tabs & Filter Controls */}
        <div className="flex w-full min-w-0 max-w-full flex-col gap-3 rounded-2xl border border-border/60 bg-card/50 p-3 sm:p-3.5 shadow-xs backdrop-blur-xs">
          <div className="flex w-full min-w-0 flex-col gap-3 md:flex-row md:items-center md:justify-between">
            {/* Search Input */}
            <div className="relative w-full min-w-0 md:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search roles, companies, tech stack, locations…"
                className="h-9.5 w-full rounded-xl bg-background/80 pl-9 pr-8 text-xs border-border/70 focus-visible:border-primary shadow-2xs"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label="Clear search query"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {/* Liquid Sliding Pill Status Tabs */}
            <div className="flex w-full min-w-0 max-w-full md:w-auto items-center overflow-x-auto rounded-xl border border-border/60 bg-muted/30 p-1 scrollbar-none">
              {statusTabs.map((tab) => {
                const isActive = activeStatus === tab.id
                return (
                  <button
                    type="button"
                    key={tab.id}
                    onClick={() => handleSelectStatus(tab.id)}
                    className={cn(
                      'relative z-10 flex flex-1 md:flex-initial justify-center items-center gap-1.5 rounded-lg px-2.5 sm:px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer',
                      isActive
                        ? 'text-foreground font-semibold'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeStatusPill"
                        className="absolute inset-0 rounded-lg border border-border/80 bg-background shadow-xs"
                        transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                      />
                    )}
                    <span className="relative z-10 whitespace-nowrap">{tab.label}</span>
                    <span
                      className={cn(
                        'relative z-10 rounded-full px-1.5 py-0.2 text-[10px] font-mono',
                        isActive
                          ? 'bg-secondary text-foreground'
                          : 'bg-muted/70 text-muted-foreground',
                      )}
                    >
                      {tab.count}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Source Filter Chips */}
          {!isSearch && (
            <div className="flex w-full min-w-0 max-w-full items-center gap-1.5 overflow-x-auto pt-1 pb-1 scrollbar-none">
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70 shrink-0 mr-1">
                Sources:
              </span>
              {companyFilter && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="shrink-0"
                  onClick={() => {
                    const next = new URLSearchParams(searchParams)
                    next.delete('companyId')
                    setSearchParams(next)
                  }}
                >
                  <X className="size-3.5" />
                  Clear company filter
                </Button>
              )}
              <button
                type="button"
                onClick={() => setSourceFilter('all')}
                className={cn(
                  'shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-all duration-200 border cursor-pointer',
                  sourceFilter === 'all'
                    ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                    : 'bg-background text-muted-foreground border-border/60 hover:border-border hover:text-foreground',
                )}
              >
                All Sources
              </button>
              {SELECTABLE_SOURCE_IDS.map((source) => {
                const isActive = sourceFilter === source
                return (
                  <button
                    type="button"
                    key={source}
                    onClick={() => setSourceFilter(source)}
                    className={cn(
                      'shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-all duration-200 border cursor-pointer',
                      isActive
                        ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                        : 'bg-background text-muted-foreground border-border/60 hover:border-border hover:text-foreground',
                    )}
                  >
                    {SOURCE_LABELS[source] ?? source}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Main Content Area */}
        {loading ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <OpportunityCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <EmptyState title="Unable to load opportunities" description={error} />
        ) : jobs.length === 0 ? (
          <EmptyState
            title={isSearch ? 'No matches found' : 'No opportunities in this view'}
            description={
              isSearch
                ? 'Try broadening your search term or clearing filters.'
                : 'Try selecting a different status or ATS source, or run discovery to pull new roles.'
            }
          />
        ) : (
          <div className="flex flex-col gap-4">
            <PaginationBar
              page={page}
              totalPages={totalPages}
              total={total}
              isSearch={isSearch}
              hasPrev={hasPrev}
              hasNext={hasNext}
              loading={loading}
              onPrev={() => void prevPage()}
              onNext={() => void nextPage()}
            />

            {/* 120 FPS Staggered Cascade Grid */}
            <motion.div
              key={`${page}-${activeStatus}-${sourceFilter}-${debouncedSearch}`}
              variants={shouldReduceMotion ? undefined : cardContainerVariants}
              initial={shouldReduceMotion ? undefined : 'hidden'}
              animate={shouldReduceMotion ? undefined : 'show'}
              className="grid w-full min-w-0 max-w-full gap-4 lg:grid-cols-2"
            >
              {jobs.map((job) => (
                <OpportunityCard key={job.id} job={job} />
              ))}
            </motion.div>

            <PaginationBar
              page={page}
              totalPages={totalPages}
              total={total}
              isSearch={isSearch}
              hasPrev={hasPrev}
              hasNext={hasNext}
              loading={loading}
              onPrev={() => void prevPage()}
              onNext={() => void nextPage()}
            />
          </div>
        )}
      </div>
    </PageContainer>
  )
}
