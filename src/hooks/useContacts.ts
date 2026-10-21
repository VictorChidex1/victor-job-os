import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { listContacts, listContactsByCompany } from '@/services/contacts'
import type { Contact } from '@/types/outreach'

export interface UseContactsResult {
  items: Contact[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useContacts(companyId?: string): UseContactsResult {
  const { user } = useAuth()
  const [items, setItems] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!user) {
      setItems([])
      setLoading(false)
      return
    }
    try {
      const data = companyId
        ? await listContactsByCompany(user.uid, companyId)
        : await listContacts(user.uid)
      setItems(data)
      setError(null)
    } catch {
      setError('Unable to load contacts. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [user, companyId])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- fetch-on-mount idiom; setState occurs after await
    void refresh()
  }, [refresh])

  return { items, loading, error, refresh }
}
