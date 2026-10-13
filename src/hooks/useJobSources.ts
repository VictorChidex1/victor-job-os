import { useEffect, useState } from 'react'
import {
  listJobSources,
  createJobSource,
  updateJobSource,
  deleteJobSource,
} from '@/services/jobSources'
import { useAuth } from '@/hooks/useAuth'
import type { JobSourceConfig } from '@/types/settings'

export interface UseJobSourcesResult {
  sources: JobSourceConfig[]
  loading: boolean
  error: string | null
  create: (data: Omit<JobSourceConfig, 'id'>) => Promise<void>
  update: (id: string, data: Partial<JobSourceConfig>) => Promise<void>
  remove: (id: string) => Promise<void>
}

export function useJobSources(): UseJobSourcesResult {
  const { user } = useAuth()
  const [sources, setSources] = useState<JobSourceConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function refresh() {
    if (!user) {
      setSources([])
      setLoading(false)
      return
    }
    try {
      const data = await listJobSources(user.uid)
      setSources(data)
    } catch {
      setError('Unable to load your job sources. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- fetch-on-mount idiom; setState occurs after await
    void refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  async function create(data: Omit<JobSourceConfig, 'id'>) {
    if (!user) return
    await createJobSource(user.uid, data)
    await refresh()
  }

  async function update(id: string, data: Partial<JobSourceConfig>) {
    await updateJobSource(id, data)
    await refresh()
  }

  async function remove(id: string) {
    await deleteJobSource(id)
    await refresh()
  }

  return { sources, loading, error, create, update, remove }
}
