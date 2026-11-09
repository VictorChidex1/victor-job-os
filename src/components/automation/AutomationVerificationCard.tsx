import { useState } from 'react'
import { CheckCircle2, ExternalLink, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { verifyAutomationRun } from '@/services/automation'
import type {
  AutomationRun,
  AutomationVerificationChecklist,
} from '@/types/automation'

const CHECKLIST_ITEMS: Array<{
  key: keyof AutomationVerificationChecklist
  label: string
}> = [
  {
    key: 'openedApplication',
    label: 'I opened the application and reviewed the live form.',
  },
  {
    key: 'reviewedPopulatedFields',
    label: 'I reviewed every populated field.',
  },
  {
    key: 'handledManualFields',
    label: 'I completed every field marked manual or skipped.',
  },
  {
    key: 'confirmsInformationIsAccurate',
    label: 'I confirm the information shown to me is accurate.',
  },
]

function formatVerificationTime(value?: string): string {
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

export function AutomationVerificationCard({
  run,
  onRefresh,
  className,
}: {
  run: AutomationRun
  onRefresh: () => Promise<void> | void
  className?: string
}) {
  const [checklist, setChecklist] =
    useState<AutomationVerificationChecklist>({
      openedApplication: false,
      reviewedPopulatedFields: false,
      handledManualFields: false,
      confirmsInformationIsAccurate: false,
    })
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!run.population) return null

  const verified = run.verification?.status === 'verified'
  const allChecked = Object.values(checklist).every(Boolean)
  const verificationAvailable =
    run.status === 'awaiting-verification' ||
    run.status === 'awaiting-manual-action'
  const canVerify = !verified && verificationAvailable && allChecked && !busy

  async function handleVerify() {
    if (!allChecked) {
      toast('Complete every verification item first')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await verifyAutomationRun(run.id, checklist, notes)
      toast('Application manually verified')
      await onRefresh()
    } catch (verifyError) {
      const message =
        verifyError instanceof Error
          ? verifyError.message
          : 'Unable to record verification.'
      setError(message)
      toast('Unable to record verification', { description: message })
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
            <ShieldCheck className="size-4 text-primary" />
            Manual verification
          </div>
          <p className="mt-1 max-w-2xl text-xs text-muted-foreground">
            The browser session has closed. Open the application yourself, review the
            populated and manual fields, then confirm the checklist. This does not submit
            the application.
          </p>
        </div>
        <Badge variant={verified ? 'secondary' : 'outline'}>
          {verified ? 'Verified' : 'Verification required'}
        </Badge>
      </div>

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
      </div>

      {verified ? (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
          <div className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="size-4" />
            Manually verified
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Verified {formatVerificationTime(run.verification?.verifiedAt)}. This run is
            ready for the future submission step.
          </p>
          {run.verification?.notes && (
            <p className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground">
              {run.verification.notes}
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            {CHECKLIST_ITEMS.map((item) => (
              <label
                key={item.key}
                className="flex items-start gap-2 text-sm text-foreground"
              >
                <input
                  type="checkbox"
                  className="mt-0.5 size-4 accent-primary"
                  checked={checklist[item.key]}
                  onChange={(event) =>
                    setChecklist((current) => ({
                      ...current,
                      [item.key]: event.target.checked,
                    }))
                  }
                  disabled={busy}
                />
                {item.label}
              </label>
            ))}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="verification-notes" className="text-xs font-medium text-foreground">
              Verification notes (optional)
            </label>
            <Textarea
              id="verification-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={2}
              maxLength={2000}
              placeholder="Anything you had to correct or complete manually."
              disabled={busy}
            />
          </div>

          {error && (
            <p className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-3 text-xs text-rose-800 dark:text-rose-200">
              {error}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={() => void handleVerify()} disabled={!canVerify}>
              <ShieldCheck />
              {busy ? 'Recording…' : 'Mark verified'}
            </Button>
            <span className="text-xs text-muted-foreground">
              This does not submit the application.
            </span>
          </div>
        </>
      )}
    </div>
  )
}
