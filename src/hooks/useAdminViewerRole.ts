import { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { useAuth } from '@/hooks/useAuth'
import { db } from '@/services/firestore'
import { collections } from '@/services/collections'
import type { UserRole } from '@/types/users'

export function useAdminViewerRole(): UserRole | null {
  const { user } = useAuth()
  const [role, setRole] = useState<UserRole | null>(null)

  useEffect(() => {
    let active = true
    if (!user) {
      setRole(null)
      return
    }
    void getDoc(doc(db, collections.users, user.uid))
      .then((snapshot) => {
        if (!active || !snapshot.exists()) return
        const value = snapshot.data().role
        setRole(value === 'owner' || value === 'admin' || value === 'user' ? value : 'user')
      })
      .catch(() => {
        if (active) setRole(null)
      })
    return () => {
      active = false
    }
  }, [user])

  return role
}
