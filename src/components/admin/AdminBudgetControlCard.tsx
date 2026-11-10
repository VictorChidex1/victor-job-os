import { useState } from 'react'
import { PauseCircle, PlayCircle, ShieldAlert } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useAdminBudgetControl } from '@/hooks/useAdminBudgetControl'
import { setBudgetPause } from '@/services/adminBudgetControl'

function formatTimestamp(value?: { toDate?: () => Date }): string {
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

export function AdminBudgetControlCard() {
  const { control, loading, error, refresh } = useAdminBudgetControl()
  const [busy, setBusy] = useState(false)
  const paused = control?.aiPaused === true || control?.automationPaused === true

  async function updatePaused(nextPaused: boolean) {
    if (
      nextPaused &&
      !window.confirm(
        'Pause all AI and browser automation? Existing runs may be interrupted.',
      )
    ) {
      return
    }
    setBusy(true)
    try {
      await setBudgetPause(
        nextPaused,
        nextPaused
          ? 'Paused by administrator from System Health.'
          : 'Resumed by administrator from System Health.',
      )
      toast(nextPaused ? 'AI and automation paused' : 'AI and automation resumed')
      await refresh()
    } catch (actionError) {
      toast('Unable to update budget control', {
        description:
          actionError instanceof Error ? actionError.message : 'Please try again.',
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-sm">
              <ShieldAlert className="size-4 text-indigo-600" />
              Budget kill switch
            </CardTitle>
            <CardDescription>
              Pauses AI generation and browser automation at 80% of the $2 Cloud
              Billing budget to keep the project under the ceiling.
            </CardDescription>
          </div>
          <Badge variant={paused ? 'outline' : 'secondary'}>
            {loading ? 'Loading' : paused ? 'Paused' : 'Active'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <div className="min-w-0">
          {error ? (
            <p className="text-xs text-rose-700">{error}</p>
          ) : control ? (
            <div className="flex flex-col gap-1 text-xs text-slate-600">
              <span>
                Budget: ${(control.budgetAmount ?? 2).toFixed(2)} · Spend:{' '}
                ${(control.costAmount ?? 0).toFixed(2)}
              </span>
              {control.reason && <span>{control.reason}</span>}
              {paused && (
                <span>Paused: {formatTimestamp(control.pausedAt)}</span>
              )}
              {!paused && control.resumedAt && (
                <span>Resumed: {formatTimestamp(control.resumedAt)}</span>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-500">
              No budget pause has been recorded. AI and automation are active.
            </p>
          )}
        </div>
        <Button
          size="sm"
          variant={paused ? 'default' : 'outline'}
          onClick={() => void updatePaused(!paused)}
          disabled={loading || busy}
        >
          {paused ? <PlayCircle /> : <PauseCircle />}
          {busy ? 'Updating…' : paused ? 'Resume AI & automation' : 'Pause now'}
        </Button>
      </CardContent>
    </Card>
  )
}
