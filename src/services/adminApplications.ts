import {
  collection,
  doc,
  documentId,
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
import type {
  AdminApplication,
  AdminApplicationDetail,
  AdminApplicationEvent,
} from '@/types/admin'

export interface AdminApplicationQuery {
  search?: string
  status?: string
  userId?: string
  cursor?: CursorValue | null
  pageSize?: number
}

export interface AdminApplicationPage {
  items: AdminApplication[]
  nextCursor: CursorValue | null
  hasMore: boolean
}

const applications = collection(db, collections.applications)
const applicationEvents = collection(db, collections.applicationEvents)

function buildConstraints(input: AdminApplicationQuery): QueryConstraint[] {
  const constraints: QueryConstraint[] = []
  if (input.userId) constraints.push(where('userId', '==', input.userId))
  if (input.status) constraints.push(where('status', '==', input.status))
  const tokens = searchTokensForQuery(input.search)
  if (tokens.length > 0) {
    constraints.push(where('searchTokens', 'array-contains-any', tokens))
  }
  constraints.push(orderBy('updatedAt', 'desc'))
  constraints.push(orderBy(documentId(), 'asc'))
  return constraints
}

export async function loadAdminApplicationsPage(
  input: AdminApplicationQuery = {},
): Promise<AdminApplicationPage> {
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

  const snapshot = await getDocs(query(applications, ...constraints))
  const hasMore = snapshot.docs.length > pageSize
  const pageDocs = hasMore ? snapshot.docs.slice(0, pageSize) : snapshot.docs
  const lastDoc = pageDocs[pageDocs.length - 1]

  return {
    items: pageDocs.map((document) =>
      toAdminApplication(document.id, document.data()),
    ),
    nextCursor: lastDoc ? cursorFromDocument(lastDoc, 'updatedAt') : null,
    hasMore,
  }
}

export async function loadAdminApplicationDetail(
  applicationId: string,
): Promise<AdminApplicationDetail> {
  const applicationSnapshot = await getDoc(
    doc(db, collections.applications, applicationId),
  )
  if (!applicationSnapshot.exists()) {
    throw new Error('Application not found.')
  }

  const data = applicationSnapshot.data()
  const userId = text(data.userId)

  const [userSnapshot, eventSnapshot] = await Promise.all([
    userId ? getDoc(doc(db, collections.users, userId)) : Promise.resolve(null),
    userId
      ? getDocs(
          query(
            applicationEvents,
            where('userId', '==', userId),
            where('applicationId', '==', applicationId),
            orderBy('createdAt', 'desc'),
          ),
        )
      : Promise.resolve(null),
  ])

  return {
    ...toAdminApplication(applicationSnapshot.id, data),
    applicationUrl: text(data.applicationUrl),
    approvedAt: optionalTimestamp(data.approvedAt),
    submittedAt: optionalTimestamp(data.submittedAt),
    submittedManually: data.submittedManually === true,
    closedAt: optionalTimestamp(data.closedAt),
    user:
      userSnapshot?.exists()
        ? toAdminUser(userSnapshot.id, userSnapshot.data())
        : null,
    events: (eventSnapshot?.docs ?? []).map((document) =>
      toAdminApplicationEvent(document.id, document.data()),
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

function toAdminApplication(id: string, data: DocumentData): AdminApplication {
  return {
    id,
    userId: text(data.userId),
    jobId: text(data.jobId),
    companyId: text(data.companyId),
    companyName: text(data.companyName),
    jobTitle: text(data.jobTitle),
    jobSource: text(data.jobSource) || 'custom',
    status: text(data.status) || 'not-started',
    outcome: text(data.outcome) || undefined,
    origin: text(data.origin) || 'opportunity',
    location: text(data.location) || undefined,
    remote: data.remote === true,
    nextAction: text(data.nextAction) || undefined,
    nextActionAt: optionalTimestamp(data.nextActionAt),
    notes: text(data.notes) || undefined,
    resumeVariantName: text(data.resumeVariantName) || undefined,
    resumeUrl: text(data.resumeUrl) || undefined,
    contactId: text(data.contactId) || undefined,
    createdAt: optionalTimestamp(data.createdAt),
    updatedAt: optionalTimestamp(data.updatedAt),
  }
}

function toAdminApplicationEvent(
  id: string,
  data: DocumentData,
): AdminApplicationEvent {
  return {
    id,
    type: text(data.type) || 'status-changed',
    fromStatus: text(data.fromStatus) || undefined,
    toStatus: text(data.toStatus) || undefined,
    note: text(data.note) || undefined,
    createdAt: optionalTimestamp(data.createdAt),
  }
}

function optionalTimestamp(value: unknown): Timestamp | undefined {
  return value ? (value as Timestamp) : undefined
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : ''
}
