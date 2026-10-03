import { useEffect, useState } from 'react'
import { listProjects, createProject, updateProject, deleteProject } from '@/services/projects'
import type { PortfolioProject } from '@/types/projects'

export interface UseProjectsResult {
  projects: PortfolioProject[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  create: (data: Omit<PortfolioProject, 'id' | 'updatedAt'>) => Promise<void>
  update: (id: string, data: Partial<Omit<PortfolioProject, 'id'>>) => Promise<void>
  remove: (id: string) => Promise<void>
}

export function useProjects(): UseProjectsResult {
  const [projects, setProjects] = useState<PortfolioProject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function refresh() {
    try {
      const data = await listProjects()
      setProjects(data)
    } catch {
      setError('Unable to load your projects. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- fetch-on-mount idiom; setState occurs after await
    void refresh()
  }, [])

  async function create(data: Omit<PortfolioProject, 'id' | 'updatedAt'>) {
    await createProject(data)
    await refresh()
  }

  async function update(id: string, data: Partial<Omit<PortfolioProject, 'id'>>) {
    await updateProject(id, data)
    await refresh()
  }

  async function remove(id: string) {
    await deleteProject(id)
    await refresh()
  }

  return { projects, loading, error, refresh, create, update, remove }
}