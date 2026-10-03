import { createContext } from 'react'
import type { User } from 'firebase/auth'

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

export interface AuthContextValue {
  user: User | null
  status: AuthStatus
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)