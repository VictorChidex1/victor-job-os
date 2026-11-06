import { useCallback, useMemo, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router'
import { Briefcase, LayoutGrid, List, Loader2, Search, X } from 'lucide-react'
import { ApplicationBoard } from '@/components/applications/ApplicationBoard'
import { ApplicationDetail } from '@/components/applications/ApplicationDetail'
import { ApplicationTable } from '@/components/applications/ApplicationTable'
import { PipelineMetricsStrip } from '@/components/applications/PipelineMetricsStrip'
import { PipelineFlowBar } from '@/components/applications/PipelineFlowBar'
import { PageContainer } from '@/components/layout/PageContainer'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@/components/ui/sheet'
import { EmptyState } from '@/components/states/EmptyState'
import { LoadingState } from '@/components/states/LoadingState'
import { useApplications } from '@/hooks/useApplications'
import { usePageMeta } from '@/hooks/usePageMeta'
import {
  applicationSummary,
  filterApplications,
  groupApplications,
} from '@/lib/applicationPipeline'

type PipelineView = 'board' | 'list'

export function ApplicationsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const applicationId = searchParams.get('application')
  const query = searchParams.get('q') ?? ''
  const view: PipelineView = searchParams.get('view') === 'list' ? 'list' : 'board'
  const { items, loading, error, refresh } = useApplications()
  const [targetStageId, setTargetStageId] = useState<string | undefined>()

  const updateSearchParam = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(searchParams)
      if (value) {
        next.set(key, value)
      } else {
        next.delete(key)
      }
      setSearchParams(next, { replace: true })
    },
    [searchParams, setSearchParams],
  )

  const setQuery = useCallback(
    (value: string) => updateSearchParam('q', value),
    [updateSearchParam],
  )

  const setView = useCallback(
    (value: PipelineView) => updateSearchParam('view', value === 'list' ? 'list' : ''),
    [updateSearchParam],
  )

  usePageMeta({
    title: applicationId
      ? 'Application — Victor Job OS'
      : 'Applications — Victor Job OS',
    description: 'Track every job application from preparation to offer.',
    noindex: true,
    path: '/app/applications',
  })

  const summary = useMemo(() => applicationSummary(items), [items])
  const columns = useMemo(() => groupApplications(items), [items])
  const filtered = useMemo(() => filterApplications(items, query), [items, query])
  const stageFiltered = useMemo(() => {
    if (!targetStageId) return filtered
    if (targetStageId === 'closed') {
      return filtered.filter((a) => ['rejected', 'withdrawn', 'closed'].includes(a.status))
    }
    return filtered.filter((a) => a.status === targetStageId)
  }, [filtered, targetStageId])
  const needsReviewCount = useMemo(
    () => items.filter((a) => a.status === 'needs-review').length,
    [items],
  )

  const applicationHref = useCallback(
    (id: string) => {
      const next = new URLSearchParams(searchParams)
      next.set('application', id)
      return `/app/applications?${next.toString()}`
    },
    [searchParams],
  )

  const closeApplication = useCallback(() => {
    const next = new URLSearchParams(searchParams)
    next.delete('application')
    setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams])

  const openPreparation = useCallback(
    (id: string) => {
      const from = `${location.pathname}${location.search}`
      navigate(`/app/applications/${encodeURIComponent(id)}/prepare`, {
        state: { from },
      })
    },
    [location.pathname, location.search, navigate],
  )

  const description =
    items.length === 0
      ? 'Track every application from preparation to offer.'
      : `${summary.active} active · ${summary.nextActionsDue} next action${summary.nextActionsDue === 1 ? '' : 's'} due · ${summary.interviewing} interviewing · ${summary.offers} offer${summary.offers === 1 ? '' : 's'}`

  const initialLoading = loading && items.length === 0

  return (
    <PageContainer
      title="Applications"
      description={description}
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/app/opportunities')}
        >
          <Briefcase />
          Find opportunities
        </Button>
      }
    >
      {initialLoading ? (
        <LoadingState label="Loading applications…" rows={5} />
      ) : error ? (
        <EmptyState
          title="Unable to load applications"
          description={error}
        />
      ) : items.length === 0 ? (
        <EmptyState
          title="No applications yet"
          description="Start an application from an opportunity you want to pursue."
          action={
            <Button size="sm" onClick={() => navigate('/app/opportunities')}>
              <Briefcase />
              Find opportunities
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-4" aria-busy={loading}>
          {/* Top 4-KPI Metric Strip */}
          <PipelineMetricsStrip summary={summary} needsReviewCount={needsReviewCount} />

          {/* Interactive 9-Stage Pipeline Flow Bar */}
          <PipelineFlowBar
            columns={columns}
            activeStageId={targetStageId}
            onSelectStage={(stageId) => {
              setTargetStageId(stageId)
              if (view !== 'board') setView('board')
            }}
          />

          <Card className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between sm:px-4 sm:py-3">
            <div className="relative w-full sm:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search applications by role or company…"
                className="h-9 w-full rounded-xl bg-background/80 pl-9 pr-8 text-xs"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label="Clear application search"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 sm:justify-end">
              {loading && (
                <Loader2
                  className="size-3.5 animate-spin text-muted-foreground"
                  aria-label="Refreshing applications"
                />
              )}
              <div className="flex items-center gap-1 rounded-xl border border-border/60 bg-muted/30 p-1">
                <Button
                  variant={view === 'board' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setView('board')}
                  className="gap-1.5 rounded-lg"
                >
                  <LayoutGrid />
                  Board
                </Button>
                <Button
                  variant={view === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setView('list')}
                  className="gap-1.5 rounded-lg"
                >
                  <List />
                  List
                </Button>
              </div>
            </div>
          </Card>

          {filtered.length === 0 ? (
            <EmptyState
              title="No applications match"
              description="Try a different role or company name."
              action={
                <Button variant="outline" size="sm" onClick={() => setQuery('')}>
                  Clear search
                </Button>
              }
            />
          ) : view === 'board' ? (
            <ApplicationBoard
              applications={filtered}
              applicationHref={applicationHref}
              targetStageId={targetStageId}
              onSelectStage={setTargetStageId}
            />
          ) : (
            <ApplicationTable
              applications={stageFiltered}
              applicationHref={applicationHref}
            />
          )}
        </div>
      )}

      <Sheet
        open={Boolean(applicationId)}
        onOpenChange={(open) => {
          if (!open) {
            closeApplication()
          }
        }}
      >
        <SheetContent
          side="right"
          showCloseButton={false}
          className="overflow-y-auto p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-2xl"
        >
          <SheetTitle className="sr-only">Application details</SheetTitle>
          <SheetDescription className="sr-only">
            Review and update one job application.
          </SheetDescription>
          {applicationId && (
            <ApplicationDetail
              applicationId={applicationId}
              compact
              onClose={closeApplication}
              onChanged={() => void refresh()}
              onPrepare={() => openPreparation(applicationId)}
            />
          )}
        </SheetContent>
      </Sheet>
    </PageContainer>
  )
}
