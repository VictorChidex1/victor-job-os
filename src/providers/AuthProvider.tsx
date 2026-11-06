import { useEffect, useState, type ReactNode } from 'react'
import { AuthContext, type AuthContextValue } from '@/providers/auth-context'
import { auth, onAuthStateChange } from '@/services/auth'
import { ensureUserDocument } from '@/services/users'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthContextValue['user']>(null)
  const [status, setStatus] = useState<AuthContextValue['status']>('loading')
  const [isAdmin, setIsAdmin] = useState(false)
  const [isAdminLoading, setIsAdminLoading] = useState(true)

  useEffect(() => {
    let active = true

    const unsubscribe = onAuthStateChange((nextUser) => {
      setUser(nextUser)
      setStatus(nextUser ? 'authenticated' : 'unauthenticated')

      if (!nextUser) {
        setIsAdmin(false)
        setIsAdminLoading(false)
        return
      }

      setIsAdminLoading(true)
      void nextUser
        .getIdTokenResult()
        .then((token) => {
          if (!active || auth.currentUser?.uid !== nextUser.uid) return
          setIsAdmin(token.claims.admin === true)
        })
        .catch(() => {
          if (active) setIsAdmin(false)
        })
        .finally(() => {
          if (active && auth.currentUser?.uid === nextUser.uid) {
            setIsAdminLoading(false)
          }
        })

      // Persist the account to Firestore on first sight. Non-fatal on
      // failure so the user still reaches the app.
      void ensureUserDocument(nextUser).catch(() => undefined)
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, status, isAdmin, isAdminLoading }}>
      {children}
    </AuthContext.Provider>
  )
}