import {
  collection,
  doc,
  getDoc,
  getDocs,
  getCountFromServer,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  type DocumentData,
  type QueryConstraint,
  type QueryDocumentSnapshot,
  type Timestamp,
} from 'firebase/firestore'
import { db } from '@/services/firestore'
import { collections } from '@/services/collections'
import type { Company } from '@/types/companies'

const companiesCollection = collection(db, collections.companies)

export type CompanyResearchFilter = 'all' | 'researched' | 'unresearched'

export interface CompanyPageOptions {
  pageSize?: number
  cursor?: QueryDocumentSnapshot<DocumentData> | null
  search?: string
  research?: CompanyResearchFilter
}

export interface CompanyPage {
  companies: Company[]
  cursor: QueryDocumentSnapshot<DocumentData> | null
  hasMore: boolean
}

function searchTokens(term: string): string[] {
  return term
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((token) => token.length >= 2)
    .slice(0, 10)
}

function buildConstraints(uid: string, options: CompanyPageOptions): QueryConstraint[] {
  const constraints: QueryConstraint[] = [where('userId', '==', uid)]
  if (options.research === 'researched') {
    constraints.push(where('researched', '==', true))
  } else if (options.research === 'unresearched') {
    constraints.push(where('researched', '==', false))
  }
  const tokens = options.search ? searchTokens(options.search) : []
  if (tokens.length > 0) {
    constraints.push(where('searchTokens', 'array-contains-any', tokens))
  }
  return constraints
}

export async function listCompaniesPage(
  uid: string,
  options: CompanyPageOptions = {},
): Promise<CompanyPage> {
  const pageSize = options.pageSize ?? 30
  const constraints = buildConstraints(uid, options)
  constraints.push(orderBy('updatedAt', 'desc'))
  if (options.cursor) constraints.push(startAfter(options.cursor))
  constraints.push(limit(pageSize + 1))

  const snapshot = await getDocs(query(companiesCollection, ...constraints))
  const hasMore = snapshot.docs.length > pageSize
  const pageDocs = hasMore ? snapshot.docs.slice(0, pageSize) : snapshot.docs

  return {
    companies: pageDocs.map((document) => toCompany(document.id, document.data())),
    cursor: pageDocs.length > 0 ? pageDocs[pageDocs.length - 1] : null,
    hasMore,
  }
}

export async function countCompanies(
  uid: string,
  options: CompanyPageOptions = {},
): Promise<number> {
  const constraints = buildConstraints(uid, options)
  const snapshot = await getCountFromServer(query(companiesCollection, ...constraints))
  return snapshot.data().count
}

export async function getCompany(id: string): Promise<Company | null> {
  const snapshot = await getDoc(doc(companiesCollection, id))
  if (!snapshot.exists()) {
    return null
  }
  return toCompany(snapshot.id, snapshot.data())
}

export function toCompany(id: string, data: DocumentData): Company {
  return {
    id,
    userId: data.userId,
    name: data.name ?? 'Unknown company',
    website: data.website,
    industry: data.industry,
    description: data.description,
    product: data.product,
    roleContext: data.roleContext,
    hiringSignals: data.hiringSignals ?? [],
    researchSummary: data.researchSummary,
    sourceUrls: data.sourceUrls ?? [],
    location: data.location,
    jobCount: data.jobCount ?? 0,
    researched: data.researched ?? Boolean(data.lastResearchedAt),
    lastSeenAt: data.lastSeenAt as Timestamp | undefined,
    lastResearchedAt: data.lastResearchedAt as Timestamp | undefined,
    createdAt: data.createdAt as Timestamp | undefined,
    updatedAt: data.updatedAt as Timestamp | undefined,
  }
}
