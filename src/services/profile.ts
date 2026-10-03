import {
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  type DocumentReference,
  type Timestamp,
} from 'firebase/firestore'
import { db } from '@/services/firestore'
import { collections } from '@/services/collections'

export interface ProfileDoc {
  fullName?: string
  headline?: string
  summary?: string
  skills?: Array<{ value: string; status: 'verified' | 'needs-verification' }>
  technologies?: Array<{ value: string; status: 'verified' | 'needs-verification' }>
  preferredRoles?: string[]
  preferredLocations?: string[]
  remotePreference?: boolean
  experienceLevel?: string
  resumeUrl?: string
  portfolioUrl?: string
  email?: string
  updatedAt?: Timestamp
}

export type ProfileWriteData = Omit<ProfileDoc, 'updatedAt'>

export function profileDoc(uid: string): DocumentReference {
  return doc(db, collections.profiles, uid)
}

export async function saveProfile(uid: string, data: ProfileWriteData): Promise<void> {
  const ref = profileDoc(uid)
  await setDoc(ref, { ...data, updatedAt: new Date() }, { merge: true })
}

export async function updateProfile(uid: string, data: Record<string, unknown>): Promise<void> {
  const ref = profileDoc(uid)
  await updateDoc(ref, { ...data, updatedAt: new Date() })
}

export async function deleteProfile(uid: string): Promise<void> {
  await deleteDoc(profileDoc(uid))
}

export function onProfileChange(
  uid: string,
  callback: (data: ProfileDoc | undefined) => void,
): () => void {
  return onSnapshot(profileDoc(uid), {
    next: (snapshot) => callback(snapshot.exists() ? (snapshot.data() as ProfileDoc) : undefined),
  })
}