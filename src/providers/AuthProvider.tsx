import { useEffect, useState, type ReactNode } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { AuthContext, type AuthContextValue } from '@/providers/auth-context'
import { auth, onAuthStateChange, signOutUser } from '@/services/auth'
import { db } from '@/services/firestore'
import { collections } from '@/services/collections'
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
      void Promise.all([
        // Force a refresh so newly granted or revoked admin claims apply as
        // soon as the console loads.
        nextUser.getIdTokenResult(true),
        getDoc(doc(db, collections.users, nextUser.uid)),
      ])
        .then(([token, snapshot]) => {
          if (!active || auth.currentUser?.uid !== nextUser.uid) return

          const data = snapshot.exists() ? snapshot.data() : null
          if (data?.disabled === true) {
            setIsAdmin(false)
            void signOutUser()
            return
          }

          const role = data?.role
          const hasAdminRole = role === 'admin' || role === 'owner'
          setIsAdmin(token.claims.admin === true && hasAdminRole)
        })
        .catch(() => {
          // A disabled account can be denied this read by the strict rules.
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
