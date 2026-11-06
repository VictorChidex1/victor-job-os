import {
  collection,
  doc,
  getCountFromServer,
  getDoc,
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
import type {
  AdminOverview,
  AdminUserApplication,
  AdminUserCompany,
  AdminUserDetail,
  AdminUserJob,
  AdminUserOutreach,
  AdminUserProfile,
  AdminUserResume,
  AdminUserSummary,
} from '@/types/admin'
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

export async function loadAdminUserDetail(uid: string): Promise<AdminUserDetail> {
  const userSnapshot = await getDoc(doc(db, collections.users, uid))
  if (!userSnapshot.exists()) {
    throw new Error('User not found.')
  }

  const [
    profileSnapshot,
    opportunityCount,
    applicationCount,
    outreachCount,
    companyCount,
    resumeCount,
    opportunities,
    applications,
    outreach,
    companies,
    resumes,
  ] = await Promise.all([
    getDoc(doc(db, collections.profiles, uid)),
    getCountFromServer(
      query(collection(db, collections.jobs), where('userId', '==', uid)),
    ),
    getCountFromServer(
      query(collection(db, collections.applications), where('userId', '==', uid)),
    ),
    getCountFromServer(
      query(collection(db, collections.outreach), where('userId', '==', uid)),
    ),
    getCountFromServer(
      query(collection(db, collections.companies), where('userId', '==', uid)),
    ),
    getCountFromServer(
      query(
        collection(db, collections.resumeVariants),
        where('userId', '==', uid),
      ),
    ),
    getDocs(
      query(
        collection(db, collections.jobs),
        where('userId', '==', uid),
        orderBy('discoveredAt', 'desc'),
        limit(20),
      ),
    ),
    getDocs(
      query(
        collection(db, collections.applications),
        where('userId', '==', uid),
        orderBy('updatedAt', 'desc'),
        limit(20),
      ),
    ),
    getDocs(
      query(
        collection(db, collections.outreach),
        where('userId', '==', uid),
        orderBy('updatedAt', 'desc'),
        limit(20),
      ),
    ),
    getDocs(
      query(
        collection(db, collections.companies),
        where('userId', '==', uid),
        orderBy('updatedAt', 'desc'),
        limit(20),
      ),
    ),
    getDocs(
      query(
        collection(db, collections.resumeVariants),
        where('userId', '==', uid),
        orderBy('updatedAt', 'desc'),
        limit(20),
      ),
    ),
  ])

  return {
    user: toAdminUser(userSnapshot.id, userSnapshot.data()),
    profile: profileSnapshot.exists()
      ? toAdminProfile(profileSnapshot.data())
      : null,
    counts: {
      opportunities: opportunityCount.data().count,
      applications: applicationCount.data().count,
      outreach: outreachCount.data().count,
      companies: companyCount.data().count,
      resumes: resumeCount.data().count,
    },
    opportunities: opportunities.docs.map((document) =>
      toAdminJob(document.id, document.data()),
    ),
    applications: applications.docs.map((document) =>
      toAdminApplication(document.id, document.data()),
    ),
    outreach: outreach.docs.map((document) =>
      toAdminOutreach(document.id, document.data()),
    ),
    companies: companies.docs.map((document) =>
      toAdminCompany(document.id, document.data()),
    ),
    resumes: resumes.docs.map((document) =>
      toAdminResume(document.id, document.data()),
    ),
  }
}

function toAdminProfile(data: DocumentData): AdminUserProfile {
  return {
    headline: text(data.headline),
    summary: text(data.summary),
    experienceLevel: text(data.experienceLevel),
    skills: verifiedValues(data.skills),
    technologies: verifiedValues(data.technologies),
    preferredRoles: stringArray(data.preferredRoles),
    preferredLocations: stringArray(data.preferredLocations),
    portfolioUrl: text(data.portfolioUrl) || undefined,
    resumeUrl: text(data.resumeUrl) || undefined,
    updatedAt: data.updatedAt as FirestoreTimestamp | undefined,
  }
}

function toAdminJob(id: string, data: DocumentData): AdminUserJob {
  return {
    id,
    title: text(data.title),
    companyName: text(data.companyName),
    source: text(data.source) || 'custom',
    status: text(data.status) || 'new',
    discoveredAt: data.discoveredAt as FirestoreTimestamp | undefined,
  }
}

function toAdminApplication(
  id: string,
  data: DocumentData,
): AdminUserApplication {
  return {
    id,
    jobTitle: text(data.jobTitle),
    companyName: text(data.companyName),
    status: text(data.status) || 'not-started',
    nextAction: text(data.nextAction) || undefined,
    updatedAt: data.updatedAt as FirestoreTimestamp | undefined,
  }
}

function toAdminOutreach(
  id: string,
  data: DocumentData,
): AdminUserOutreach {
  return {
    id,
    jobTitle: text(data.jobTitle) || undefined,
    companyName: text(data.companyName),
    status: text(data.status) || 'draft',
    sentAt: data.sentAt as FirestoreTimestamp | undefined,
    updatedAt: data.updatedAt as FirestoreTimestamp | undefined,
  }
}

function toAdminCompany(
  id: string,
  data: DocumentData,
): AdminUserCompany {
  return {
    id,
    name: text(data.name),
    industry: text(data.industry) || undefined,
    researched: data.researched === true,
    jobCount: typeof data.jobCount === 'number' ? data.jobCount : 0,
  }
}

function toAdminResume(
  id: string,
  data: DocumentData,
): AdminUserResume {
  return {
    id,
    name: text(data.name),
    resumeUrl: text(data.resumeUrl),
    isDefault: data.isDefault === true,
  }
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : []
}

function verifiedValues(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== 'object') return []
    const record = entry as Record<string, unknown>
    const item = text(record.value)
    return item ? [item] : []
  })
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
