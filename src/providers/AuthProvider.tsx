import { useEffect, useState, type ReactNode } from 'react'
import { AuthContext, type AuthContextValue } from '@/providers/auth-context'
import { onAuthStateChange } from '@/services/auth'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthContextValue['user']>(null)
  const [status, setStatus] = useState<AuthContextValue['status']>('loading')

  useEffect(() => {
    const unsubscribe = onAuthStateChange((nextUser) => {
      setUser(nextUser)
      setStatus(nextUser ? 'authenticated' : 'unauthenticated')
    })
    return unsubscribe
  }, [])

  return (
    <AuthContext.Provider value={{ user, status }}>{children}</AuthContext.Provider>
  )
}