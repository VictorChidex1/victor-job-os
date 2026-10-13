import { useEffect, useState, type ReactNode } from 'react'
import { AuthContext, type AuthContextValue } from '@/providers/auth-context'
import { onAuthStateChange } from '@/services/auth'
import { ensureUserDocument } from '@/services/users'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthContextValue['user']>(null)
  const [status, setStatus] = useState<AuthContextValue['status']>('loading')

  useEffect(() => {
    const unsubscribe = onAuthStateChange((nextUser) => {
      setUser(nextUser)
      setStatus(nextUser ? 'authenticated' : 'unauthenticated')
      if (nextUser) {
        // Persist the account to Firestore on first sight. Non-fatal on
        // failure so the user still reaches the app.
        void ensureUserDocument(nextUser).catch(() => undefined)
      }
    })
    return unsubscribe
  }, [])

  return (
    <AuthContext.Provider value={{ user, status }}>{children}</AuthContext.Provider>
  )
}