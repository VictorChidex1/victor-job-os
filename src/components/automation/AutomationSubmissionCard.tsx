import { useState } from 'react'
import { Link } from 'react-router'
import {
  CheckCircle2,
  ExternalLink,
  Loader2,
  Send,
  TriangleAlert,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useApplication } from '@/hooks/useApplication'
import { submitAutomationApplication } from '@/services/automation'
import type { AutomationRun } from '@/types/automation'

function formatSubmissionTime(value?: string): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function AutomationSubmissionCard({
  run,
  onRefresh,
  className,
}: {
  run: AutomationRun
  onRefresh: () => Promise<void> | void
  className?: string
}) {
  const { application, loading, refresh: refreshApplication } = useApplication(
    run.applicationId,
  )
  const [authorized, setAuthorized] = useState(false)
  const [confirmation, setConfirmation] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!run.submission && run.verification?.status !== 'verified') return null

  const submission = run.submission
  const submitted = submission?.status === 'submitted'
  const submitting = submission?.status === 'submitting' || run.status === 'submitting'
  const manual =
    submission?.status === 'manual-required' || submission?.status === 'failed'
  const canSubmit =
    !submitted &&
    !submitting &&
    !manual &&
    application?.status === 'approved' &&
    authorized &&
    confirmation.trim() === 'SUBMIT' &&
    !busy

  async function handleSubmit() {
    if (!canSubmit) return
    setBusy(true)
    setError(null)
    try {
      const result = await submitAutomationApplication(run.id)
      if (result.status === 'submitted') {
        toast('Application submitted')
      } else if (result.status === 'awaiting-manual-action') {
        toast('Submission needs manual completion', {
          description: result.submission.reason,
        })
      } else {
        toast('Application submission failed', {
          description: result.submission.error ?? result.submission.reason,
        })
      }
      await Promise.all([onRefresh(), refreshApplication()])
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : 'Unable to submit the application.'
      setError(message)
      toast('Unable to submit the application', { description: message })
      await onRefresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className={`flex flex-col gap-3 rounded-xl border border-border/60 bg-muted/20 p-3 ${className ?? ''}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Send className="size-4 text-primary" />
            Application submission
          </div>
          <p className="mt-1 max-w-2xl text-xs text-muted-foreground">
            This is the final external action. The browser will populate the verified
            fields again and click the application’s Submit control.
          </p>
        </div>
        <Badge variant={submitted ? 'secondary' : 'outline'}>
          {submitted
            ? 'Submitted'
            : submitting
              ? 'Submitting'
              : manual
                ? 'Manual submission required'
                : 'Awaiting final approval'}
        </Badge>
      </div>

      {loading ? (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading application state…
        </p>
      ) : submitted ? (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
          <div className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="size-4" />
            Application submitted
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Submitted {formatSubmissionTime(submission?.submittedAt)}.
          </p>
          {submission?.confirmationText && (
            <p className="mt-2 text-xs text-muted-foreground">
              {submission.confirmationText}
            </p>
          )}
          {submission?.confirmationUrl && (
            <a
              href={submission.confirmationUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs text-primary underline underline-offset-4"
            >
              Open confirmation
              <ExternalLink className="size-3" />
            </a>
          )}
        </div>
      ) : submitting ? (
        <p className="flex items-center gap-2 rounded-lg border border-blue-500/20 bg-blue-500/5 p-3 text-xs text-blue-800 dark:text-blue-200">
          <Loader2 className="size-4 animate-spin" />
          Submission is in progress. Do not close the app or retry.
        </p>
      ) : manual ? (
        <div className="flex flex-col gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-800 dark:text-amber-200">
          <div className="flex items-center gap-2 font-medium">
            <TriangleAlert className="size-4" />
            Submission needs manual completion
          </div>
          <p>{submission?.reason ?? submission?.error ?? 'The submission could not be confirmed.'}</p>
          <p>
            Do not retry automatically. Open the application, confirm whether it was
            submitted, and update the application record if needed.
          </p>
        </div>
      ) : application?.status !== 'approved' ? (
        <div className="flex flex-col gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-800 dark:text-amber-200">
          <div className="flex items-center gap-2 font-medium">
            <TriangleAlert className="size-4" />
            Application approval required
          </div>
          <p>
            The application must be moved to Approved in the preparation review before
            automated submission is allowed.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="w-fit"
            render={
              <Link
                to={`/app/applications/${run.applicationId}/prepare?tab=review`}
              />
            }
          >
            Open preparation review
          </Button>
        </div>
      ) : (
        <>
          <div className="grid gap-2 rounded-lg border border-border/50 bg-background/70 p-3 text-xs sm:grid-cols-2">
            <div>
              <span className="text-muted-foreground">Company: </span>
              <span className="font-medium text-foreground">
                {run.companyName || 'Unknown company'}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Role: </span>
              <span className="font-medium text-foreground">
                {run.applicationTitle || 'Application'}
              </span>
            </div>
            <div className="sm:col-span-2">
              <span className="text-muted-foreground">Resume: </span>
              <span className="font-medium text-foreground">
                {application.resumeUrl || 'Uses the preparation/profile resume fallback'}
              </span>
            </div>
          </div>

          <label className="flex items-start gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              className="mt-0.5 size-4 accent-primary"
              checked={authorized}
              onChange={(event) => setAuthorized(event.target.checked)}
              disabled={busy}
            />
            I authorize this external application submission.
          </label>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="submit-confirmation" className="text-xs font-medium text-foreground">
              Type <span className="font-mono font-bold">SUBMIT</span> to confirm
            </label>
            <Input
              id="submit-confirmation"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              placeholder="SUBMIT"
              autoComplete="off"
              disabled={busy}
            />
          </div>

          {error && (
            <p className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-3 text-xs text-rose-800 dark:text-rose-200">
              {error}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="destructive"
              onClick={() => void handleSubmit()}
              disabled={!canSubmit}
            >
              {busy ? <Loader2 className="animate-spin" /> : <Send />}
              {busy ? 'Submitting…' : 'Submit application'}
            </Button>
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
            <span className="text-xs text-muted-foreground">
              This action cannot be undone.
            </span>
          </div>
        </>
      )}
    </div>
  )
}
