import { doc, getDoc, setDoc, updateDoc, type DocumentReference } from 'firebase/firestore'
import { db } from '@/services/firestore'
import { collections } from '@/services/collections'
import type { JobOsSettings } from '@/types/settings'

export const defaultSettings: Omit<JobOsSettings, 'id' | 'updatedAt'> = {
  opportunity: {
    preferredRoles: [],
    preferredTechnologies: [],
    preferredLocations: [],
    remotePreference: true,
    minFitScore: 60,
    employmentTypes: [],
    excludedRoles: [],
    excludedCompanies: [],
    dailyTarget: 20,
  },
  outreach: {
    requireApprovalBeforeSending: true,
    maxFollowUps: 2,
    followUpIntervalDays: 5,
  },
  ai: {
    provider: 'gemini',
    defaultModel: '',
  },
  sources: [],
}

export function settingsDoc(uid: string): DocumentReference {
  return doc(db, collections.settings, uid)
}

export async function getSettings(uid: string): Promise<JobOsSettings | null> {
  const snapshot = await getDoc(settingsDoc(uid))
  if (!snapshot.exists()) {
    return null
  }
  return snapshot.data() as JobOsSettings
}

export async function saveSettings(uid: string, data: Partial<JobOsSettings>): Promise<void> {
  const ref = settingsDoc(uid)
  await setDoc(ref, { ...defaultSettings, ...data, id: uid, updatedAt: new Date() }, { merge: true })
}

export async function updateSettings(uid: string, data: Partial<JobOsSettings>): Promise<void> {
  const ref = settingsDoc(uid)
  await updateDoc(ref, { ...data, updatedAt: new Date() })
}