import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { getSettings, saveSettings, updateSettings } from '@/services/settings'
import type { JobOsSettings } from '@/types/settings'

export interface UseSettingsResult {
  settings: JobOsSettings | null
  loading: boolean
  error: string | null
  saving: boolean
  save: (data: Partial<JobOsSettings>) => Promise<void>
}

export function useSettings(): UseSettingsResult {
  const { user, status } = useAuth()
  const [settings, setSettings] = useState<JobOsSettings | null>(null)
  const [loading, setLoading] = useState(status === 'loading')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    if (!user) {
      return
    }
    try {
      const data = await getSettings(user.uid)
      setSettings(data)
    } catch {
      setError('Unable to load your settings. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- fetch-on-mount idiom; setState occurs after await
    void load()
  }, [load])

  async function save(data: Partial<JobOsSettings>): Promise<void> {
    if (!user) {
      return
    }
    setSaving(true)
    setError(null)
    try {
      const existing = settings ?? { opportunity: undefined }
      if (existing.opportunity === undefined) {
        await saveSettings(user.uid, data)
      } else {
        await updateSettings(user.uid, data)
      }
      await load()
    } catch (saveError) {
      setError('Unable to save your settings. Please try again.')
      throw saveError
    } finally {
      setSaving(false)
    }
  }

  return { settings, loading, error, saving, save }
}