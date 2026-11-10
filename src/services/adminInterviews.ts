import {
  collection,
  documentId,
  getCountFromServer,
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
import { searchTokensForQuery } from '@/lib/searchTokens'
import { interviewFromId } from '@/services/interviews'
import type { CursorValue } from '@/lib/cursorPagination'
import type { Interview, InterviewStatus, InterviewType } from '@/types/interviews'

export interface AdminInterviewQuery {
  search?: string
  status?: string
  type?: string
  userId?: string
  applicationId?: string
  from?: Date
  to?: Date
  cursor?: CursorValue | null
  pageSize?: number
}

export interface AdminInterviewPage {
  items: Interview[]
  nextCursor: CursorValue | null
  hasMore: boolean
}

export interface AdminInterviewMetrics {
  total: number
  upcoming: number
  completed: number
  cancelled: number
  noShow: number
}

const interviews = collection(db, collections.interviews)

function buildConstraints(input: AdminInterviewQuery): QueryConstraint[] {
  const constraints: QueryConstraint[] = []
  if (input.userId) constraints.push(where('userId', '==', input.userId))
  if (input.status) constraints.push(where('status', '==', input.status))
  if (input.type) constraints.push(where('type', '==', input.type))
  if (input.applicationId) {
    constraints.push(where('applicationId', '==', input.applicationId))
  }
  if (input.from) {
    constraints.push(where('scheduledAt', '>=', Timestamp.fromDate(input.from)))
  }
  if (input.to) {
    constraints.push(where('scheduledAt', '<=', Timestamp.fromDate(input.to)))
  }
  const tokens = searchTokensForQuery(input.search)
  if (tokens.length > 0) {
    constraints.push(where('searchTokens', 'array-contains-any', tokens))
  }
  constraints.push(orderBy('scheduledAt', 'desc'))
  constraints.push(orderBy(documentId(), 'desc'))
  return constraints
}

export async function countAdminInterviews(
  input: AdminInterviewQuery = {},
): Promise<number> {
  const restrictions = buildConstraints(input).filter(
    (constraint) => constraint.type === 'where',
  )
  const snapshot = await getCountFromServer(
    query(interviews, ...restrictions),
  )
  return snapshot.data().count
}

export async function loadAdminInterviewMetrics(): Promise<AdminInterviewMetrics> {
  const now = Timestamp.now()
  try {
    const [total, upcoming, completed, cancelled, noShow] = await Promise.all([
      getCountFromServer(interviews),
      getCountFromServer(
        query(
          interviews,
          where('status', '==', 'scheduled'),
          where('scheduledAt', '>=', now),
        ),
      ),
      getCountFromServer(query(interviews, where('status', '==', 'completed'))),
      getCountFromServer(query(interviews, where('status', '==', 'cancelled'))),
      getCountFromServer(query(interviews, where('status', '==', 'no-show'))),
    ])
    return {
      total: total.data().count,
      upcoming: upcoming.data().count,
      completed: completed.data().count,
      cancelled: cancelled.data().count,
      noShow: noShow.data().count,
    }
  } catch {
    return { total: 0, upcoming: 0, completed: 0, cancelled: 0, noShow: 0 }
  }
}

export async function loadAdminInterviewsPage(
  input: AdminInterviewQuery = {},
): Promise<AdminInterviewPage> {
  const pageSize = Math.max(1, input.pageSize ?? 25)
  const constraints = buildConstraints(input)
  if (input.cursor) {
    constraints.push(
      startAfter(Timestamp.fromMillis(input.cursor.value), input.cursor.id),
    )
  }
  constraints.push(limit(pageSize + 1))

  const snapshot = await getDocs(query(interviews, ...constraints))
  const hasMore = snapshot.docs.length > pageSize
  const pageDocs = hasMore ? snapshot.docs.slice(0, pageSize) : snapshot.docs
  const lastDoc = pageDocs[pageDocs.length - 1]

  return {
    items: pageDocs.map((document) =>
      interviewFromId(document.id, document.data()),
    ),
    nextCursor: lastDoc ? cursorFromDocument(lastDoc) : null,
    hasMore,
  }
}

export async function loadAdminApplicationInterviews(
  applicationId: string,
): Promise<Interview[]> {
  const snapshot = await getDocs(
    query(
      interviews,
      where('applicationId', '==', applicationId),
      orderBy('scheduledAt', 'desc'),
    ),
  )
  return snapshot.docs.map((document) =>
    interviewFromId(document.id, document.data()),
  )
}

function cursorFromDocument(
  document: QueryDocumentSnapshot<DocumentData>,
): CursorValue {
  const value = document.get('scheduledAt') as FirestoreTimestamp | undefined
  return {
    value:
      value && typeof value.toMillis === 'function' ? value.toMillis() : 0,
    id: document.id,
  }
}

export function isInterviewStatus(value: string): value is InterviewStatus {
  return ['scheduled', 'completed', 'cancelled', 'no-show'].includes(value)
}

export function isInterviewType(value: string): value is InterviewType {
  return [
    'phone',
    'video',
    'onsite',
    'technical',
    'behavioral',
    'panel',
    'final',
    'other',
  ].includes(value)
}
