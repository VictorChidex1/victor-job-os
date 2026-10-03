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

export function RunDiscoveryButton() {
  const [running, setRunning] = useState(false)

  async function run() {
    setRunning(true)
    try {
      const callable = httpsCallable<undefined, DiscoveryResult>(functions, 'runDiscoveryNow')
      const response = await callable()
      const result = response.data
      if (result.results.some((item) => item.error)) {
        toast('Discovery completed with errors', {
          description: `${result.stored} stored, ${result.duplicates} duplicates — some sources failed.`,
        })
      } else {
        toast('Discovery complete', {
          description: `${result.stored} new, ${result.duplicates} duplicates skipped.`,
        })
      }
    } catch {
      toast('Unable to run discovery', {
        description: 'Make sure the emulators are running.',
      })
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