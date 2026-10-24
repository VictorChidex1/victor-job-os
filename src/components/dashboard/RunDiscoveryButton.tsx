import { useState } from 'react'
import { httpsCallable } from 'firebase/functions'
import { RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { functions } from '@/services/functions'

interface DiscoveryResult {
  stored: number
  duplicates: number
  results: Array<{ source: string; boardTarget: string; count: number; error?: string }>
}

interface RunDiscoveryButtonProps {
  onComplete?: () => void
}

const QUALIFY_BATCH = 5

export function RunDiscoveryButton({ onComplete }: RunDiscoveryButtonProps) {
  const [running, setRunning] = useState(false)

  async function qualifyInBackground() {
    try {
      const callable = httpsCallable<{ limit: number }, { analyzed: number }>(
        functions,
        'qualifyNewJobs',
      )
      const response = await callable({ limit: QUALIFY_BATCH })
      if (response.data.analyzed > 0) {
        toast(`Qualified ${response.data.analyzed} new job${response.data.analyzed === 1 ? '' : 's'}`, {
          description: 'Background qualification finished.',
        })
        onComplete?.()
      }
    } catch {
      // Non-fatal: qualification is a background enhancement.
    }
  }

  async function run() {
    setRunning(true)
    try {
      const callable = httpsCallable<undefined, DiscoveryResult>(functions, 'runDiscoveryNow')
      const response = await callable()
      const result = response.data
      const errors = result.results.filter((item) => item.error).length
      toast('Discovery complete', {
        description:
          `${result.stored} stored · ${result.duplicates} duplicates` +
          (errors ? ` · ${errors} source error(s)` : '') +
          '. Qualifying new jobs in the background…',
      })
      onComplete?.()
      // Decoupled: don't make the user wait for AI qualification.
      void qualifyInBackground()
    } catch (error) {
      const message =
        error instanceof Error && 'code' in error
          ? 'Check your Gemini API key in functions/.env.'
          : 'Make sure the emulators are running.'
      toast('Unable to run discovery', { description: message })
    } finally {
      setRunning(false)
    }
  }

  return (
    <Button size="sm" variant="outline" onClick={() => void run()} disabled={running}>
      <RefreshCw className={running ? 'animate-spin' : undefined} />
      {running ? 'Discovering…' : 'Run Discovery'}
    </Button>
  )
}
