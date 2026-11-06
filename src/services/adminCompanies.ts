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
import type {
  AdminCompany,
  AdminCompanyApplication,
  AdminCompanyContact,
  AdminCompanyDetail,
  AdminCompanyOpportunity,
  AdminCompanyOutreach,
} from '@/types/admin'

export type AdminCompanyResearchFilter = 'all' | 'researched' | 'unresearched'

export interface AdminCompanyMetrics {
  total: number
  researched: number
  unresearched: number
  withJobs: number
}

export async function loadAdminCompanyMetrics(): Promise<AdminCompanyMetrics> {
  const companiesCol = collection(db, collections.companies)

  try {
    const [totalSnap, researchedSnap, unresearchedSnap, withJobsSnap] =
      await Promise.all([
        getCountFromServer(companiesCol),
        getCountFromServer(query(companiesCol, where('researched', '==', true))),
        getCountFromServer(query(companiesCol, where('researched', '==', false))),
        getCountFromServer(query(companiesCol, where('jobCount', '>', 0))),
      ])

    return {
      total: totalSnap.data().count,
      researched: researchedSnap.data().count,
      unresearched: unresearchedSnap.data().count,
      withJobs: withJobsSnap.data().count,
    }
  } catch (error) {
    console.error('Failed to load company metrics', error)
    return {
      total: 0,
      researched: 0,
      unresearched: 0,
      withJobs: 0,
    }
  }
}

export interface AdminCompanyQuery {
  search?: string
  research?: AdminCompanyResearchFilter
  userId?: string
  cursor?: CursorValue | null
  pageSize?: number
}

export interface AdminCompanyPage {
  items: AdminCompany[]
  nextCursor: CursorValue | null
  hasMore: boolean
}

const companies = collection(db, collections.companies)

function buildConstraints(input: AdminCompanyQuery): QueryConstraint[] {
  const constraints: QueryConstraint[] = []
  if (input.userId) constraints.push(where('userId', '==', input.userId))
  if (input.research === 'researched') {
    constraints.push(where('researched', '==', true))
  } else if (input.research === 'unresearched') {
    constraints.push(where('researched', '==', false))
  }
  const tokens = searchTokensForQuery(input.search)
  if (tokens.length > 0) {
    constraints.push(where('searchTokens', 'array-contains-any', tokens))
  }
  constraints.push(orderBy('updatedAt', 'desc'))
  constraints.push(orderBy(documentId(), 'desc'))
  return constraints
}

export async function loadAdminCompaniesPage(
  input: AdminCompanyQuery = {},
): Promise<AdminCompanyPage> {
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

  const snapshot = await getDocs(query(companies, ...constraints))
  const hasMore = snapshot.docs.length > pageSize
  const pageDocs = hasMore ? snapshot.docs.slice(0, pageSize) : snapshot.docs
  const lastDoc = pageDocs[pageDocs.length - 1]

  return {
    items: pageDocs.map((document) =>
      toAdminCompany(document.id, document.data()),
    ),
    nextCursor: lastDoc ? cursorFromDocument(lastDoc, 'updatedAt') : null,
    hasMore,
  }
}

export async function loadAdminCompanyDetail(
  companyId: string,
): Promise<AdminCompanyDetail> {
  const companySnapshot = await getDoc(doc(db, collections.companies, companyId))
  if (!companySnapshot.exists()) {
    throw new Error('Company not found.')
  }

  const data = companySnapshot.data()
  const userId = text(data.userId)

  const [userSnapshot, jobsSnapshot, applicationsSnapshot, outreachSnapshot, contactsSnapshot] =
    await Promise.all([
      userId ? getDoc(doc(db, collections.users, userId)) : Promise.resolve(null),
      userId
        ? getDocs(
            query(
              collection(db, collections.jobs),
              where('userId', '==', userId),
              where('companyId', '==', companyId),
              orderBy('discoveredAt', 'desc'),
              limit(25),
            ),
          )
        : Promise.resolve(null),
      userId
        ? getDocs(
            query(
              collection(db, collections.applications),
              where('userId', '==', userId),
              where('companyId', '==', companyId),
              orderBy('updatedAt', 'desc'),
              limit(25),
            ),
          )
        : Promise.resolve(null),
      userId
        ? getDocs(
            query(
              collection(db, collections.outreach),
              where('userId', '==', userId),
              where('companyId', '==', companyId),
              orderBy('updatedAt', 'desc'),
              limit(25),
            ),
          )
        : Promise.resolve(null),
      userId
        ? getDocs(
            query(
              collection(db, collections.contacts),
              where('userId', '==', userId),
              where('companyId', '==', companyId),
              limit(50),
            ),
          )
        : Promise.resolve(null),
    ])

  return {
    ...toAdminCompany(companySnapshot.id, data),
    website: text(data.website) || undefined,
    description: text(data.description) || undefined,
    product: text(data.product) || undefined,
    roleContext: text(data.roleContext) || undefined,
    hiringSignals: stringArray(data.hiringSignals),
    researchSummary: text(data.researchSummary) || undefined,
    sourceUrls: stringArray(data.sourceUrls),
    lastSeenAt: optionalTimestamp(data.lastSeenAt),
    lastResearchedAt: optionalTimestamp(data.lastResearchedAt),
    createdAt: optionalTimestamp(data.createdAt),
    user:
      userSnapshot?.exists()
        ? toAdminUser(userSnapshot.id, userSnapshot.data())
        : null,
    opportunities: (jobsSnapshot?.docs ?? []).map((document) =>
      toAdminCompanyOpportunity(document.id, document.data()),
    ),
    applications: (applicationsSnapshot?.docs ?? []).map((document) =>
      toAdminCompanyApplication(document.id, document.data()),
    ),
    outreach: (outreachSnapshot?.docs ?? []).map((document) =>
      toAdminCompanyOutreach(document.id, document.data()),
    ),
    contacts: (contactsSnapshot?.docs ?? []).map((document) =>
      toAdminCompanyContact(document.id, document.data()),
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

function toAdminCompany(id: string, data: DocumentData): AdminCompany {
  return {
    id,
    userId: text(data.userId),
    name: text(data.name) || 'Unknown company',
    industry: text(data.industry) || undefined,
    location: text(data.location) || undefined,
    researched: data.researched === true || Boolean(data.lastResearchedAt),
    jobCount: typeof data.jobCount === 'number' ? data.jobCount : 0,
    updatedAt: optionalTimestamp(data.updatedAt),
  }
}

function toAdminCompanyOpportunity(
  id: string,
  data: DocumentData,
): AdminCompanyOpportunity {
  return {
    id,
    title: text(data.title),
    status: text(data.status) || 'new',
    source: text(data.source) || 'custom',
    discoveredAt: optionalTimestamp(data.discoveredAt),
  }
}

function toAdminCompanyApplication(
  id: string,
  data: DocumentData,
): AdminCompanyApplication {
  return {
    id,
    jobTitle: text(data.jobTitle),
    status: text(data.status) || 'not-started',
    updatedAt: optionalTimestamp(data.updatedAt),
  }
}

function toAdminCompanyOutreach(
  id: string,
  data: DocumentData,
): AdminCompanyOutreach {
  return {
    id,
    jobTitle: text(data.jobTitle) || undefined,
    subject: text(data.subject),
    status: text(data.status) || 'draft',
    updatedAt: optionalTimestamp(data.updatedAt),
  }
}

function toAdminCompanyContact(
  id: string,
  data: DocumentData,
): AdminCompanyContact {
  return {
    id,
    name: text(data.name) || undefined,
    email: text(data.email) || undefined,
    role: text(data.role) || undefined,
    verified: data.verified === true,
    confidence: text(data.confidence) || undefined,
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
