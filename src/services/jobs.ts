import {
  collection,
  doc,
  documentId,
  getDoc,
  getDocs,
  getCountFromServer,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  type DocumentData,
  type QueryConstraint,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import { db } from '@/services/firestore'
import { collections } from '@/services/collections'
import { stripHtml } from '@/lib/html'
import { normalizeAtsMetadata } from '@/lib/atsApplicationMetadata'
import {
  timestampToMillis,
  toFirestoreTimestamp,
} from '@/lib/firestoreTimestamps'
import { searchTokensForQuery } from '@/lib/searchTokens'
import type { CursorValue } from '@/lib/cursorPagination'
import type { Job, JobSource, JobStatus } from '@/types/jobs'

const jobsCollection = collection(db, collections.jobs)

export interface JobPageOptions {
  pageSize?: number
  cursorValue?: CursorValue | null
  source?: string
  status?: string
  companyId?: string
}

export interface JobPage {
  jobs: Job[]
  nextCursor: CursorValue | null
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
  const tokens = searchTokensForQuery(term)
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
  constraints.push(orderBy(documentId(), 'desc'))
  if (options.cursorValue) {
    constraints.push(
      startAfter(
        Timestamp.fromMillis(options.cursorValue.value),
        options.cursorValue.id,
      ),
    )
  }
  constraints.push(limit(pageSize + 1))

  const snapshot = await getDocs(query(jobsCollection, ...constraints))
  const hasMore = snapshot.docs.length > pageSize
  const pageDocs = hasMore ? snapshot.docs.slice(0, pageSize) : snapshot.docs
  const lastDoc = pageDocs[pageDocs.length - 1]
  const nextCursor = lastDoc ? cursorFromDocument(lastDoc) : null

  return {
    jobs: pageDocs.map((document) => toJob(document.id, document.data())),
    nextCursor,
    hasMore: hasMore && Boolean(nextCursor),
  }
}

/** Server-side prefix search over the normalized `searchText` field. */
export async function searchJobsPage(
  uid: string,
  term: string,
  options: JobPageOptions = {},
): Promise<JobPage> {
  const tokens = searchTokensForQuery(term)
  if (tokens.length === 0) {
    return { jobs: [], nextCursor: null, hasMore: false }
  }

  const pageSize = options.pageSize ?? 50
  const constraints: QueryConstraint[] = [
    where('userId', '==', uid),
    where('searchTokens', 'array-contains-any', tokens),
    orderBy('discoveredAt', 'desc'),
    orderBy(documentId(), 'desc'),
  ]
  if (options.cursorValue) {
    constraints.push(
      startAfter(
        Timestamp.fromMillis(options.cursorValue.value),
        options.cursorValue.id,
      ),
    )
  }
  constraints.push(limit(pageSize + 1))

  const snapshot = await getDocs(query(jobsCollection, ...constraints))
  const hasMore = snapshot.docs.length > pageSize
  const pageDocs = hasMore ? snapshot.docs.slice(0, pageSize) : snapshot.docs
  const lastDoc = pageDocs[pageDocs.length - 1]
  const nextCursor = lastDoc ? cursorFromDocument(lastDoc) : null

  return {
    jobs: pageDocs.map((document) => toJob(document.id, document.data())),
    nextCursor,
    hasMore: hasMore && Boolean(nextCursor),
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

function cursorFromDocument(
  document: QueryDocumentSnapshot<DocumentData>,
): CursorValue | null {
  const value = timestampToMillis(document.get('discoveredAt'))
  if (value === null || value <= 0) return null
  return { value, id: document.id }
}

function toJob(id: string, data: DocumentData): Job {
  return {
    id,
    userId: data.userId,
    source: data.source,
    sourceJobId: data.sourceJobId,
    companyId: data.companyId ?? '',
    companyName: stripHtml(data.companyName ?? ''),
    title: stripHtml(data.title ?? ''),
    description: stripHtml(data.description ?? ''),
    location: data.location ? stripHtml(data.location) : undefined,
    remote: data.remote ?? false,
    employmentType: data.employmentType,
    seniority: data.seniority,
    applicationUrl: data.applicationUrl,
    atsMetadata: normalizeAtsMetadata(data.atsMetadata, {
      source: (data.source as JobSource) ?? 'custom',
      sourceJobId: data.sourceJobId,
      applicationUrl: data.applicationUrl ?? '',
    }),
    postedAt: data.postedAt ? toFirestoreTimestamp(data.postedAt) : undefined,
    discoveredAt: toFirestoreTimestamp(data.discoveredAt),
    skills: data.skills ?? [],
    searchTerms: data.searchTerms ?? [],
    status: (data.status as JobStatus) ?? 'new',
    fingerprint: data.fingerprint,
    createdAt: toFirestoreTimestamp(data.createdAt),
    updatedAt: toFirestoreTimestamp(data.updatedAt),
  }
}
