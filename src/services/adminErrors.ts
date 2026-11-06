import {
  collection,
  doc,
  documentId,
  getCountFromServer,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
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
  AdminErrorLog,
  AdminErrorLogDetail,
  AdminErrorSummary,
} from '@/types/admin'

export const ERROR_FUNCTIONS = [
  'client',
  'discoverJobs.scheduled',
  'runDiscoveryNow',
  'analyzeJob',
  'researchOpportunity',
  'qualifyNewJobs',
  'generatePitch',
  'updateOutreachStatus',
  'processFollowUps',
  'runFollowUpsNow',
  'generateCoverLetter',
  'generateApplicationAnswers',
] as const

export interface AdminErrorLogQuery {
  fn?: string
  userId?: string
  cursor?: CursorValue | null
  pageSize?: number
}

export interface AdminErrorLogPage {
  items: AdminErrorLog[]
  nextCursor: CursorValue | null
  hasMore: boolean
}

const errorLogs = collection(db, collections.errorLogs)
const DAY_MS = 24 * 60 * 60 * 1000
const WEEK_MS = 7 * DAY_MS

export async function loadAdminErrorSummary(): Promise<AdminErrorSummary> {
  const now = Date.now()
  const dayAgo = Timestamp.fromDate(new Date(now - DAY_MS))
  const weekAgo = Timestamp.fromDate(new Date(now - WEEK_MS))
  const [total, last24h, last7d, latest] = await Promise.all([
    getCountFromServer(errorLogs),
    getCountFromServer(query(errorLogs, where('createdAt', '>=', dayAgo))),
    getCountFromServer(query(errorLogs, where('createdAt', '>=', weekAgo))),
    getDocs(query(errorLogs, orderBy('createdAt', 'desc'), limit(1))),
  ])

  return {
    total: total.data().count,
    last24h: last24h.data().count,
    last7d: last7d.data().count,
    lastErrorAt: latest.docs[0]?.get('createdAt') as Timestamp | undefined,
  }
}

export async function loadAdminErrorLogsPage(
  input: AdminErrorLogQuery = {},
): Promise<AdminErrorLogPage> {
  const pageSize = Math.max(1, input.pageSize ?? 25)
  const constraints: QueryConstraint[] = []
  if (input.fn) constraints.push(where('fn', '==', input.fn))
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

  const snapshot = await getDocs(query(errorLogs, ...constraints))
  const hasMore = snapshot.docs.length > pageSize
  const pageDocs = hasMore ? snapshot.docs.slice(0, pageSize) : snapshot.docs
  const lastDoc = pageDocs[pageDocs.length - 1]

  return {
    items: pageDocs.map((document) =>
      toAdminErrorLog(document.id, document.data()),
    ),
    nextCursor: lastDoc ? cursorFromDocument(lastDoc, 'createdAt') : null,
    hasMore,
  }
}

export async function loadAdminErrorLogDetail(
  errorId: string,
): Promise<AdminErrorLogDetail> {
  const snapshot = await getDoc(doc(db, collections.errorLogs, errorId))
  if (!snapshot.exists()) {
    throw new Error('Error log not found.')
  }

  const data = snapshot.data()
  const userId = text(data.userId)
  const userSnapshot = userId
    ? await getDoc(doc(db, collections.users, userId))
    : null

  return {
    ...toAdminErrorLog(snapshot.id, data),
    stack: text(data.stack) || undefined,
    context: isRecord(data.context) ? data.context : undefined,
    user:
      userSnapshot?.exists()
        ? toAdminUser(userSnapshot.id, userSnapshot.data())
        : null,
  }
}

export function toAdminErrorLog(
  id: string,
  data: DocumentData,
): AdminErrorLog {
  return {
    id,
    userId: text(data.userId) || undefined,
    fn: text(data.fn) || 'unknown',
    message: text(data.message),
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function optionalTimestamp(value: unknown): Timestamp | undefined {
  return value ? (value as Timestamp) : undefined
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : ''
}
