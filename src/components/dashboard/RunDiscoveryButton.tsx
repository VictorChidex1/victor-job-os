import { useState } from 'react'
import { httpsCallable } from 'firebase/functions'
import { RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { functions } from '@/services/functions'

interface DiscoveryResult {
  stored: number
  duplicates: number
  qualified: number
  results: Array<{ source: string; boardTarget: string; count: number; error?: string }>
}

interface RunDiscoveryButtonProps {
  onComplete?: () => void
}

export function RunDiscoveryButton({ onComplete }: RunDiscoveryButtonProps) {
  const [running, setRunning] = useState(false)

  async function run() {
    setRunning(true)
    try {
      const callable = httpsCallable<undefined, DiscoveryResult>(functions, 'runDiscoveryNow')
      const response = await callable()
      const result = response.data
      const qualificationSkipped =
        result.qualified === 0 && result.results.some((item) => item.error === undefined)

      if (qualificationSkipped || result.qualified === 0) {
        toast('Discovery complete', {
          description: `${result.stored} stored · ${result.duplicates} duplicates · no matches yet (run Analyze or add search terms).`,
        })
      } else {
        toast('Discovery complete', {
          description: `${result.stored} stored · ${result.qualified} matched · ${result.duplicates} duplicates.`,
        })
      }
      onComplete?.()
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