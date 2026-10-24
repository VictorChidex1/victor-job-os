import { useState } from 'react'
import { httpsCallable } from 'firebase/functions'
import { Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { functions } from '@/services/functions'

interface QualifyNewButtonProps {
  pendingCount: number
  onComplete?: () => void
  disabled?: boolean
}

const BATCH_SIZE = 5
const CALLS_PER_JOB = 2

export function QualifyNewButton({ pendingCount, onComplete, disabled }: QualifyNewButtonProps) {
  const [running, setRunning] = useState(false)
  const batch = Math.min(pendingCount, BATCH_SIZE)

  async function run() {
    setRunning(true)
    try {
      const callable = httpsCallable<{ limit: number }, { analyzed: number }>(
        functions,
        'qualifyNewJobs',
      )
      const response = await callable({ limit: BATCH_SIZE })
      toast(`Qualified ${response.data.analyzed} job${response.data.analyzed === 1 ? '' : 's'}`, {
        description: `Attempted the next ${batch} of ${pendingCount} new jobs.`,
      })
      onComplete?.()
    } catch {
      toast('Unable to qualify', {
        description: 'Cloud Functions are not available yet. Try again once deployed.',
      })
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        size="sm"
        variant="outline"
        onClick={() => void run()}
        disabled={disabled || running || pendingCount === 0}
      >
        <Sparkles />
        {running ? 'Qualifying…' : pendingCount === 0 ? 'All qualified' : `Qualify ${batch} new`}
      </Button>
      <span className="text-[0.65rem] text-muted-foreground">
        {BATCH_SIZE} per batch ≈ {BATCH_SIZE * CALLS_PER_JOB} AI calls
      </span>
    </div>
  )
}
