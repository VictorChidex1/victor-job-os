import { useEffect, useState } from 'react'
import { getCompany } from '@/services/companies'
import type { Company } from '@/types/companies'

export interface UseCompanyResult {
  company: Company | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useCompany(companyId: string | undefined): UseCompanyResult {
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function refresh() {
    if (!companyId) {
      setCompany(null)
      setLoading(false)
      return
    }
    try {
      const data = await getCompany(companyId)
      setCompany(data)
      setError(null)
    } catch {
      setError('Unable to load company research.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!companyId) {
      // oxlint-disable-next-line react/set-state-in-effect -- no-id branch clears loading synchronously
      setLoading(false)
      return
    }
    let active = true
    getCompany(companyId)
      .then((data) => {
        if (active) setCompany(data)
      })
      .catch(() => {
        if (active) setError('Unable to load company research.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [companyId])

  return { company, loading, error, refresh }
}