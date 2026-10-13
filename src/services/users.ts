import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  type DocumentReference,
} from 'firebase/firestore'
import type { User } from 'firebase/auth'
import { db } from '@/services/firestore'
import { collections } from '@/services/collections'

export function userDoc(uid: string): DocumentReference {
  return doc(db, collections.users, uid)
}

/**
 * Persist an authenticated account to Firestore.
 *
 * Creates `users/{uid}` the first time an account is seen (email/password
 * sign-up or first Google sign-in) and leaves existing documents untouched
 * so we never overwrite user data. Safe to call on every auth state change.
 */
export async function ensureUserDocument(user: User): Promise<void> {
  const ref = userDoc(user.uid)
  const snapshot = await getDoc(ref)
  if (snapshot.exists()) {
    return
  }

  await setDoc(ref, {
    uid: user.uid,
    email: user.email ?? null,
    displayName: user.displayName ?? null,
    photoURL: user.photoURL ?? null,
    providerIds: user.providerData.map((provider) => provider.providerId),
    role: 'user',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}
