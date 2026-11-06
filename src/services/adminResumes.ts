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
import type { AdminResume, AdminResumeDetail } from '@/types/admin'

export type AdminResumeDefaultFilter = 'all' | 'default' | 'non-default'

export interface AdminResumeMetrics {
  total: number
  defaultBaselines: number
  tailoredVariants: number
}

export async function loadAdminResumeMetrics(): Promise<AdminResumeMetrics> {
  const resumesCol = collection(db, collections.resumeVariants)

  try {
    const [totalSnap, defaultSnap, tailoredSnap] = await Promise.all([
      getCountFromServer(resumesCol),
      getCountFromServer(query(resumesCol, where('isDefault', '==', true))),
      getCountFromServer(query(resumesCol, where('isDefault', '==', false))),
    ])

    return {
      total: totalSnap.data().count,
      defaultBaselines: defaultSnap.data().count,
      tailoredVariants: tailoredSnap.data().count,
    }
  } catch (error) {
    console.error('Failed to load resume metrics', error)
    return {
      total: 0,
      defaultBaselines: 0,
      tailoredVariants: 0,
    }
  }
}

export interface AdminResumeQuery {
  search?: string
  defaultFilter?: AdminResumeDefaultFilter
  userId?: string
  cursor?: CursorValue | null
  pageSize?: number
}

export interface AdminResumePage {
  items: AdminResume[]
  nextCursor: CursorValue | null
  hasMore: boolean
}

const resumeVariants = collection(db, collections.resumeVariants)

function buildConstraints(input: AdminResumeQuery): QueryConstraint[] {
  const constraints: QueryConstraint[] = []
  if (input.userId) constraints.push(where('userId', '==', input.userId))
  if (input.defaultFilter === 'default') {
    constraints.push(where('isDefault', '==', true))
  } else if (input.defaultFilter === 'non-default') {
    constraints.push(where('isDefault', '==', false))
  }
  const tokens = searchTokensForQuery(input.search)
  if (tokens.length > 0) {
    constraints.push(where('searchTokens', 'array-contains-any', tokens))
  }
  constraints.push(orderBy('updatedAt', 'desc'))
  constraints.push(orderBy(documentId(), 'desc'))
  return constraints
}

export async function loadAdminResumesPage(
  input: AdminResumeQuery = {},
): Promise<AdminResumePage> {
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

  const snapshot = await getDocs(query(resumeVariants, ...constraints))
  const hasMore = snapshot.docs.length > pageSize
  const pageDocs = hasMore ? snapshot.docs.slice(0, pageSize) : snapshot.docs
  const lastDoc = pageDocs[pageDocs.length - 1]

  return {
    items: pageDocs.map((document) =>
      toAdminResume(document.id, document.data()),
    ),
    nextCursor: lastDoc ? cursorFromDocument(lastDoc, 'updatedAt') : null,
    hasMore,
  }
}

export async function loadAdminResumeDetail(
  resumeId: string,
): Promise<AdminResumeDetail> {
  const snapshot = await getDoc(doc(db, collections.resumeVariants, resumeId))
  if (!snapshot.exists()) {
    throw new Error('Resume variant not found.')
  }

  const data = snapshot.data()
  const userId = text(data.userId)
  const userSnapshot = userId
    ? await getDoc(doc(db, collections.users, userId))
    : null

  return {
    ...toAdminResume(snapshot.id, data),
    resumeUrl: text(data.resumeUrl),
    notes: text(data.notes),
    user:
      userSnapshot?.exists()
        ? toAdminUser(userSnapshot.id, userSnapshot.data())
        : null,
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

function toAdminResume(id: string, data: DocumentData): AdminResume {
  return {
    id,
    userId: text(data.userId),
    name: text(data.name) || 'Untitled resume',
    targetRoles: stringArray(data.targetRoles),
    technologies: stringArray(data.technologies),
    isDefault: data.isDefault === true,
    createdAt: optionalTimestamp(data.createdAt),
    updatedAt: optionalTimestamp(data.updatedAt),
  }
}

function optionalTimestamp(value: unknown): Timestamp | undefined {
  return value ? (value as Timestamp) : undefined
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : []
}
