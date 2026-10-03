import { useEffect, useState } from 'react'
import {
  listJobSources,
  createJobSource,
  updateJobSource,
  deleteJobSource,
} from '@/services/jobSources'
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
  const [sources, setSources] = useState<JobSourceConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function refresh() {
    try {
      const data = await listJobSources()
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
  }, [])

  async function create(data: Omit<JobSourceConfig, 'id'>) {
    await createJobSource(data)
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