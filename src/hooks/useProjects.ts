import { useEffect, useState } from 'react'
import { listProjects, createProject, updateProject, deleteProject } from '@/services/projects'
import { useAuth } from '@/hooks/useAuth'
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
  const { user } = useAuth()
  const [projects, setProjects] = useState<PortfolioProject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function refresh() {
    if (!user) {
      setProjects([])
      setLoading(false)
      return
    }
    try {
      const data = await listProjects(user.uid)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  async function create(data: Omit<PortfolioProject, 'id' | 'updatedAt'>) {
    if (!user) {
      throw new Error('Authentication required to create a project.')
    }
    await createProject(user.uid, data)
    await refresh()
  }

  async function update(id: string, data: Partial<Omit<PortfolioProject, 'id'>>) {
    if (!user) {
      throw new Error('Authentication required to update a project.')
    }
    await updateProject(id, data)
    await refresh()
  }

  async function remove(id: string) {
    if (!user) {
      throw new Error('Authentication required to delete a project.')
    }
    await deleteProject(id)
    await refresh()
  }

  return { projects, loading, error, refresh, create, update, remove }
}
