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
import { searchTokensForQuery } from '@/lib/searchTokens'
import type { CursorValue } from '@/lib/cursorPagination'
import type { AdminFollowUp, AdminOutreach, AdminOutreachDetail } from '@/types/admin'

export interface AdminOutreachQuery {
  search?: string
  status?: string
  userId?: string
  cursor?: CursorValue | null
  pageSize?: number
}

export interface AdminOutreachPage {
  items: AdminOutreach[]
  nextCursor: CursorValue | null
  hasMore: boolean
}

export interface AdminOutreachMetrics {
  total: number
  sent: number
  needsReview: number
  replied: number
  followUpDue: number
  draft: number
}

export async function loadAdminOutreachMetrics(): Promise<AdminOutreachMetrics> {
  const outreachCol = collection(db, collections.outreach)
  try {
    const [
      totalSnap,
      sentSnap,
      needsReviewSnap,
      repliedSnap,
      followUpDueSnap,
      draftSnap,
      scheduledSnap,
    ] = await Promise.all([
      getCountFromServer(outreachCol),
      getCountFromServer(query(outreachCol, where('status', '==', 'sent'))),
      getCountFromServer(query(outreachCol, where('status', '==', 'needs-review'))),
      getCountFromServer(query(outreachCol, where('status', '==', 'replied'))),
      getCountFromServer(query(outreachCol, where('status', '==', 'follow-up-due'))),
      getCountFromServer(query(outreachCol, where('status', '==', 'draft'))),
      getCountFromServer(query(outreachCol, where('status', '==', 'scheduled'))),
    ])

    return {
      total: totalSnap.data().count,
      sent: sentSnap.data().count + scheduledSnap.data().count,
      needsReview: needsReviewSnap.data().count,
      replied: repliedSnap.data().count,
      followUpDue: followUpDueSnap.data().count,
      draft: draftSnap.data().count,
    }
  } catch (error) {
    console.error('Failed to load outreach metrics', error)
    return {
      total: 0,
      sent: 0,
      needsReview: 0,
      replied: 0,
      followUpDue: 0,
      draft: 0,
    }
  }
}

const outreach = collection(db, collections.outreach)
const followUps = collection(db, collections.followUps)

function buildConstraints(input: AdminOutreachQuery): QueryConstraint[] {
  const constraints: QueryConstraint[] = []
  if (input.userId) constraints.push(where('userId', '==', input.userId))
  if (input.status) constraints.push(where('status', '==', input.status))
  const tokens = searchTokensForQuery(input.search)
  if (tokens.length > 0) {
    constraints.push(where('searchTokens', 'array-contains-any', tokens))
  }
  constraints.push(orderBy('updatedAt', 'desc'))
  constraints.push(orderBy(documentId(), 'desc'))
  return constraints
}

export async function countAdminOutreach(
  input: AdminOutreachQuery = {},
): Promise<number> {
  const restrictions = buildConstraints(input).filter(
    (constraint) => constraint.type === 'where',
  )
  const snapshot = await getCountFromServer(
    query(outreach, ...restrictions),
  )
  return snapshot.data().count
}

export async function loadAdminOutreachPage(
  input: AdminOutreachQuery = {},
): Promise<AdminOutreachPage> {
  const pageSize = Math.max(1, input.pageSize ?? 25)
  const constraints = buildConstraints(input)
  if (input.cursor) {
    constraints.push(
      startAfter(
        Timestamp.fromMillis(input.cursor.value),
        input.cursor.id,
      ),
    )
  }
  constraints.push(limit(pageSize + 1))

  const snapshot = await getDocs(query(outreach, ...constraints))
  const hasMore = snapshot.docs.length > pageSize
  const pageDocs = hasMore ? snapshot.docs.slice(0, pageSize) : snapshot.docs
  const lastDoc = pageDocs[pageDocs.length - 1]

  return {
    items: pageDocs.map((document) =>
      toAdminOutreach(document.id, document.data()),
    ),
    nextCursor: lastDoc ? cursorFromDocument(lastDoc, 'updatedAt') : null,
    hasMore,
  }
}

export async function loadAdminOutreachDetail(
  outreachId: string,
): Promise<AdminOutreachDetail> {
  const outreachSnapshot = await getDoc(doc(db, collections.outreach, outreachId))
  if (!outreachSnapshot.exists()) {
    throw new Error('Outreach not found.')
  }

  const data = outreachSnapshot.data()
  const userId = text(data.userId)

  const [userSnapshot, followUpSnapshot] = await Promise.all([
    userId ? getDoc(doc(db, collections.users, userId)) : Promise.resolve(null),
    userId
      ? getDocs(
          query(
            followUps,
            where('userId', '==', userId),
            where('outreachId', '==', outreachId),
            orderBy('sequence', 'asc'),
          ),
        )
      : Promise.resolve(null),
  ])

  return {
    ...toAdminOutreach(outreachSnapshot.id, data),
    body: text(data.body),
    draftSubject: text(data.draftSubject) || text(data.subject),
    draftBody: text(data.draftBody) || text(data.body),
    aiProvider: text(data.aiProvider) || undefined,
    model: text(data.model) || undefined,
    promptVersion: text(data.promptVersion) || undefined,
    approvedAt: optionalTimestamp(data.approvedAt),
    scheduledAt: optionalTimestamp(data.scheduledAt),
    replyAt: optionalTimestamp(data.replyAt),
    closedAt: optionalTimestamp(data.closedAt),
    closedReason: text(data.closedReason) || undefined,
    sentManually: data.sentManually === true,
    lastFollowUpAt: optionalTimestamp(data.lastFollowUpAt),
    user:
      userSnapshot?.exists()
        ? toAdminUser(userSnapshot.id, userSnapshot.data())
        : null,
    followUps: (followUpSnapshot?.docs ?? []).map((document) =>
      toAdminFollowUp(document.id, document.data()),
    ),
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

function toAdminOutreach(id: string, data: DocumentData): AdminOutreach {
  return {
    id,
    userId: text(data.userId),
    jobId: text(data.jobId),
    companyId: text(data.companyId),
    companyName: text(data.companyName) || undefined,
    jobTitle: text(data.jobTitle) || undefined,
    contactName: text(data.contactName) || undefined,
    contactEmail: text(data.contactEmail) || undefined,
    subject: text(data.subject),
    status: text(data.status) || 'draft',
    followUpCount:
      typeof data.followUpCount === 'number' ? data.followUpCount : 0,
    sentAt: optionalTimestamp(data.sentAt),
    updatedAt: optionalTimestamp(data.updatedAt),
    createdAt: optionalTimestamp(data.createdAt),
  }
}

function toAdminFollowUp(id: string, data: DocumentData): AdminFollowUp {
  return {
    id,
    sequence: typeof data.sequence === 'number' ? data.sequence : 0,
    status: text(data.status) || 'pending',
    scheduledFor: optionalTimestamp(data.scheduledFor),
    scheduledAt:
      optionalTimestamp(data.scheduledAt) ?? optionalTimestamp(data.scheduledFor),
    draftSubject: text(data.draftSubject) || undefined,
    draftBody: text(data.draftBody) || undefined,
    notes: text(data.notes) || undefined,
    body: text(data.body) || text(data.draftBody) || undefined,
    approvedAt: optionalTimestamp(data.approvedAt),
    sentAt: optionalTimestamp(data.sentAt),
    createdAt: optionalTimestamp(data.createdAt),
  }
}

function optionalTimestamp(value: unknown): Timestamp | undefined {
  return value ? (value as Timestamp) : undefined
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : ''
}
