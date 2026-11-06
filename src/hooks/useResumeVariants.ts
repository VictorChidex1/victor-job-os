import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import {
  createResumeVariant,
  deleteResumeVariant,
  listResumeVariants,
  setDefaultResumeVariant,
  updateResumeVariant,
} from '@/services/resumeVariants'
import type { ResumeVariant, ResumeVariantInput } from '@/types/resumeVariants'

export interface UseResumeVariantsResult {
  variants: ResumeVariant[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  create: (input: ResumeVariantInput) => Promise<string>
  update: (id: string, input: ResumeVariantInput) => Promise<void>
  setDefault: (id: string) => Promise<void>
  remove: (id: string) => Promise<void>
}

export function useResumeVariants(): UseResumeVariantsResult {
  const { user } = useAuth()
  const [variants, setVariants] = useState<ResumeVariant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!user) {
      setVariants([])
      setLoading(false)
      return
    }
    try {
      const data = await listResumeVariants(user.uid)
      setVariants(data)
      setError(null)
    } catch {
      setError('Unable to load resume variants. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- fetch-on-mount idiom; setState occurs after await
    void refresh()
  }, [refresh])

  const create = useCallback(
    async (input: ResumeVariantInput) => {
      if (!user) {
        throw new Error('Sign in required.')
      }
      const id = await createResumeVariant(user.uid, input)
      await refresh()
      return id
    },
    [user, refresh],
  )

  const update = useCallback(
    async (id: string, input: ResumeVariantInput) => {
      if (!user) {
        throw new Error('Sign in required.')
      }
      await updateResumeVariant(user.uid, id, input)
      await refresh()
    },
    [user, refresh],
  )

  const setDefault = useCallback(
    async (id: string) => {
      if (!user) {
        throw new Error('Sign in required.')
      }
      await setDefaultResumeVariant(user.uid, id)
      await refresh()
    },
    [user, refresh],
  )

  const remove = useCallback(
    async (id: string) => {
      await deleteResumeVariant(id)
      await refresh()
    },
    [refresh],
  )

  return { variants, loading, error, refresh, create, update, setDefault, remove }
}
