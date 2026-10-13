import type { Timestamp } from 'firebase/firestore'

export type UserRole = 'owner' | 'user'

export interface AppUser {
  id: string
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
  providerIds: string[]
  role: UserRole
  createdAt: Timestamp
  updatedAt: Timestamp
}
