import {
  average,
  collection,
  count as countAggregate,
  doc,
  documentId,
  getAggregateFromServer,
  getCountFromServer,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  sum,
  Timestamp,
  where,
  type DocumentData,
  type QueryConstraint,
  type QueryDocumentSnapshot,
  type Timestamp as FirestoreTimestamp,
} from 'firebase/firestore'
import { db } from '@/services/firestore'
import { collections } from '@/services/collections'
import { toAdminUser } from '@/services/admin'
import type { CursorValue } from '@/lib/cursorPagination'
import type {
  AdminAiRun,
  AdminAiRunDetail,
  AdminAiSummary,
} from '@/types/admin'

export const AI_OPERATIONS = [
  'analyzeJob',
  'researchCompany',
  'matchPortfolio',
  'generatePitch',
  'generateCoverLetter',
  'generateApplicationAnswers',
] as const

export const AI_STATUSES = ['success', 'error'] as const

export interface AdminAiRunQuery {
  status?: string
  operation?: string
  userId?: string
  cursor?: CursorValue | null
  pageSize?: number
}

export interface AdminAiRunPage {
  items: AdminAiRun[]
  nextCursor: CursorValue | null
  hasMore: boolean
}

const aiRuns = collection(db, collections.aiRuns)
const WEEK_MS = 7 * 24 * 60 * 60 * 1000

export async function loadAdminAiSummary(): Promise<AdminAiSummary> {
  const weekAgo = Timestamp.fromDate(new Date(Date.now() - WEEK_MS))
  const [total, success, errors, aggregate, latest] = await Promise.all([
    getCountFromServer(aiRuns),
    getCountFromServer(query(aiRuns, where('status', '==', 'success'))),
    getCountFromServer(query(aiRuns, where('status', '==', 'error'))),
    getAggregateFromServer(
      query(aiRuns, where('createdAt', '>=', weekAgo)),
      {
        count: countAggregate(),
        cost: sum('estimatedCostUsd'),
        duration: average('durationMs'),
      },
    ),
    getDocs(query(aiRuns, orderBy('createdAt', 'desc'), limit(1))),
  ])

  const stats = aggregate.data()
  return {
    totalRuns: total.data().count,
    successRuns: success.data().count,
    errorRuns: errors.data().count,
    runs7d: Number(stats.count ?? 0),
    estimatedCost7d: Number(stats.cost ?? 0),
    averageDurationMs7d: Math.round(Number(stats.duration ?? 0)),
    lastRunAt: latest.docs[0]?.get('createdAt') as Timestamp | undefined,
  }
}

export async function countAdminAiRuns(
  input: AdminAiRunQuery = {},
): Promise<number> {
  const restrictions: QueryConstraint[] = []
  if (input.status) restrictions.push(where('status', '==', input.status))
  if (input.operation) restrictions.push(where('operation', '==', input.operation))
  if (input.userId) restrictions.push(where('userId', '==', input.userId))
  const snapshot = await getCountFromServer(query(aiRuns, ...restrictions))
  return snapshot.data().count
}

export async function loadAdminAiRunsPage(
  input: AdminAiRunQuery = {},
): Promise<AdminAiRunPage> {
  const pageSize = Math.max(1, input.pageSize ?? 25)
  const constraints: QueryConstraint[] = []
  if (input.status) constraints.push(where('status', '==', input.status))
  if (input.operation) constraints.push(where('operation', '==', input.operation))
  if (input.userId) constraints.push(where('userId', '==', input.userId))
  constraints.push(orderBy('createdAt', 'desc'))
  constraints.push(orderBy(documentId(), 'desc'))
  if (input.cursor) {
    constraints.push(
      startAfter(
        Timestamp.fromMillis(input.cursor.value),
        input.cursor.id,
      ),
    )
  }
  constraints.push(limit(pageSize + 1))

  const snapshot = await getDocs(query(aiRuns, ...constraints))
  const hasMore = snapshot.docs.length > pageSize
  const pageDocs = hasMore ? snapshot.docs.slice(0, pageSize) : snapshot.docs
  const lastDoc = pageDocs[pageDocs.length - 1]

  return {
    items: pageDocs.map((document) =>
      toAdminAiRun(document.id, document.data()),
    ),
    nextCursor: lastDoc ? cursorFromDocument(lastDoc, 'createdAt') : null,
    hasMore,
  }
}

export async function loadAdminAiRunDetail(
  runId: string,
): Promise<AdminAiRunDetail> {
  const snapshot = await getDoc(doc(db, collections.aiRuns, runId))
  if (!snapshot.exists()) {
    throw new Error('AI run not found.')
  }

  const data = snapshot.data()
  const userId = text(data.userId)
  const jobId = text(data.jobId)

  const [userSnapshot, jobSnapshot] = await Promise.all([
    userId ? getDoc(doc(db, collections.users, userId)) : Promise.resolve(null),
    jobId ? getDoc(doc(db, collections.jobs, jobId)) : Promise.resolve(null),
  ])

  return {
    ...toAdminAiRun(snapshot.id, data),
    user:
      userSnapshot?.exists()
        ? toAdminUser(userSnapshot.id, userSnapshot.data())
        : null,
    job: jobSnapshot?.exists()
      ? {
          id: jobSnapshot.id,
          title: text(jobSnapshot.data().title),
          companyName: text(jobSnapshot.data().companyName),
          source: text(jobSnapshot.data().source) || 'custom',
          status: text(jobSnapshot.data().status) || 'new',
        }
      : null,
  }
}

export function toAdminAiRun(id: string, data: DocumentData): AdminAiRun {
  return {
    id,
    userId: text(data.userId),
    provider: text(data.provider) || 'unknown',
    model: text(data.model) || 'unknown',
    operation: text(data.operation) || 'unknown',
    status: text(data.status) || 'unknown',
    durationMs:
      typeof data.durationMs === 'number' ? data.durationMs : 0,
    jobId: text(data.jobId) || undefined,
    error: text(data.error) || undefined,
    estimatedCostUsd:
      typeof data.estimatedCostUsd === 'number' ? data.estimatedCostUsd : 0,
    createdAt: optionalTimestamp(data.createdAt),
  }
}

function cursorFromDocument(
  document: QueryDocumentSnapshot<DocumentData>,
  field: string,
): CursorValue {
  const value = document.get(field) as FirestoreTimestamp | undefined
  return {
    value:
      value && typeof value.toMillis === 'function' ? value.toMillis() : 0,
    id: document.id,
  }
}

function optionalTimestamp(value: unknown): Timestamp | undefined {
  return value ? (value as Timestamp) : undefined
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : ''
}
