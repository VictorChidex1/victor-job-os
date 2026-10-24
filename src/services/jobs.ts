import {
  collection,
  doc,
  getDoc,
  getDocs,
  getCountFromServer,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  type DocumentData,
  type QueryConstraint,
  type QueryDocumentSnapshot,
  type Timestamp,
} from 'firebase/firestore'
import { db } from '@/services/firestore'
import { collections } from '@/services/collections'
import type { Job, JobStatus } from '@/types/jobs'

const jobsCollection = collection(db, collections.jobs)

export interface JobPageOptions {
  pageSize?: number
  cursor?: QueryDocumentSnapshot<DocumentData> | null
  source?: string
  status?: string
  companyId?: string
}

export interface JobPage {
  jobs: Job[]
  cursor: QueryDocumentSnapshot<DocumentData> | null
  hasMore: boolean
}

export interface JobCounts {
  total: number
  new: number
  qualified: number
  rejected: number
}

export interface JobCountOptions {
  source?: string
  status?: string
  companyId?: string
}

/** Count jobs matching the current source/status filters (server-side). */
export async function countJobs(uid: string, options: JobCountOptions = {}): Promise<number> {
  const constraints: QueryConstraint[] = [where('userId', '==', uid)]
  if (options.source) constraints.push(where('source', '==', options.source))
  if (options.status) constraints.push(where('status', '==', options.status))
  if (options.companyId) constraints.push(where('companyId', '==', options.companyId))
  const snapshot = await getCountFromServer(query(jobsCollection, ...constraints))
  return snapshot.data().count
}

/** Count jobs matching a token search (server-side). */
export async function countSearchJobs(uid: string, term: string): Promise<number> {
  const tokens = term
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((token) => token.length >= 2)
    .slice(0, 10)
  if (tokens.length === 0) {
    return 0
  }
  const snapshot = await getCountFromServer(
    query(
      jobsCollection,
      where('userId', '==', uid),
      where('searchTokens', 'array-contains-any', tokens),
    ),
  )
  return snapshot.data().count
}

/**
 * Fetch one page of jobs, newest first, with optional server-side source and
 * status filters. Uses a cursor for stable pagination.
 */
export async function listJobsPage(uid: string, options: JobPageOptions = {}): Promise<JobPage> {
  const pageSize = options.pageSize ?? 50
  const constraints: QueryConstraint[] = [where('userId', '==', uid)]

  if (options.source) constraints.push(where('source', '==', options.source))
  if (options.status) constraints.push(where('status', '==', options.status))
  if (options.companyId) constraints.push(where('companyId', '==', options.companyId))

  constraints.push(orderBy('discoveredAt', 'desc'))
  if (options.cursor) constraints.push(startAfter(options.cursor))
  constraints.push(limit(pageSize + 1))

  const snapshot = await getDocs(query(jobsCollection, ...constraints))
  const hasMore = snapshot.docs.length > pageSize
  const pageDocs = hasMore ? snapshot.docs.slice(0, pageSize) : snapshot.docs

  return {
    jobs: pageDocs.map((document) => toJob(document.id, document.data())),
    cursor: pageDocs.length > 0 ? pageDocs[pageDocs.length - 1] : null,
    hasMore,
  }
}

/** Server-side prefix search over the normalized `searchText` field. */
export async function searchJobsPage(
  uid: string,
  term: string,
  options: JobPageOptions = {},
): Promise<JobPage> {
  const normalized = term.trim().toLowerCase()
  const tokens = normalized.split(/\s+/).filter((token) => token.length >= 2).slice(0, 10)
  if (tokens.length === 0) {
    return { jobs: [], cursor: null, hasMore: false }
  }

  const pageSize = options.pageSize ?? 50
  const constraints: QueryConstraint[] = [
    where('userId', '==', uid),
    where('searchTokens', 'array-contains-any', tokens),
    orderBy('discoveredAt', 'desc'),
  ]
  if (options.cursor) constraints.push(startAfter(options.cursor))
  constraints.push(limit(pageSize + 1))

  const snapshot = await getDocs(query(jobsCollection, ...constraints))
  const hasMore = snapshot.docs.length > pageSize
  const pageDocs = hasMore ? snapshot.docs.slice(0, pageSize) : snapshot.docs

  return {
    jobs: pageDocs.map((document) => toJob(document.id, document.data())),
    cursor: pageDocs.length > 0 ? pageDocs[pageDocs.length - 1] : null,
    hasMore,
  }
}

/** Accurate counts across the whole dataset (not just the loaded page). */
export async function getJobCounts(uid: string): Promise<JobCounts> {
  const [total, newCount, qualified, rejected] = await Promise.all([
    getCountFromServer(query(jobsCollection, where('userId', '==', uid))),
    getCountFromServer(
      query(jobsCollection, where('userId', '==', uid), where('status', '==', 'new')),
    ),
    getCountFromServer(
      query(jobsCollection, where('userId', '==', uid), where('status', '==', 'qualified')),
    ),
    getCountFromServer(
      query(jobsCollection, where('userId', '==', uid), where('status', '==', 'rejected')),
    ),
  ])

  return {
    total: total.data().count,
    new: newCount.data().count,
    qualified: qualified.data().count,
    rejected: rejected.data().count,
  }
}

export async function listJobsForCompany(
  uid: string,
  companyId: string,
  pageSize = 20,
): Promise<Job[]> {
  const snapshot = await getDocs(
    query(
      jobsCollection,
      where('userId', '==', uid),
      where('companyId', '==', companyId),
      orderBy('discoveredAt', 'desc'),
      limit(pageSize),
    ),
  )
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
    userId: data.userId,
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
