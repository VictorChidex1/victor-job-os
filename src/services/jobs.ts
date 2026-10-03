import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  limit,
  type DocumentData,
  type Timestamp,
} from 'firebase/firestore'
import { db } from '@/services/firestore'
import { collections } from '@/services/collections'
import type { Job, JobStatus } from '@/types/jobs'

const jobsCollection = collection(db, collections.jobs)

export async function listJobs(limitCount = 50): Promise<Job[]> {
  const snapshot = await getDocs(query(jobsCollection, orderBy('discoveredAt', 'desc'), limit(limitCount)))
  return snapshot.docs.map((document) => toJob(document.id, document.data()))
}

export async function getJob(id: string): Promise<Job | null> {
  const snapshot = await getDoc(doc(jobsCollection, id))
  if (!snapshot.exists()) {
    return null
  }
  return toJob(snapshot.id, snapshot.data())
}

function toJob(id: string, data: DocumentData): Job {
  return {
    id,
    source: data.source,
    sourceJobId: data.sourceJobId,
    companyId: data.companyId ?? '',
    companyName: data.companyName ?? '',
    title: data.title,
    description: data.description,
    location: data.location,
    remote: data.remote ?? false,
    employmentType: data.employmentType,
    seniority: data.seniority,
    applicationUrl: data.applicationUrl,
    postedAt: data.postedAt ? toTimestamp(data.postedAt) : undefined,
    discoveredAt: toTimestamp(data.discoveredAt),
    skills: data.skills ?? [],
    searchTerms: data.searchTerms ?? [],
    status: (data.status as JobStatus) ?? 'new',
    fingerprint: data.fingerprint,
    createdAt: toTimestamp(data.createdAt),
    updatedAt: toTimestamp(data.updatedAt),
  }
}

function toTimestamp(value: unknown): Timestamp {
  return value as Timestamp
}
