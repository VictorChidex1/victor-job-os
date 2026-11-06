import {
  collection,
  getCountFromServer,
  getDocs,
  limit,
  orderBy,
  query,
  Timestamp,
  where,
  type DocumentData,
  type Timestamp as FirestoreTimestamp,
} from 'firebase/firestore'
import { db } from '@/services/firestore'
import { collections } from '@/services/collections'
import type { AdminOverview, AdminUserSummary } from '@/types/admin'
import type { UserRole } from '@/types/users'

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

export async function loadAdminOverview(): Promise<AdminOverview> {
  const weekAgo = Timestamp.fromDate(new Date(Date.now() - WEEK_MS))

  const [
    userCount,
    newUsersThisWeek,
    jobCount,
    applicationCount,
    outreachCount,
    companyCount,
    recentUsers,
  ] = await Promise.all([
    getCountFromServer(collection(db, collections.users)),
    getCountFromServer(
      query(
        collection(db, collections.users),
        where('createdAt', '>=', weekAgo),
      ),
    ),
    getCountFromServer(collection(db, collections.jobs)),
    getCountFromServer(collection(db, collections.applications)),
    getCountFromServer(collection(db, collections.outreach)),
    getCountFromServer(collection(db, collections.companies)),
    getDocs(
      query(
        collection(db, collections.users),
        orderBy('createdAt', 'desc'),
        limit(8),
      ),
    ),
  ])

  return {
    userCount: userCount.data().count,
    newUsersThisWeek: newUsersThisWeek.data().count,
    jobCount: jobCount.data().count,
    applicationCount: applicationCount.data().count,
    outreachCount: outreachCount.data().count,
    companyCount: companyCount.data().count,
    recentUsers: recentUsers.docs.map((document) =>
      toAdminUser(document.id, document.data()),
    ),
  }
}

export async function loadAdminUsers(): Promise<AdminUserSummary[]> {
  const snapshot = await getDocs(
    query(
      collection(db, collections.users),
      orderBy('createdAt', 'desc'),
      limit(200),
    ),
  )
  return snapshot.docs.map((document) =>
    toAdminUser(document.id, document.data()),
  )
}

function toAdminUser(id: string, data: DocumentData): AdminUserSummary {
  return {
    id,
    email: typeof data.email === 'string' ? data.email : null,
    displayName:
      typeof data.displayName === 'string' ? data.displayName : null,
    role: isUserRole(data.role) ? data.role : 'user',
    createdAt: data.createdAt as FirestoreTimestamp | undefined,
  }
}

function isUserRole(value: unknown): value is UserRole {
  return value === 'owner' || value === 'admin' || value === 'user'
}
