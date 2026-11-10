import { useState } from 'react'
import { Link } from 'react-router'
import { Bot, ExternalLink, RefreshCw, Square } from 'lucide-react'
import { toast } from 'sonner'
import { AutomationArtifactGallery } from '@/components/automation/AutomationArtifactGallery'
import { AutomationExecutionLog } from '@/components/automation/AutomationExecutionLog'
import { AutomationFieldPopulationCard } from '@/components/automation/AutomationFieldPopulationCard'
import { AutomationSubmissionCard } from '@/components/automation/AutomationSubmissionCard'
import { AutomationVerificationCard } from '@/components/automation/AutomationVerificationCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { PageContainer } from '@/components/layout/PageContainer'
import { EmptyState } from '@/components/states/EmptyState'
import { LoadingState } from '@/components/states/LoadingState'
import { useAutomationRuns } from '@/hooks/useAutomationRuns'
import { usePageMeta } from '@/hooks/usePageMeta'
import { cancelAutomationRun } from '@/services/automation'
import { AUTOMATION_RUN_LABELS, type AutomationRun } from '@/types/automation'

function formatDate(value?: { toDate?: () => Date }): string {
  const date = value?.toDate?.()
  return date
    ? date.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : '—'
}

function statusVariant(status: AutomationRun['status']): 'secondary' | 'outline' {
  return status === 'completed' ||
    status === 'running' ||
    status === 'verified' ||
    status === 'submitting' ||
    status === 'submitted'
    ? 'secondary'
    : 'outline'
}

export function AutomationPage() {
  usePageMeta({
    title: 'Automation — Victor Job OS',
    description: 'Browser automation sessions and application inspection runs.',
    noindex: true,
    path: '/app/automation',
  })

  const { runs, loading, error, refresh } = useAutomationRuns()
  const [cancelling, setCancelling] = useState<string | null>(null)

  async function cancelRun(runId: string) {
    setCancelling(runId)
    try {
      await cancelAutomationRun(runId)
      toast('Automation run cancelled')
      await refresh()
    } catch {
      toast('Unable to cancel automation run')
    } finally {
      setCancelling(null)
    }
  }

  return (
    <PageContainer
      title="Automation"
      description="Controlled browser inspections, approved field population, manual verification, and gated application submission."
      actions={
        <Button variant="outline" size="sm" onClick={() => void refresh()}>
          <RefreshCw />
          Refresh
        </Button>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Bot className="size-4 text-primary" />
            Browser automation
          </CardTitle>
          <CardDescription>
            Playwright inspects live application forms, populates approved fields, and submits
            only after manual verification and a final typed confirmation. Sessions are
            bounded and auditable.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Start an inspection from an application’s ATS metadata card, review proposed values,
          populate approved fields, then verify the application manually. Submission remains
          blocked until the application is approved and you type SUBMIT. Automation never
          guesses missing information or bypasses security challenges.
        </CardContent>
      </Card>

      {loading ? (
        <LoadingState label="Loading automation activity…" rows={4} />
      ) : error ? (
        <EmptyState
          title="Unable to load automation"
          description={error}
          action={
            <Button variant="outline" size="sm" onClick={() => void refresh()}>
              Try again
            </Button>
          }
        />
      ) : runs.length === 0 ? (
        <EmptyState
          title="No automation runs yet"
          description="Open an application with an ATS application URL and choose Inspect application form."
          action={
            <Button variant="outline" size="sm" render={<Link to="/app/applications" />}>
              Open applications
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {runs.map((run) => (
            <Card key={run.id}>
              <CardContent className="flex flex-col gap-3 pt-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs text-muted-foreground">
                      {run.companyName || 'Unknown company'}
                    </div>
                    <h2 className="truncate text-base font-semibold text-foreground">
                      {run.applicationTitle || 'Application inspection'}
                    </h2>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {run.provider} provider · step {run.currentStep} · started{' '}
                      {formatDate(run.createdAt)}
                    </div>
                  </div>
                  <Badge variant={statusVariant(run.status)}>
                    {AUTOMATION_RUN_LABELS[run.status]}
                  </Badge>
                </div>

                {run.manualActionReason && (
                  <p className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-800 dark:text-amber-200">
                    {run.manualActionReason}
                  </p>
                )}
                {run.error && (
                  <p className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-3 text-xs text-rose-800 dark:text-rose-200">
                    {run.error}
                  </p>
                )}

                {run.inspection && (
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline">
                      {run.inspection.fields.length} fields discovered
                    </Badge>
                    <Badge variant="outline">
                      {run.inspection.questions.length} questions discovered
                    </Badge>
                  </div>
                )}

                {run.fieldProposals && run.fieldProposals.length > 0 && (
                  <AutomationFieldPopulationCard
                    key={run.id}
                    run={run}
                    onRefresh={refresh}
                  />
                )}

                {run.population && (
                  <AutomationVerificationCard
                    key={`${run.id}-verification`}
                    run={run}
                    onRefresh={refresh}
                  />
                )}

                {(run.verification?.status === 'verified' || run.submission) && (
                  <AutomationSubmissionCard
                    key={`${run.id}-submission`}
                    run={run}
                    onRefresh={refresh}
                  />
                )}

                <AutomationExecutionLog
                  key={`${run.id}-log`}
                  runId={run.id}
                  defaultOpen={run.status === 'failed'}
                />

                {(run.population || run.status === 'failed') && (
                  <AutomationArtifactGallery
                    key={`${run.id}-artifacts`}
                    runId={run.id}
                    defaultOpen={run.status === 'failed'}
                  />
                )}

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    render={
                      <Link
                        to={`/app/applications?application=${encodeURIComponent(run.applicationId)}`}
                      />
                    }
                  >
                    <ExternalLink />
                    Open application
                  </Button>
                  {(['queued', 'running'].includes(run.status) ||
                    (run.status === 'awaiting-manual-action' && !run.population)) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => void cancelRun(run.id)}
                      disabled={cancelling === run.id}
                    >
                      <Square />
                      {cancelling === run.id ? 'Cancelling…' : 'Cancel run'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PageContainer>
  )
}
