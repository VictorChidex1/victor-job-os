import {
  collection,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  where,
  type DocumentData,
  type QueryConstraint,
  type Timestamp,
} from 'firebase/firestore'
import { db } from '@/services/firestore'
import { collections } from '@/services/collections'
import { toAdminUser } from '@/services/admin'
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
  page?: number
  pageSize?: number
}

export interface AdminOpportunityPage {
  items: AdminOpportunity[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

const jobs = collection(db, collections.jobs)

function searchTokens(search?: string): string[] {
  return (search ?? '')
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((token) => token.length >= 2)
    .slice(0, 10)
}

function buildConstraints(input: AdminOpportunityQuery): QueryConstraint[] {
  const constraints: QueryConstraint[] = []
  if (input.userId) constraints.push(where('userId', '==', input.userId))
  if (input.status) constraints.push(where('status', '==', input.status))
  if (input.source) constraints.push(where('source', '==', input.source))
  const tokens = searchTokens(input.search)
  if (tokens.length > 0) {
    constraints.push(where('searchTokens', 'array-contains-any', tokens))
  }
  constraints.push(orderBy('discoveredAt', 'desc'))
  return constraints
}

export async function loadAdminOpportunitiesPage(
  input: AdminOpportunityQuery = {},
): Promise<AdminOpportunityPage> {
  const page = Math.max(1, input.page ?? 1)
  const pageSize = Math.max(1, input.pageSize ?? 25)
  const constraints = buildConstraints(input)

  const [snapshot, countSnapshot] = await Promise.all([
    getDocs(
      query(
        jobs,
        ...constraints,
        limit(page * pageSize),
      ),
    ),
    getCountFromServer(query(jobs, ...constraints)),
  ])

  const total = countSnapshot.data().count
  const pageDocs = snapshot.docs.slice((page - 1) * pageSize)
  return {
    items: pageDocs.map((document) =>
      toAdminOpportunity(document.id, document.data()),
    ),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
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
