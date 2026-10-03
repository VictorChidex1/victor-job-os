import { useEffect, useState } from 'react'
import { getCompany } from '@/services/companies'
import type { Company } from '@/types/companies'

export interface UseCompanyResult {
  company: Company | null
  loading: boolean
  error: string | null
}

export function useCompany(companyId: string | undefined): UseCompanyResult {
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  return { company, loading, error }
}