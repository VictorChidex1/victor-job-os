import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import {
  getApplicationPreparation,
  saveApplicationPreparation,
} from '@/services/applicationPreparations'
import type {
  ApplicationPreparation,
  ApplicationPreparationPatch,
} from '@/types/applicationPreparation'

export interface UseApplicationPreparationResult {
  preparation: ApplicationPreparation | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  save: (patch: ApplicationPreparationPatch) => Promise<void>
}

export function useApplicationPreparation(
  applicationId?: string,
): UseApplicationPreparationResult {
  const { user } = useAuth()
  const [preparation, setPreparation] = useState<ApplicationPreparation | null>(null)
  const [loading, setLoading] = useState(Boolean(applicationId))
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!user || !applicationId) {
      setPreparation(null)
      setLoading(false)
      return
    }
    try {
      const data = await getApplicationPreparation(user.uid, applicationId)
      setPreparation(data)
      setError(null)
    } catch {
      setError('Unable to load the application preparation.')
    } finally {
      setLoading(false)
    }
  }, [user, applicationId])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- fetch-on-mount idiom; setState occurs after await
    void refresh()
  }, [refresh])

  const save = useCallback(
    async (patch: ApplicationPreparationPatch) => {
      if (!user || !applicationId) {
        throw new Error('Sign in required to save preparation.')
      }
      await saveApplicationPreparation(user.uid, applicationId, patch)
      await refresh()
    },
    [user, applicationId, refresh],
  )

  return { preparation, loading, error, refresh, save }
}
