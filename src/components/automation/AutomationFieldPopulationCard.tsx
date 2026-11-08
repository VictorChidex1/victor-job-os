import { useState } from 'react'
import { CheckCircle2, CircleAlert, Loader2, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { populateAutomationFields } from '@/services/automation'
import type {
  AutomationFieldProposal,
  AutomationFieldSource,
  AutomationRun,
  FieldPopulationStatus,
} from '@/types/automation'

const SOURCE_LABELS: Record<AutomationFieldSource, string> = {
  application: 'Application',
  profile: 'Profile',
  preparation: 'Preparation',
  none: 'Needs input',
}

const STATUS_LABELS: Record<FieldPopulationStatus, string> = {
  filled: 'Filled',
  skipped: 'Skipped',
  failed: 'Failed',
  'manual-required': 'Manual required',
}

function isSupportedField(field: AutomationFieldProposal): boolean {
  return (
    field.inputType !== 'radio' &&
    (field.type === 'text' ||
      field.type === 'textarea' ||
      field.type === 'select' ||
      field.type === 'checkbox')
  )
}

function initialValues(
  fields: AutomationFieldProposal[],
): Record<string, string | boolean> {
  const values: Record<string, string | boolean> = {}
  for (const field of fields) {
    if (field.type === 'checkbox') {
      values[field.fieldKey] =
        typeof field.proposedValue === 'boolean' ? field.proposedValue : false
    } else {
      values[field.fieldKey] =
        typeof field.proposedValue === 'string' ? field.proposedValue : ''
    }
  }
  return values
}

function usableValue(
  field: AutomationFieldProposal,
  value: string | boolean | undefined,
): boolean {
  if (!isSupportedField(field)) return false
  if (field.type === 'checkbox') return typeof value === 'boolean'
  if (field.type === 'select') {
    return (
      typeof value === 'string' &&
      (field.options ?? []).some((option) => option === value)
    )
  }
  return typeof value === 'string' && value.trim().length > 0
}

function statusVariant(status: FieldPopulationStatus): 'secondary' | 'outline' {
  return status === 'filled' ? 'secondary' : 'outline'
}

export function AutomationFieldPopulationCard({
  run,
  onRefresh,
  className,
}: {
  run: AutomationRun
  onRefresh: () => Promise<void> | void
  className?: string
}) {
  const proposals = run.fieldProposals ?? []
  const [values, setValues] = useState<Record<string, string | boolean>>(() =>
    initialValues(proposals),
  )
  const [approved, setApproved] = useState<Record<string, boolean>>({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (proposals.length === 0) return null

  const populated = run.population
  const approvedFields = proposals
    .filter(
      (field) =>
        approved[field.fieldKey] &&
        usableValue(field, values[field.fieldKey]),
    )
    .map((field) => ({
      fieldKey: field.fieldKey,
      value: values[field.fieldKey] as string | boolean,
    }))
  const canPopulate =
    !populated && run.status === 'completed' && approvedFields.length > 0 && !busy

  function setValue(fieldKey: string, value: string | boolean) {
    setValues((current) => ({ ...current, [fieldKey]: value }))
  }

  function toggleApproved(fieldKey: string) {
    setApproved((current) => ({ ...current, [fieldKey]: !current[fieldKey] }))
  }

  function approveSuggested() {
    const next: Record<string, boolean> = {}
    for (const field of proposals) {
      if (
        field.proposedValue !== undefined &&
        usableValue(field, values[field.fieldKey])
      ) {
        next[field.fieldKey] = true
      }
    }
    setApproved((current) => ({ ...current, ...next }))
  }

  async function handlePopulate() {
    if (approvedFields.length === 0) {
      toast('Approve at least one field before populating')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await populateAutomationFields(run.id, approvedFields)
      toast('Approved fields populated')
      await onRefresh()
    } catch (populateError) {
      const message =
        populateError instanceof Error
          ? populateError.message
          : 'Unable to populate approved fields.'
      setError(message)
      toast('Unable to populate approved fields', { description: message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className={`flex flex-col gap-4 rounded-xl border border-border/60 bg-muted/20 p-3 ${className ?? ''}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <ShieldCheck className="size-4 text-primary" />
            Approved field population
          </div>
          <p className="mt-1 max-w-2xl text-xs text-muted-foreground">
            Review each proposed value and approve only what is correct. Only approved
            text, textarea, select, and checkbox fields are populated. Submission is not
            enabled.
          </p>
        </div>
        <Badge variant="outline">
          {populated
            ? `${populated.results.filter((result) => result.status === 'filled').length} filled`
            : `${approvedFields.length} approved`}
        </Badge>
      </div>

      {populated ? (
        <div className="flex flex-col gap-2">
          {populated.results.map((result) => (
            <div
              key={`${result.fieldKey}-${result.status}`}
              className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-border/50 bg-background/70 px-3 py-2"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-foreground">
                  {result.status === 'filled' ? (
                    <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <CircleAlert className="size-4 text-amber-600 dark:text-amber-400" />
                  )}
                  {result.label}
                </div>
                {result.reason && (
                  <p className="mt-1 text-xs text-muted-foreground">{result.reason}</p>
                )}
              </div>
              <Badge variant={statusVariant(result.status)}>
                {STATUS_LABELS[result.status]}
              </Badge>
            </div>
          ))}
          <p className="text-xs text-muted-foreground">
            Field values were applied in a temporary browser session. Review the
            application manually before submitting.
          </p>
        </div>
      ) : (
        <>
          {run.status !== 'completed' && (
            <p className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-800 dark:text-amber-200">
              A successful inspection is required before fields can be populated.
            </p>
          )}

          <div className="flex flex-col gap-3">
            {proposals.map((field) => {
              const supported = isSupportedField(field)
              const value = values[field.fieldKey]
              const canApprove =
                supported && usableValue(field, value) && run.status === 'completed'

              return (
                <div
                  key={field.fieldKey}
                  className="flex flex-col gap-2 rounded-lg border border-border/50 bg-background/70 p-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-foreground">
                          {field.label}
                        </span>
                        {field.required && (
                          <Badge variant="outline" className="text-[10px]">
                            Required
                          </Badge>
                        )}
                        <Badge variant="outline" className="font-normal text-[10px]">
                          {SOURCE_LABELS[field.proposedSource]}
                        </Badge>
                        {field.confidence === 'manual' && (
                          <Badge variant="outline" className="text-[10px]">
                            Needs review
                          </Badge>
                        )}
                      </div>
                      {field.note && (
                        <p className="mt-1 text-xs text-muted-foreground">{field.note}</p>
                      )}
                    </div>
                    {supported && (
                      <label className="flex select-none items-center gap-2 text-xs font-medium text-foreground">
                        <input
                          type="checkbox"
                          className="size-4 accent-primary"
                          checked={
                            Boolean(approved[field.fieldKey]) && usableValue(field, value)
                          }
                          onChange={() => toggleApproved(field.fieldKey)}
                          disabled={!canApprove || busy}
                        />
                        Approve
                      </label>
                    )}
                  </div>

                  {field.type === 'textarea' ? (
                    <Textarea
                      value={typeof value === 'string' ? value : ''}
                      onChange={(event) => setValue(field.fieldKey, event.target.value)}
                      rows={3}
                      disabled={busy}
                    />
                  ) : field.type === 'select' ? (
                    <select
                      className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                      value={typeof value === 'string' ? value : ''}
                      onChange={(event) => setValue(field.fieldKey, event.target.value)}
                      disabled={busy}
                    >
                      <option value="">Select an option</option>
                      {(field.options ?? []).map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : field.type === 'checkbox' ? (
                    <label className="flex items-center gap-2 text-sm text-foreground">
                      <input
                        type="checkbox"
                        className="size-4 accent-primary"
                        checked={Boolean(value)}
                        onChange={(event) =>
                          setValue(field.fieldKey, event.target.checked)
                        }
                        disabled={busy}
                      />
                      Set this checkbox
                    </label>
                  ) : field.type === 'text' ? (
                    <Input
                      value={typeof value === 'string' ? value : ''}
                      onChange={(event) => setValue(field.fieldKey, event.target.value)}
                      disabled={busy}
                    />
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      This field must be completed manually.
                    </p>
                  )}
                </div>
              )
            })}
          </div>

          {error && (
            <p className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-3 text-xs text-rose-800 dark:text-rose-200">
              {error}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              onClick={() => void handlePopulate()}
              disabled={!canPopulate || run.status !== 'completed'}
            >
              {busy ? <Loader2 className="animate-spin" /> : <ShieldCheck />}
              {busy ? 'Populating…' : 'Populate approved fields'}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={approveSuggested}
              disabled={busy || run.status !== 'completed'}
            >
              Approve suggested
            </Button>
            <span className="text-xs text-muted-foreground">
              {approvedFields.length} field(s) selected
            </span>
          </div>
        </>
      )}
    </div>
  )
}
