import {
  collection,
  getCountFromServer,
  getDocs,
  limit,
  orderBy,
  query,
  type DocumentData,
  type Timestamp,
} from 'firebase/firestore'
import { db } from '@/services/firestore'
import { collections } from '@/services/collections'
import type { AdminOverview, AdminUserSummary } from '@/types/admin'
import type { UserRole } from '@/types/users'

export async function loadAdminOverview(): Promise<AdminOverview> {
  const [
    userCount,
    jobCount,
    applicationCount,
    outreachCount,
    companyCount,
    recentUsers,
  ] = await Promise.all([
    getCountFromServer(collection(db, collections.users)),
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
    jobCount: jobCount.data().count,
    applicationCount: applicationCount.data().count,
    outreachCount: outreachCount.data().count,
    companyCount: companyCount.data().count,
    recentUsers: recentUsers.docs.map((document) =>
      toAdminUser(document.id, document.data()),
    ),
  }
}

function toAdminUser(id: string, data: DocumentData): AdminUserSummary {
  return {
    id,
    email: typeof data.email === 'string' ? data.email : null,
    displayName:
      typeof data.displayName === 'string' ? data.displayName : null,
    role: isUserRole(data.role) ? data.role : 'user',
    createdAt: data.createdAt as Timestamp | undefined,
  }
}

function isUserRole(value: unknown): value is UserRole {
  return value === 'owner' || value === 'admin' || value === 'user'
}
