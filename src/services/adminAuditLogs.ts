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
  AdminAuditLog,
  AdminAuditLogDetail,
} from '@/types/admin'

export const AUDIT_ACTIONS = [
  'role-changed',
  'user-disabled',
  'user-enabled',
  'user-delete-requested',
  'user-deleted',
  'user-delete-failed',
  'admin-provisioned',
  'owner-provisioned',
  'budget-paused',
  'budget-resumed',
] as const

export interface AdminAuditLogQuery {
  action?: string
  actorUid?: string
  targetUid?: string
  cursor?: CursorValue | null
  pageSize?: number
}

export interface AdminAuditLogPage {
  items: AdminAuditLog[]
  nextCursor: CursorValue | null
  hasMore: boolean
}

const auditLogs = collection(db, collections.adminAuditLogs)

export async function countAdminAuditLogs(
  input: AdminAuditLogQuery = {},
): Promise<number> {
  const restrictions: QueryConstraint[] = []
  if (input.action) restrictions.push(where('action', '==', input.action))
  if (input.actorUid) restrictions.push(where('actorUid', '==', input.actorUid))
  if (input.targetUid) restrictions.push(where('targetUid', '==', input.targetUid))
  const snapshot = await getCountFromServer(query(auditLogs, ...restrictions))
  return snapshot.data().count
}

export async function loadAdminAuditLogsPage(
  input: AdminAuditLogQuery = {},
): Promise<AdminAuditLogPage> {
  const pageSize = Math.max(1, input.pageSize ?? 25)
  const constraints: QueryConstraint[] = []
  if (input.action) constraints.push(where('action', '==', input.action))
  if (input.actorUid) constraints.push(where('actorUid', '==', input.actorUid))
  if (input.targetUid) constraints.push(where('targetUid', '==', input.targetUid))
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

  const snapshot = await getDocs(query(auditLogs, ...constraints))
  const hasMore = snapshot.docs.length > pageSize
  const pageDocs = hasMore ? snapshot.docs.slice(0, pageSize) : snapshot.docs
  const lastDoc = pageDocs[pageDocs.length - 1]

  return {
    items: pageDocs.map((document) =>
      toAdminAuditLog(document.id, document.data()),
    ),
    nextCursor: lastDoc ? cursorFromDocument(lastDoc, 'createdAt') : null,
    hasMore,
  }
}

export async function loadAdminAuditLogDetail(
  auditId: string,
): Promise<AdminAuditLogDetail> {
  const snapshot = await getDoc(doc(db, collections.adminAuditLogs, auditId))
  if (!snapshot.exists()) {
    throw new Error('Audit entry not found.')
  }

  const data = snapshot.data()
  const actorUid = text(data.actorUid)
  const targetUid = text(data.targetUid)

  const [actorSnapshot, targetSnapshot] = await Promise.all([
    actorUid ? getDoc(doc(db, collections.users, actorUid)) : Promise.resolve(null),
    targetUid ? getDoc(doc(db, collections.users, targetUid)) : Promise.resolve(null),
  ])

  return {
    ...toAdminAuditLog(snapshot.id, data),
    actor:
      actorSnapshot?.exists()
        ? toAdminUser(actorSnapshot.id, actorSnapshot.data())
        : null,
    target:
      targetSnapshot?.exists()
        ? toAdminUser(targetSnapshot.id, targetSnapshot.data())
        : null,
  }
}

export function toAdminAuditLog(
  id: string,
  data: DocumentData,
): AdminAuditLog {
  return {
    id,
    actorUid: text(data.actorUid),
    actorType:
      data.actorType === 'cli' || data.actorType === 'admin'
        ? data.actorType
        : undefined,
    actorEmail: text(data.actorEmail) || undefined,
    targetUid: text(data.targetUid),
    targetEmail: text(data.targetEmail) || undefined,
    action: text(data.action) || 'unknown',
    reason: text(data.reason) || undefined,
    beforeRole: text(data.beforeRole) || undefined,
    afterRole: text(data.afterRole) || undefined,
    beforeDisabled:
      typeof data.beforeDisabled === 'boolean' ? data.beforeDisabled : undefined,
    afterDisabled:
      typeof data.afterDisabled === 'boolean' ? data.afterDisabled : undefined,
    metadata: isRecord(data.metadata) ? data.metadata : undefined,
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
