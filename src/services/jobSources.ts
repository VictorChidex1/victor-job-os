import {
  collection,
  doc,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  type DocumentData,
} from 'firebase/firestore'
import { db } from '@/services/firestore'
import { collections } from '@/services/collections'
import type { JobSourceConfig } from '@/types/settings'

const jobSourcesCollection = collection(db, collections.jobSources)

export async function listJobSources(): Promise<JobSourceConfig[]> {
  const snapshot = await getDocs(jobSourcesCollection)
  return snapshot.docs.map((document) => toJobSource(document.id, document.data()))
}

export async function createJobSource(data: Omit<JobSourceConfig, 'id'>): Promise<string> {
  const ref = await addDoc(jobSourcesCollection, data)
  return ref.id
}

export async function updateJobSource(id: string, data: Partial<JobSourceConfig>): Promise<void> {
  await updateDoc(doc(jobSourcesCollection, id), data)
}

export async function deleteJobSource(id: string): Promise<void> {
  await deleteDoc(doc(jobSourcesCollection, id))
}

function toJobSource(id: string, data: DocumentData): JobSourceConfig {
  return {
    id,
    source: data.source,
    enabled: data.enabled ?? true,
    searchTerms: data.searchTerms ?? [],
    boardTargets: data.boardTargets ?? [],
    lastRunAt: data.lastRunAt?.toDate?.() ?? undefined,
  }
}