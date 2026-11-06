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
  AdminOpportunity,
  AdminOpportunityAnalysis,
  AdminOpportunityCompany,
  AdminOpportunityDetail,
} from '@/types/admin'

export interface AdminOpportunityQuery {
  search?: string
  status?: string
  source?: string
  userId?: string
  cursor?: CursorValue | null
  pageSize?: number
}

export interface AdminOpportunityPage {
  items: AdminOpportunity[]
  nextCursor: CursorValue | null
  hasMore: boolean
}

const jobs = collection(db, collections.jobs)

function buildConstraints(input: AdminOpportunityQuery): QueryConstraint[] {
  const constraints: QueryConstraint[] = []
  if (input.userId) constraints.push(where('userId', '==', input.userId))
  if (input.status) constraints.push(where('status', '==', input.status))
  if (input.source) constraints.push(where('source', '==', input.source))
  const tokens = searchTokensForQuery(input.search)
  if (tokens.length > 0) {
    constraints.push(where('searchTokens', 'array-contains-any', tokens))
  }
  constraints.push(orderBy('discoveredAt', 'desc'))
  constraints.push(orderBy(documentId(), 'asc'))
  return constraints
}

export async function loadAdminOpportunitiesPage(
  input: AdminOpportunityQuery = {},
): Promise<AdminOpportunityPage> {
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

  const snapshot = await getDocs(query(jobs, ...constraints))
  const hasMore = snapshot.docs.length > pageSize
  const pageDocs = hasMore ? snapshot.docs.slice(0, pageSize) : snapshot.docs
  const lastDoc = pageDocs[pageDocs.length - 1]

  return {
    items: pageDocs.map((document) =>
      toAdminOpportunity(document.id, document.data()),
    ),
    nextCursor: lastDoc ? cursorFromDocument(lastDoc) : null,
    hasMore,
  }
}

export async function loadAdminOpportunityDetail(
  jobId: string,
): Promise<AdminOpportunityDetail> {
  const jobSnapshot = await getDoc(doc(db, collections.jobs, jobId))
  if (!jobSnapshot.exists()) {
    throw new Error('Opportunity not found.')
  }

  const data = jobSnapshot.data()
  const userId = text(data.userId)
  const companyId = text(data.companyId)

  const [userSnapshot, companySnapshot, analysisSnapshot] = await Promise.all([
    userId ? getDoc(doc(db, collections.users, userId)) : Promise.resolve(null),
    companyId ? getDoc(doc(db, collections.companies, companyId)) : Promise.resolve(null),
    userId
      ? getDocs(
          query(
            collection(db, collections.jobAnalyses),
            where('userId', '==', userId),
            where('jobId', '==', jobId),
            orderBy('analyzedAt', 'desc'),
            limit(1),
          ),
        )
      : Promise.resolve(null),
  ])

  const analysisData = analysisSnapshot?.docs[0]?.data()

  return {
    ...toAdminOpportunity(jobSnapshot.id, data),
    description: text(data.description),
    user:
      userSnapshot?.exists()
        ? toAdminUser(userSnapshot.id, userSnapshot.data())
        : null,
    analysis: analysisData ? toAdminAnalysis(analysisData) : null,
    company:
      companySnapshot?.exists() ? toAdminCompany(companySnapshot.data()) : null,
  }
}

function cursorFromDocument(
  document: QueryDocumentSnapshot<DocumentData>,
): CursorValue {
  const value = document.get('discoveredAt') as FirestoreTimestamp | undefined
  return {
    value:
      value && typeof value.toMillis === 'function' ? value.toMillis() : 0,
    id: document.id,
  }
}

function toAdminOpportunity(
  id: string,
  data: DocumentData,
): AdminOpportunity {
  return {
    id,
    userId: text(data.userId),
    title: text(data.title),
    companyName: text(data.companyName),
    source: text(data.source) || 'custom',
    status: text(data.status) || 'new',
    location: text(data.location) || undefined,
    remote: data.remote === true,
    discoveredAt: data.discoveredAt as Timestamp | undefined,
    skills: stringArray(data.skills),
    applicationUrl: text(data.applicationUrl),
  }
}

function toAdminAnalysis(data: DocumentData): AdminOpportunityAnalysis {
  return {
    fitScore: typeof data.fitScore === 'number' ? data.fitScore : undefined,
    summary: text(data.summary),
    matchedSkills: stringArray(data.matchedSkills),
    missingSkills: stringArray(data.missingSkills),
    concerns: stringArray(data.concerns),
  }
}

function toAdminCompany(data: DocumentData): AdminOpportunityCompany {
  return {
    name: text(data.name),
    industry: text(data.industry) || undefined,
    description: text(data.description) || undefined,
    researchSummary: text(data.researchSummary) || undefined,
    website: text(data.website) || undefined,
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
