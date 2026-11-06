import { createContext } from 'react'
import type { User } from 'firebase/auth'

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

export interface AuthContextValue {
  user: User | null
  status: AuthStatus
  isAdmin: boolean
  isAdminLoading: boolean
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)